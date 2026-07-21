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

export class MahjongGame {
  private readonly boardElement: HTMLElement;
  private readonly potElement: HTMLElement;
  private readonly engine = new MahjongGameEngine();
  private readonly views = new Map<number, MahjongTile>();
  private readonly hintDurationMs = 1500;
  private readonly matchAnimationMs = 240;
  
  private hintLimit = HINT_LIMIT_BY_DIFFICULTY[Difficulty.Medium];
  private hintsUsed = 0;
  private hintedTileIds: number[] = [];
  private hintTimeoutId?: number;
  private matchAnimationTimeoutId?: number;
  private isMatchAnimating = false;
  private lastKnownStatus = GameStatus.Idle;
  private onStatusChange?: (status: GameStatus) => void;
  private initDone = false;

  constructor(boardElement: HTMLElement, potElement: HTMLElement) {
    this.boardElement = boardElement;
    this.potElement = potElement;
  }

  init(): void {
    if (this.initDone) {
      return;
    }

    this.boardElement.addEventListener('click', this.clickBoard);
    this.engine.init();
    this.lastKnownStatus = this.engine.status;
    this.render();
    this.initDone = true;
  }

  get isStarted(): boolean {
    return this.engine.isStarted;
  }

  get status(): GameStatus {
    return this.engine.status;
  }

  get remainingHints(): number {
    return Math.max(this.hintLimit - this.hintsUsed, 0);
  }

  setStatusChangeHandler(handler: (status: GameStatus) => void): void {
    this.onStatusChange = handler;
  }

  setDifficulty(difficulty: Difficulty): void {
    this.hintLimit = HINT_LIMIT_BY_DIFFICULTY[difficulty];
    this.hintsUsed = 0;
    this.clearHintHighlight();
  }

  reset(): void {
    this.cancelMatchAnimation();
    this.clearHintHighlight();
    this.hintsUsed = 0;
    this.engine.reset();
    this.render();
    this.notifyStatusChangeIfNeeded();
  }

  start(): void {
    try {
      this.cancelMatchAnimation();
      this.clearHintHighlight();
      this.hintsUsed = 0;
      this.engine.start();
      this.render();
      this.notifyStatusChangeIfNeeded();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to start the game.');
    }
  }

  showHint(): HintRequestOutcome {
    if (!this.isStarted) {
      return HintRequestOutcome.NotStarted;
    }

    if (this.remainingHints <= 0) {
      return HintRequestOutcome.NoHintsLeft;
    }

    this.clearHintHighlight();
    const hint = this.engine.findHintMatch();
    if (!hint) {
      return HintRequestOutcome.NoMatchAvailable;
    }

    this.hintedTileIds = [...hint.tileIds];
    this.hintedTileIds.forEach((tileId) => this.views.get(tileId)?.showHint());
    this.hintTimeoutId = window.setTimeout(() => this.clearHintHighlight(), this.hintDurationMs);
    this.hintsUsed += 1;
    return HintRequestOutcome.Shown;
  }

  private renderBoardColumns(columnCount: number): HTMLDivElement[] {
    this.boardElement.innerHTML = '';
    const columns: HTMLDivElement[] = [];

    for (let i = 0; i < columnCount; i += 1) {
      const column = document.createElement('div');
      column.classList.add('col');
      this.boardElement.appendChild(column);
      columns.push(column);
    }

    return columns;
  }

  private getOrCreateView(tile: GameTileState): MahjongTile {
    let view = this.views.get(tile.id);
    if (!view) {
      view = new MahjongTile(tile.type, tile.value, () => true, () => {
        if (this.isMatchAnimating) {
          return;
        }

        this.clearHintHighlight();
        const beforeState = this.engine.state;
        const result = this.engine.interactWithTile(tile.id);
        this.handleActionResult(beforeState, result.outcome);
      });
      this.views.set(tile.id, view);
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
    const state = this.engine.state;
    const columns = this.renderBoardColumns(state.columnCount);
    this.potElement.innerHTML = '';
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
      this.potElement.appendChild(element);
      activeTileIds.add(tile.id);
    });

    this.views.forEach((view, tileId) => {
      if (!activeTileIds.has(tileId)) {
        view.getElement().remove();
        view.unselect();
        view.clearHint();
        if (view.isVisible()) {
          view.flipTile(false);
        }
      }
    });

    this.hintedTileIds.forEach((tileId) => {
      this.views.get(tileId)?.showHint();
    });

    this.markPlayableTiles(state);
  }

  private clearHintHighlight(): void {
    if (this.hintTimeoutId !== undefined) {
      window.clearTimeout(this.hintTimeoutId);
      this.hintTimeoutId = undefined;
    }

    this.hintedTileIds.forEach((tileId) => this.views.get(tileId)?.clearHint());
    this.hintedTileIds = [];
  }

  private notifyStatusChangeIfNeeded(): void {
    const status = this.engine.status;
    if (status === this.lastKnownStatus) {
      return;
    }

    this.lastKnownStatus = status;
    this.onStatusChange?.(status);
  }

  private markPlayableTiles(state: GameStateSnapshot): void {
    state.columns.forEach((column) => {
      const topTile = column[0];
      if (topTile) {
        this.views.get(topTile.id)?.setPlayable(true);
      }
    });

    const potTop = state.pot.at(-1);
    if (potTop) {
      this.views.get(potTop.id)?.setPlayable(true);
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

    this.isMatchAnimating = true;
    removedIds.forEach((tileId) => {
      this.views.get(tileId)?.markMatched();
      this.views.get(tileId)?.setPlayable(false);
    });

    this.matchAnimationTimeoutId = window.setTimeout(() => {
      this.matchAnimationTimeoutId = undefined;
      this.isMatchAnimating = false;
      this.render();
      this.notifyStatusChangeIfNeeded();
    }, this.matchAnimationMs);
  }

  private handleActionResult(beforeState: GameStateSnapshot, outcome: GameActionOutcome): void {
    if (outcome === GameActionOutcome.Ignored) {
      return;
    }

    const afterState = this.engine.state;
    if (outcome === GameActionOutcome.Matched) {
      this.animateMatchedTilesAndRerender(beforeState, afterState);
      return;
    }

    this.render();
    this.notifyStatusChangeIfNeeded();
  }

  private cancelMatchAnimation(): void {
    if (this.matchAnimationTimeoutId !== undefined) {
      window.clearTimeout(this.matchAnimationTimeoutId);
      this.matchAnimationTimeoutId = undefined;
    }

    this.isMatchAnimating = false;
  }

  private readonly clickBoard = (event: MouseEvent): void => {
    if (this.isMatchAnimating) {
      return;
    }

    this.clearHintHighlight();
    const boardRect = this.boardElement.getBoundingClientRect();
    const x = event.clientX - boardRect.left;
    const state = this.engine.state;
    const columnWidth = boardRect.width / state.columnCount;
    const clickedColumn = Math.floor(x / columnWidth);

    if (clickedColumn < 0 || clickedColumn >= state.columnCount) {
      return;
    }

    const beforeState = this.engine.state;
    const result = this.engine.placeSelectedPotTile(clickedColumn);
    this.handleActionResult(beforeState, result.outcome);
  };
}
