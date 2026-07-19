import { canTilesMatch } from './game-rules';
import { TileInfo, TileType } from './mahjong-tile';

enum SelectionSource {
  Board = 'board',
  Pot = 'pot'
}

export enum GameStatus {
  Idle = 'idle',
  Running = 'running',
  Won = 'won',
  Lost = 'lost'
}

export enum GameActionOutcome {
  Ignored = 'ignored',
  Selected = 'selected',
  SelectionCleared = 'selection-cleared',
  Matched = 'matched',
  MovedPotToBoard = 'moved-pot-to-board'
}

export interface GameActionResult {
  outcome: GameActionOutcome;
  changed: boolean;
  status: GameStatus;
}

export interface GameHint {
  tileIds: [number, number];
}

export interface GameTileState extends TileInfo {
  id: number;
  visible: boolean;
  selected: boolean;
}

export interface GameStateSnapshot {
  columnCount: number;
  started: boolean;
  status: GameStatus;
  columns: GameTileState[][];
  pot: GameTileState[];
  trash: GameTileState[];
}

export interface EngineDebugSnapshot {
  state: GameStateSnapshot;
  selectedTileId?: number;
  selectedFrom?: 'board' | 'pot';
  deck: GameTileState[];
  turnHistory: TurnHistoryEntry[];
}

export type TurnAction = 'start' | 'interact-tile' | 'place-selected-pot-tile' | 'reset';

export interface TurnHistoryEntry {
  turn: number;
  timestamp: string;
  action: TurnAction;
  statusBefore: GameStatus;
  statusAfter: GameStatus;
  outcome?: GameActionOutcome;
  changed?: boolean;
  tileId?: number;
  columnIndex?: number;
}

export class MahjongGameEngine {
  readonly #columnCount = 18;
  readonly #maxStartShuffleAttempts = 64;
  #initDone = false;
  #status = GameStatus.Idle;
  #deck: GameTileState[] = [];
  #columns: GameTileState[][] = [];
  #pot: GameTileState[] = [];
  #trash: GameTileState[] = [];
  #selectedTileId?: number;
  #selectedFrom?: SelectionSource;
  #turnHistory: TurnHistoryEntry[] = [];
  #turnCounter = 0;

  init(): void {
    if (this.#initDone) {
      return;
    }

    this.resetDeck();
    this.shuffleDeck(5);
    this.resetGameState();
    this.#initDone = true;
  }

  reset(): void {
    if (!this.#initDone) {
      return;
    }

    const previousStatus = this.#status;
    this.resetDeck();
    this.shuffleDeck(5);
    this.resetGameState();
    this.recordTurn({
      action: 'reset',
      statusBefore: previousStatus,
      statusAfter: this.#status
    });
  }

  start(): void {
    if (!this.#initDone) {
      throw new Error('init should be called first');
    }

    if (this.isStarted()) {
      throw new Error('A game is already started. Please reset first.');
    }

    let didFindPlayableStart = false;
    for (let attempt = 0; attempt < this.#maxStartShuffleAttempts; attempt += 1) {
      if (attempt > 0) {
        this.shuffleDeck(1);
      }

      this.dealFromDeck();
      this.#status = GameStatus.Running;
      this.updateStatus();
      if (this.#status === GameStatus.Running) {
        didFindPlayableStart = true;
        break;
      }
    }

    if (!didFindPlayableStart) {
      this.resetGameState();
      throw new Error('Unable to generate a playable starting board. Please try again.');
    }

    this.resetTurnHistory();
    const previousStatus = GameStatus.Idle;
    this.recordTurn({
      action: 'start',
      statusBefore: previousStatus,
      statusAfter: this.#status
    });
  }

  isStarted(): boolean {
    return this.#status !== GameStatus.Idle;
  }

  getStatus(): GameStatus {
    return this.#status;
  }

  findHintMatch(): GameHint | null {
    if (this.#status !== GameStatus.Running) {
      return null;
    }

    const playableTiles = this.getPlayableTiles();
    const selectedTile = this.findSelectedTile();
    if (selectedTile) {
      for (const candidateTile of playableTiles) {
        if (candidateTile.id === selectedTile.id) {
          continue;
        }

        if (this.canMatch(selectedTile, candidateTile)) {
          return { tileIds: [selectedTile.id, candidateTile.id] };
        }
      }
    }

    for (let i = 0; i < playableTiles.length; i += 1) {
      for (let j = i + 1; j < playableTiles.length; j += 1) {
        if (this.canMatch(playableTiles[i], playableTiles[j])) {
          return { tileIds: [playableTiles[i].id, playableTiles[j].id] };
        }
      }
    }

    return null;
  }

  interactWithTile(tileId: number): GameActionResult {
    const statusBefore = this.#status;

    if (!this.isStarted()) {
      const result = this.createActionResult(GameActionOutcome.Ignored, false);
      this.recordTurn({
        action: 'interact-tile',
        statusBefore,
        statusAfter: result.status,
        outcome: result.outcome,
        changed: result.changed,
        tileId
      });
      return result;
    }

    const tile = this.findTileById(tileId);
    if (!tile || !tile.visible) {
      const result = this.createActionResult(GameActionOutcome.Ignored, false);
      this.recordTurn({
        action: 'interact-tile',
        statusBefore,
        statusAfter: result.status,
        outcome: result.outcome,
        changed: result.changed,
        tileId
      });
      return result;
    }

    let result: GameActionResult;
    if (tile.id === this.#selectedTileId) {
      this.clearSelection();
      result = this.createActionResult(GameActionOutcome.SelectionCleared, true);
    } else {
      const potTile = this.#pot.at(-1);
      if (potTile && potTile.id === tile.id) {
        result = this.handlePotTileClick(tile);
      } else {
        const boardLocation = this.findBoardTile(tile.id);
        if (boardLocation && boardLocation.tileIndex === 0) {
          result = this.handleBoardTileClick(boardLocation.columnIndex);
        } else {
          result = this.createActionResult(GameActionOutcome.Ignored, false);
        }
      }
    }

    this.recordTurn({
      action: 'interact-tile',
      statusBefore,
      statusAfter: result.status,
      outcome: result.outcome,
      changed: result.changed,
      tileId
    });
    return result;
  }

  placeSelectedPotTile(columnIndex: number): GameActionResult {
    const statusBefore = this.#status;

    if (!this.isStarted()) {
      const result = this.createActionResult(GameActionOutcome.Ignored, false);
      this.recordTurn({
        action: 'place-selected-pot-tile',
        statusBefore,
        statusAfter: result.status,
        outcome: result.outcome,
        changed: result.changed,
        columnIndex
      });
      return result;
    }

    if (!this.#selectedTileId || this.#selectedFrom !== SelectionSource.Pot) {
      const result = this.createActionResult(GameActionOutcome.Ignored, false);
      this.recordTurn({
        action: 'place-selected-pot-tile',
        statusBefore,
        statusAfter: result.status,
        outcome: result.outcome,
        changed: result.changed,
        columnIndex
      });
      return result;
    }

    if (columnIndex < 0 || columnIndex >= this.#columnCount) {
      const result = this.createActionResult(GameActionOutcome.Ignored, false);
      this.recordTurn({
        action: 'place-selected-pot-tile',
        statusBefore,
        statusAfter: result.status,
        outcome: result.outcome,
        changed: result.changed,
        columnIndex
      });
      return result;
    }

    const selectedTile = this.findSelectedTile();
    if (!selectedTile) {
      const result = this.createActionResult(GameActionOutcome.Ignored, false);
      this.recordTurn({
        action: 'place-selected-pot-tile',
        statusBefore,
        statusAfter: result.status,
        outcome: result.outcome,
        changed: result.changed,
        columnIndex
      });
      return result;
    }

    let result: GameActionResult;
    const topTile = this.#columns[columnIndex][0];
    if (topTile && this.canMatch(selectedTile, topTile)) {
      result = this.handleBoardTileClick(columnIndex);
    } else if (!topTile) {
      this.moveSelectedPotTileToColumn(columnIndex);
      this.updateStatus();
      result = this.createActionResult(GameActionOutcome.MovedPotToBoard, true);
    } else {
      result = this.createActionResult(GameActionOutcome.Ignored, false);
    }

    this.recordTurn({
      action: 'place-selected-pot-tile',
      statusBefore,
      statusAfter: result.status,
      outcome: result.outcome,
      changed: result.changed,
      columnIndex
    });
    return result;
  }

  // Compatibility wrappers for older callers.
  clickTile(tileId: number): void {
    this.interactWithTile(tileId);
  }

  clickColumn(columnIndex: number): void {
    this.placeSelectedPotTile(columnIndex);
  }

  getState(): GameStateSnapshot {
    return {
      columnCount: this.#columnCount,
      started: this.isStarted(),
      status: this.#status,
      columns: this.#columns.map((column) => column.map((tile) => ({ ...tile }))),
      pot: this.#pot.map((tile) => ({ ...tile })),
      trash: this.#trash.map((tile) => ({ ...tile }))
    };
  }

  getDebugSnapshot(): EngineDebugSnapshot {
    return {
      state: this.getState(),
      selectedTileId: this.#selectedTileId,
      selectedFrom: this.#selectedFrom,
      deck: this.#deck.map((tile) => ({ ...tile })),
      turnHistory: this.#turnHistory.map((entry) => ({ ...entry }))
    };
  }

  private resetTurnHistory(): void {
    this.#turnHistory = [];
    this.#turnCounter = 0;
  }

  private recordTurn(entry: Omit<TurnHistoryEntry, 'turn' | 'timestamp'>): void {
    this.#turnCounter += 1;
    this.#turnHistory.push({
      turn: this.#turnCounter,
      timestamp: new Date().toISOString(),
      ...entry
    });

    if (this.#turnHistory.length > 500) {
      this.#turnHistory.shift();
    }
  }

  private resetDeck(): void {
    this.#deck = [];
    let id = 1;

    for (let copy = 0; copy < 4; copy += 1) {
      for (let type = TileType.Wheels; type <= TileType.Bamboos; type += 1) {
        for (let value = 1; value <= 9; value += 1) {
          this.#deck.push(this.createTile(id, type, value));
          id += 1;
        }
      }

      for (let value = 1; value <= 7; value += 1) {
        this.#deck.push(this.createTile(id, TileType.Winds, value));
        id += 1;
      }
    }

    for (let value = 1; value <= 8; value += 1) {
      this.#deck.push(this.createTile(id, TileType.Flowers, value));
      id += 1;
    }
  }

  private shuffleDeck(iterations = 1): void {
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      for (let index = this.#deck.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [this.#deck[index], this.#deck[swapIndex]] = [this.#deck[swapIndex], this.#deck[index]];
      }
    }
  }

  private createTile(id: number, type: TileType, value: number): GameTileState {
    return {
      id,
      type,
      value,
      visible: false,
      selected: false
    };
  }

  private cloneDeckTile(index: number): GameTileState {
    return { ...this.#deck[index] };
  }

  private dealFromDeck(): void {
    this.#columns = this.createEmptyBoard();
    this.#pot = [];
    this.#trash = [];
    this.clearSelection();

    let columnIndex = 0;
    for (let index = 0; index < 108; index += 1) {
      const tile = this.cloneDeckTile(index);
      this.#columns[columnIndex].push(tile);
      columnIndex += 1;

      if (columnIndex >= this.#columnCount) {
        columnIndex = 0;
      }
    }

    for (let index = 108; index < this.#deck.length; index += 1) {
      this.#pot.push(this.cloneDeckTile(index));
    }

    this.#columns.forEach((column) => {
      if (column[0]) {
        this.revealTile(column[0]);
      }
    });

    const topPotTile = this.#pot.at(-1);
    if (topPotTile) {
      this.revealTile(topPotTile);
    }
  }

  private createEmptyBoard(): GameTileState[][] {
    return Array.from({ length: this.#columnCount }, () => [] as GameTileState[]);
  }

  private resetGameState(): void {
    this.#columns = this.createEmptyBoard();
    this.#pot = [];
    this.#trash = [];
    this.clearSelection();
    this.#status = GameStatus.Idle;
  }

  private revealTile(tile: GameTileState): void {
    tile.visible = true;
  }

  private createActionResult(outcome: GameActionOutcome, changed: boolean): GameActionResult {
    return {
      outcome,
      changed,
      status: this.#status
    };
  }

  private clearSelection(): void {
    const selectedTile = this.findSelectedTile();
    if (selectedTile) {
      selectedTile.selected = false;
    }

    this.#selectedTileId = undefined;
    this.#selectedFrom = undefined;
  }

  private setSelection(tile: GameTileState, source: SelectionSource): void {
    this.clearSelection();
    tile.selected = true;
    this.#selectedTileId = tile.id;
    this.#selectedFrom = source;
  }

  private findTileById(tileId: number): GameTileState | undefined {
    return this.#columns.flat().find((tile) => tile.id === tileId) ?? this.#pot.find((tile) => tile.id === tileId);
  }

  private findSelectedTile(): GameTileState | undefined {
    return this.#selectedTileId ? this.findTileById(this.#selectedTileId) : undefined;
  }

  private findBoardTile(tileId: number): { columnIndex: number; tileIndex: number } | undefined {
    for (let columnIndex = 0; columnIndex < this.#columnCount; columnIndex += 1) {
      const tileIndex = this.#columns[columnIndex].findIndex((tile) => tile.id === tileId);
      if (tileIndex >= 0) {
        return { columnIndex, tileIndex };
      }
    }

    return undefined;
  }

  private canMatch(tile1: GameTileState, tile2: GameTileState): boolean {
    return canTilesMatch(tile1, tile2);
  }

  private moveSelectedPotTileToColumn(columnIndex: number): void {
    const selectedTile = this.findSelectedTile();
    if (!selectedTile) {
      return;
    }

    const movedTile = this.#pot.pop();
    if (!movedTile || movedTile.id !== selectedTile.id) {
      return;
    }

    movedTile.selected = false;
    movedTile.visible = true;
    this.#columns[columnIndex].splice(0, 0, movedTile);
    const topPotTile = this.#pot.at(-1);
    if (topPotTile) {
      this.revealTile(topPotTile);
    }
    this.clearSelection();
  }

  private removeMatchedTile(tile: GameTileState): void {
    const boardLocation = this.findBoardTile(tile.id);
    if (boardLocation) {
      const [removedTile] = this.#columns[boardLocation.columnIndex].splice(boardLocation.tileIndex, 1);
      if (removedTile) {
        removedTile.selected = false;
        this.#trash.push(removedTile);
      }

      const nextBoardTopTile = this.#columns[boardLocation.columnIndex][0];
      if (nextBoardTopTile) {
        this.revealTile(nextBoardTopTile);
      }
      return;
    }

    const potIndex = this.#pot.findIndex((potTile) => potTile.id === tile.id);
    if (potIndex >= 0) {
      const [removedTile] = this.#pot.splice(potIndex, 1);
      if (removedTile) {
        removedTile.selected = false;
        this.#trash.push(removedTile);
      }

      const topPotTile = this.#pot.at(-1);
      if (topPotTile) {
        this.revealTile(topPotTile);
      }
    }
  }

  private handlePotTileClick(tile: GameTileState): GameActionResult {
    const selectedTile = this.findSelectedTile();
    if (!selectedTile) {
      this.setSelection(tile, SelectionSource.Pot);
      return this.createActionResult(GameActionOutcome.Selected, true);
    }

    if (!this.canMatch(tile, selectedTile)) {
      this.clearSelection();
      return this.createActionResult(GameActionOutcome.SelectionCleared, true);
    }

    this.removeMatchedTile(tile);
    this.removeMatchedTile(selectedTile);
    this.clearSelection();
    this.updateStatus();
    return this.createActionResult(GameActionOutcome.Matched, true);
  }

  private handleBoardTileClick(columnIndex: number): GameActionResult {
    const tile = this.#columns[columnIndex][0];
    if (!tile) {
      return this.createActionResult(GameActionOutcome.Ignored, false);
    }

    const selectedTile = this.findSelectedTile();
    if (!selectedTile) {
      this.setSelection(tile, SelectionSource.Board);
      return this.createActionResult(GameActionOutcome.Selected, true);
    }

    if (tile.id === selectedTile.id) {
      return this.createActionResult(GameActionOutcome.Ignored, false);
    }

    if (this.canMatch(tile, selectedTile)) {
      this.removeMatchedTile(tile);
      this.removeMatchedTile(selectedTile);
      this.clearSelection();
      this.updateStatus();
      return this.createActionResult(GameActionOutcome.Matched, true);
    }

    if (this.#selectedFrom === SelectionSource.Pot) {
      return this.placeSelectedPotTile(columnIndex);
    }

    return this.createActionResult(GameActionOutcome.Ignored, false);
  }

  private getPlayableTiles(): GameTileState[] {
    const boardTopTiles = this.#columns.map((column) => column[0]).filter((tile): tile is GameTileState => Boolean(tile));
    const potTopTile = this.#pot.at(-1);

    return potTopTile ? [...boardTopTiles, potTopTile] : boardTopTiles;
  }

  private hasAnyPlayableMove(): boolean {
    const boardTopTiles = this.#columns.map((column) => column[0]).filter((tile): tile is GameTileState => Boolean(tile));
    for (let i = 0; i < boardTopTiles.length; i += 1) {
      for (let j = i + 1; j < boardTopTiles.length; j += 1) {
        if (this.canMatch(boardTopTiles[i], boardTopTiles[j])) {
          return true;
        }
      }
    }

    const potTopTile = this.#pot.at(-1);
    if (potTopTile) {
      if (boardTopTiles.some((boardTile) => this.canMatch(potTopTile, boardTile))) {
        return true;
      }

      if (this.#columns.some((column) => column.length === 0)) {
        return true;
      }
    }

    return false;
  }

  private updateStatus(): void {
    if (this.#status === GameStatus.Idle) {
      return;
    }

    const hasTilesLeft = this.#columns.some((column) => column.length > 0) || this.#pot.length > 0;
    if (!hasTilesLeft) {
      this.#status = GameStatus.Won;
      return;
    }

    if (!this.hasAnyPlayableMove()) {
      this.#status = GameStatus.Lost;
      return;
    }

    this.#status = GameStatus.Running;
  }
}