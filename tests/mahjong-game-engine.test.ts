import { describe, expect, it } from 'vitest';

import { GameActionOutcome, GameStatus, MahjongGameEngine } from '../src/mahjong-game-engine';
import { canTilesMatch } from '../src/game-rules';

describe('MahjongGameEngine', () => {
  it('throws when start is called before init', () => {
    const engine = new MahjongGameEngine();

    expect(() => engine.start()).toThrowError('init should be called first');
  });

  it('throws when start is called for an already started game', () => {
    const engine = new MahjongGameEngine();

    engine.init();
    engine.start();

    expect(() => engine.start()).toThrowError('A game is already started. Please reset first.');
  });

  it('initializes to an idle empty state', () => {
    const engine = new MahjongGameEngine();

    engine.init();

    const state = engine.state;
    expect(state.started).toBe(false);
    expect(state.status).toBe(GameStatus.Idle);
    expect(state.columns).toHaveLength(18);
    expect(state.columns.every((column) => column.length === 0)).toBe(true);
    expect(state.pot).toHaveLength(0);
    expect(state.trash).toHaveLength(0);
  });

  it('deals the documented board and pot layout without any DOM', () => {
    const engine = new MahjongGameEngine();

    engine.init();
    engine.start();

    const state = engine.state;
    expect(state.started).toBe(true);
    expect(state.status).toBe(GameStatus.Running);
    expect(state.columns).toHaveLength(18);
    expect(state.columns.every((column) => column.length === 6)).toBe(true);
    expect(state.pot).toHaveLength(36);
    expect(state.columns.flat().filter((tile) => tile.visible)).toHaveLength(18);
    expect(state.pot.filter((tile) => tile.visible)).toHaveLength(1);
  });

  it('resets back to an initialized idle state', () => {
    const engine = new MahjongGameEngine();

    engine.init();
    engine.start();
    engine.reset();

    const state = engine.state;
    expect(state.started).toBe(false);
    expect(state.status).toBe(GameStatus.Idle);
    expect(state.columns.every((column) => column.length === 0)).toBe(true);
    expect(state.pot).toHaveLength(0);
    expect(state.trash).toHaveLength(0);
  });

  it('returns ignored actions before game start', () => {
    const engine = new MahjongGameEngine();

    engine.init();

    const tileResult = engine.interactWithTile(1);
    const columnResult = engine.placeSelectedPotTile(0);

    expect(tileResult.outcome).toBe(GameActionOutcome.Ignored);
    expect(tileResult.changed).toBe(false);
    expect(tileResult.status).toBe(GameStatus.Idle);
    expect(columnResult.outcome).toBe(GameActionOutcome.Ignored);
    expect(columnResult.changed).toBe(false);
    expect(columnResult.status).toBe(GameStatus.Idle);
  });

  it('supports tile selection and unselection through action results', () => {
    const engine = new MahjongGameEngine();

    engine.init();
    engine.start();
    const topBoardTileId = engine.state.columns[0][0].id;

    const selectResult = engine.interactWithTile(topBoardTileId);
    expect(selectResult.outcome).toBe(GameActionOutcome.Selected);
    expect(selectResult.changed).toBe(true);
    expect(selectResult.status).toBe(GameStatus.Running);

    const unselectResult = engine.interactWithTile(topBoardTileId);
    expect(unselectResult.outcome).toBe(GameActionOutcome.SelectionCleared);
    expect(unselectResult.changed).toBe(true);
    expect(unselectResult.status).toBe(GameStatus.Running);
  });

  it('returns no hint while game is idle', () => {
    const engine = new MahjongGameEngine();

    engine.init();

    expect(engine.findHintMatch()).toBeNull();
  });

  it('returns a valid playable match hint when available', () => {
    const engine = new MahjongGameEngine();

    engine.init();
    engine.start();

    const hint = engine.findHintMatch();
    if (!hint) {
      expect(hint).toBeNull();
      return;
    }

    const state = engine.state;
    const boardTopTiles = state.columns.map((column) => column[0]).filter(Boolean);
    const potTopTile = state.pot.at(-1);
    const playableTiles = potTopTile ? [...boardTopTiles, potTopTile] : boardTopTiles;

    const first = playableTiles.find((tile) => tile.id === hint.tileIds[0]);
    const second = playableTiles.find((tile) => tile.id === hint.tileIds[1]);

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (!first || !second) {
      return;
    }

    expect(canTilesMatch(first, second)).toBe(true);
  });

  it('does not allow moving selected pot tile to a non-empty non-matching column', () => {
    const engine = new MahjongGameEngine();

    engine.init();
    engine.start();

    const initialState = engine.state;
    const potTop = initialState.pot.at(-1);
    expect(potTop).toBeDefined();
    if (!potTop) {
      return;
    }

    const selectPotResult = engine.interactWithTile(potTop.id);
    expect(selectPotResult.outcome).toBe(GameActionOutcome.Selected);

    const refreshedState = engine.state;
    const currentPotTop = refreshedState.pot.at(-1);
    expect(currentPotTop).toBeDefined();
    if (!currentPotTop) {
      return;
    }

    const illegalColumnIndex = refreshedState.columns.findIndex((column) => {
      const top = column[0];
      if (!top) {
        return false;
      }

      return !canTilesMatch(currentPotTop, top);
    });

    expect(illegalColumnIndex).toBeGreaterThanOrEqual(0);
    if (illegalColumnIndex < 0) {
      return;
    }

    const illegalMoveResult = engine.placeSelectedPotTile(illegalColumnIndex);
    expect(illegalMoveResult.outcome).toBe(GameActionOutcome.Ignored);
    expect(illegalMoveResult.changed).toBe(false);
  });

  it('marks game as lost when no matches and no empty columns remain', () => {
    const engine = new MahjongGameEngine();

    engine.init();
    engine.start();

    let guard = 0;
    while (engine.status === GameStatus.Running && guard < 800) {
      guard += 1;
      const hint = engine.findHintMatch();
      if (hint) {
        engine.interactWithTile(hint.tileIds[0]);
        engine.interactWithTile(hint.tileIds[1]);
        continue;
      }

      const state = engine.state;
      const hasEmptyColumn = state.columns.some((column) => column.length === 0);
      if (!hasEmptyColumn) {
        break;
      }

      const potTop = state.pot.at(-1);
      if (!potTop) {
        break;
      }

      const emptyColumnIndex = state.columns.findIndex((column) => column.length === 0);
      if (emptyColumnIndex < 0) {
        break;
      }

      const selectResult = engine.interactWithTile(potTop.id);
      if (selectResult.outcome !== GameActionOutcome.Selected) {
        break;
      }

      const moveResult = engine.placeSelectedPotTile(emptyColumnIndex);
      if (moveResult.outcome === GameActionOutcome.Ignored) {
        break;
      }
    }

    const finalState = engine.state;
    const noHint = engine.findHintMatch() === null;
    const noEmptyColumn = finalState.columns.every((column) => column.length > 0);

    if (noHint && noEmptyColumn) {
      expect(engine.status).toBe(GameStatus.Lost);
      return;
    }

    expect(engine.status === GameStatus.Lost || engine.status === GameStatus.Won).toBe(true);
  });
});