import { GameActionOutcome, GameStateSnapshot, GameStatus, GameTileState, MahjongGameEngine } from './mahjong-game-engine';
import { MahjongTile } from './mahjong-tile';

export enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard'
}

export const HINT_LIMIT_BY_DIFFICULTY: Record<Difficulty, number> = {
  [Difficulty.Easy]: 6,
  [Difficulty.Medium]: 3,
  [Difficulty.Hard]: 0
};

export enum HintRequestOutcome {
  Shown = 'shown',
  NoHintsLeft = 'no-hints-left',
  NoMatchAvailable = 'no-match-available',
  NotStarted = 'not-started'
}

export interface GameDebugSnapshot {
  difficultyHintLimit: number;
  hintsUsed: number;
  hintsRemaining: number;
  hintedTileIds: number[];
  engine: ReturnType<MahjongGameEngine['getDebugSnapshot']>;
}

export class MahjongGame {
  readonly #boardElement: HTMLElement;
  readonly #potElement: HTMLElement;
  readonly #engine = new MahjongGameEngine();
  readonly #views = new Map<number, MahjongTile>();
  readonly #hintDurationMs = 1500;
  readonly #matchAnimationMs = 240;
  #hintLimit = HINT_LIMIT_BY_DIFFICULTY[Difficulty.Medium];
  #hintsUsed = 0;
  #hintedTileIds: number[] = [];
  #hintTimeoutId?: number;
  #matchAnimationTimeoutId?: number;
  #isMatchAnimating = false;
  #lastKnownStatus = GameStatus.Idle;
  #onStatusChange?: (status: GameStatus) => void;
  #initDone = false;

  constructor(boardElement: HTMLElement, potElement: HTMLElement) {
    this.#boardElement = boardElement;
    this.#potElement = potElement;
  }

  init(): void {
    if (this.#initDone) {
      return;
    }

    this.#boardElement.addEventListener('click', this.clickBoard);
    this.#engine.init();
    this.#lastKnownStatus = this.#engine.getStatus();
    this.render();
    this.#initDone = true;
  }

  getPot(): void {
    const state = this.#engine.getState();
    console.log('Pot Length =', state.pot.length);
    state.pot.forEach((tile) => console.log({ type: tile.type, value: tile.value }));
  }

  getBoard(columnIndex: number, tileIndex: number): void {
    const state = this.#engine.getState();
    const tile = state.columns[columnIndex]?.[tileIndex];
    if (!tile) {
      console.warn('Board position is empty', columnIndex, tileIndex);
      return;
    }

    console.log({ type: tile.type, value: tile.value });
  }

  isStarted(): boolean {
    return this.#engine.isStarted();
  }

  getStatus(): GameStatus {
    return this.#engine.getStatus();
  }

  setStatusChangeHandler(handler: (status: GameStatus) => void): void {
    this.#onStatusChange = handler;
  }

  setDifficulty(difficulty: Difficulty): void {
    this.#hintLimit = HINT_LIMIT_BY_DIFFICULTY[difficulty];
    this.#hintsUsed = 0;
    this.clearHintHighlight();
  }

  getRemainingHints(): number {
    return Math.max(this.#hintLimit - this.#hintsUsed, 0);
  }

  reset(): void {
    this.cancelMatchAnimation();
    this.clearHintHighlight();
    this.#hintsUsed = 0;
    this.#engine.reset();
    this.render();
    this.notifyStatusChangeIfNeeded();
  }

  start(): void {
    try {
      this.cancelMatchAnimation();
      this.clearHintHighlight();
      this.#hintsUsed = 0;
      this.#engine.start();
      this.render();
      this.notifyStatusChangeIfNeeded();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to start the game.');
    }
  }

  showHint(): HintRequestOutcome {
    if (!this.isStarted()) {
      return HintRequestOutcome.NotStarted;
    }

    if (this.getRemainingHints() <= 0) {
      return HintRequestOutcome.NoHintsLeft;
    }

    this.clearHintHighlight();
    const hint = this.#engine.findHintMatch();
    if (!hint) {
      return HintRequestOutcome.NoMatchAvailable;
    }

    this.#hintedTileIds = [...hint.tileIds];
    this.#hintedTileIds.forEach((tileId) => this.#views.get(tileId)?.showHint());
    this.#hintTimeoutId = window.setTimeout(() => this.clearHintHighlight(), this.#hintDurationMs);
    this.#hintsUsed += 1;
    return HintRequestOutcome.Shown;
  }

  getDebugSnapshot(): GameDebugSnapshot {
    return {
      difficultyHintLimit: this.#hintLimit,
      hintsUsed: this.#hintsUsed,
      hintsRemaining: this.getRemainingHints(),
      hintedTileIds: [...this.#hintedTileIds],
      engine: this.#engine.getDebugSnapshot()
    };
  }

  getDebugSnapshotJson(space = 2): string {
    return JSON.stringify(this.getDebugSnapshot(), null, space);
  }

  private renderBoardColumns(columnCount: number): HTMLDivElement[] {
    this.#boardElement.innerHTML = '';
    const columns: HTMLDivElement[] = [];

    for (let i = 0; i < columnCount; i += 1) {
      const column = document.createElement('div');
      column.classList.add('col');
      this.#boardElement.appendChild(column);
      columns.push(column);
    }

    return columns;
  }

  private getOrCreateView(tile: GameTileState): MahjongTile {
    let view = this.#views.get(tile.id);
    if (!view) {
      view = new MahjongTile(tile.type, tile.value, () => true, () => {
        if (this.#isMatchAnimating) {
          return;
        }

        this.clearHintHighlight();
        const beforeState = this.#engine.getState();
        const result = this.#engine.interactWithTile(tile.id);
        this.handleActionResult(beforeState, result.outcome);
      });
      this.#views.set(tile.id, view);
    }

    return view;
  }

  private applyTileState(tile: GameTileState): MahjongTile {
    const view = this.getOrCreateView(tile);
    if (tile.visible) {
      view.flipTile(true);
    } else if (view.isVisible()) {
      view.flipTile(false);
    }

    if (tile.selected) {
      view.select();
    } else {
      view.unselect();
    }

    view.setPlayable(false);

    return view;
  }

  private render(): void {
    const state = this.#engine.getState();
    const columns = this.renderBoardColumns(state.columnCount);
    this.#potElement.innerHTML = '';
    const activeTileIds = new Set<number>();

    state.columns.forEach((column, columnIndex) => {
      column.forEach((tile, tileIndex) => {
        const view = this.applyTileState(tile);
        const element = view.getElement();
        element.classList.remove('matched');
        element.style.setProperty('--stack-depth', `${Math.min(tileIndex, 3)}`);
        element.style.setProperty('--stack-index', `${tileIndex}`);
        columns[columnIndex].appendChild(element);
        activeTileIds.add(tile.id);
      });
    });

    state.pot.forEach((tile) => {
      const view = this.applyTileState(tile);
      const element = view.getElement();
      element.classList.remove('matched');
      element.style.setProperty('--stack-depth', '0');
      element.style.setProperty('--stack-index', '0');
      this.#potElement.appendChild(element);
      activeTileIds.add(tile.id);
    });

    this.#views.forEach((view, tileId) => {
      if (!activeTileIds.has(tileId)) {
        view.getElement().remove();
        view.unselect();
        view.clearHint();
        if (view.isVisible()) {
          view.flipTile(false);
        }
      }
    });

    this.#hintedTileIds.forEach((tileId) => {
      this.#views.get(tileId)?.showHint();
    });

    this.markPlayableTiles(state);
  }

  private clearHintHighlight(): void {
    if (this.#hintTimeoutId !== undefined) {
      window.clearTimeout(this.#hintTimeoutId);
      this.#hintTimeoutId = undefined;
    }

    this.#hintedTileIds.forEach((tileId) => this.#views.get(tileId)?.clearHint());
    this.#hintedTileIds = [];
  }

  private notifyStatusChangeIfNeeded(): void {
    const status = this.#engine.getStatus();
    if (status === this.#lastKnownStatus) {
      return;
    }

    this.#lastKnownStatus = status;
    this.#onStatusChange?.(status);
  }

  private markPlayableTiles(state: GameStateSnapshot): void {
    state.columns.forEach((column) => {
      const topTile = column[0];
      if (topTile) {
        this.#views.get(topTile.id)?.setPlayable(true);
      }
    });

    const potTop = state.pot.at(-1);
    if (potTop) {
      this.#views.get(potTop.id)?.setPlayable(true);
    }
  }

  private getActiveTileIds(state: GameStateSnapshot): Set<number> {
    const activeTileIds = new Set<number>();

    state.columns.forEach((column) => {
      column.forEach((tile) => activeTileIds.add(tile.id));
    });

    state.pot.forEach((tile) => activeTileIds.add(tile.id));
    return activeTileIds;
  }

  private animateMatchedTilesAndRerender(beforeState: GameStateSnapshot, afterState: GameStateSnapshot): void {
    const beforeIds = this.getActiveTileIds(beforeState);
    const afterIds = this.getActiveTileIds(afterState);
    const removedIds = [...beforeIds].filter((tileId) => !afterIds.has(tileId));

    if (removedIds.length === 0) {
      this.render();
      this.notifyStatusChangeIfNeeded();
      return;
    }

    this.#isMatchAnimating = true;
    removedIds.forEach((tileId) => {
      this.#views.get(tileId)?.markMatched();
      this.#views.get(tileId)?.setPlayable(false);
    });

    this.#matchAnimationTimeoutId = window.setTimeout(() => {
      this.#matchAnimationTimeoutId = undefined;
      this.#isMatchAnimating = false;
      this.render();
      this.notifyStatusChangeIfNeeded();
    }, this.#matchAnimationMs);
  }

  private handleActionResult(beforeState: GameStateSnapshot, outcome: GameActionOutcome): void {
    if (outcome === GameActionOutcome.Ignored) {
      return;
    }

    const afterState = this.#engine.getState();
    if (outcome === GameActionOutcome.Matched) {
      this.animateMatchedTilesAndRerender(beforeState, afterState);
      return;
    }

    this.render();
    this.notifyStatusChangeIfNeeded();
  }

  private cancelMatchAnimation(): void {
    if (this.#matchAnimationTimeoutId !== undefined) {
      window.clearTimeout(this.#matchAnimationTimeoutId);
      this.#matchAnimationTimeoutId = undefined;
    }

    this.#isMatchAnimating = false;
  }

  private readonly clickBoard = (event: MouseEvent): void => {
    if (this.#isMatchAnimating) {
      return;
    }

    this.clearHintHighlight();
    const boardRect = this.#boardElement.getBoundingClientRect();
    const x = event.clientX - boardRect.left;
    const state = this.#engine.getState();
    const columnWidth = boardRect.width / state.columnCount;
    const clickedColumn = Math.floor(x / columnWidth);

    if (clickedColumn < 0 || clickedColumn >= state.columnCount) {
      return;
    }

    const beforeState = this.#engine.getState();
    const result = this.#engine.placeSelectedPotTile(clickedColumn);
    this.handleActionResult(beforeState, result.outcome);
  };
}
