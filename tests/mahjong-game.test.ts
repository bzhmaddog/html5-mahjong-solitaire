import { describe, expect, it, vi } from 'vitest';

import { canTilesMatch } from '../src/game-rules';
import { Difficulty, HintRequestOutcome, MahjongGame } from '../src/mahjong-game';
import { GameStatus } from '../src/mahjong-game-engine';
import { TileType } from '../src/mahjong-tile';

function createGameUi(): { board: HTMLDivElement; pot: HTMLDivElement } {
  document.body.innerHTML = `
    <div id="ui-board" class="ui board"></div>
    <div id="ui-right" class="ui right"></div>
  `;

  return {
    board: document.getElementById('ui-board') as HTMLDivElement,
    pot: document.getElementById('ui-right') as HTMLDivElement
  };
}

describe('game rules', () => {
  it('matches numbered suit tiles when their values add to 10', () => {
    expect(canTilesMatch({ type: TileType.Wheels, value: 1 }, { type: TileType.Wheels, value: 9 })).toBe(true);
    expect(canTilesMatch({ type: TileType.Numbers, value: 4 }, { type: TileType.Numbers, value: 6 })).toBe(true);
    expect(canTilesMatch({ type: TileType.Bamboos, value: 5 }, { type: TileType.Bamboos, value: 5 })).toBe(true);
    expect(canTilesMatch({ type: TileType.Bamboos, value: 5 }, { type: TileType.Bamboos, value: 4 })).toBe(false);
  });

  it('matches winds by equality and flowers by type only', () => {
    expect(canTilesMatch({ type: TileType.Winds, value: 3 }, { type: TileType.Winds, value: 3 })).toBe(true);
    expect(canTilesMatch({ type: TileType.Winds, value: 3 }, { type: TileType.Winds, value: 4 })).toBe(false);
    expect(canTilesMatch({ type: TileType.Flowers, value: 1 }, { type: TileType.Flowers, value: 8 })).toBe(true);
  });

  it('never matches tiles of different types', () => {
    expect(canTilesMatch({ type: TileType.Wheels, value: 1 }, { type: TileType.Numbers, value: 9 })).toBe(false);
    expect(canTilesMatch({ type: TileType.Flowers, value: 1 }, { type: TileType.Winds, value: 1 })).toBe(false);
  });
});

describe('MahjongGame', () => {
  it('reports hint as not started before the first deal', () => {
    const { board, pot } = createGameUi();
    const game = new MahjongGame(board, pot);

    game.init();

    expect(game.showHint()).toBe(HintRequestOutcome.NotStarted);
  });

  it('initializes 18 empty board columns', () => {
    const { board, pot } = createGameUi();
    const game = new MahjongGame(board, pot);

    game.init();

    expect(board.querySelectorAll('.col')).toHaveLength(18);
    expect(board.querySelectorAll('.tile')).toHaveLength(0);
    expect(pot.querySelectorAll('.tile')).toHaveLength(0);
    expect(game.isStarted).toBe(false);
  });

  it('deals the board and pot according to the documented start layout', () => {
    const { board, pot } = createGameUi();
    const game = new MahjongGame(board, pot);

    game.init();
    game.start();

    expect(game.isStarted).toBe(true);
    expect(board.querySelectorAll('.tile')).toHaveLength(108);
    expect(pot.querySelectorAll('.tile')).toHaveLength(36);
    expect(board.querySelectorAll('.front')).toHaveLength(18);
    expect(pot.querySelectorAll('.front')).toHaveLength(1);
  });

  it('reset clears all dealt tiles and returns to an initialized idle state', () => {
    const { board, pot } = createGameUi();
    const game = new MahjongGame(board, pot);

    game.init();
    game.start();
    game.reset();

    expect(game.isStarted).toBe(false);
    expect(board.querySelectorAll('.col')).toHaveLength(18);
    expect(board.querySelectorAll('.tile')).toHaveLength(0);
    expect(pot.querySelectorAll('.tile')).toHaveLength(0);
  });

  it('uses medium difficulty hint quota by default', () => {
    const { board, pot } = createGameUi();
    const game = new MahjongGame(board, pot);

    game.init();
    game.start();

    expect(game.remainingHints).toBe(3);
  });

  it('configures hint quotas by difficulty', () => {
    const { board, pot } = createGameUi();
    const game = new MahjongGame(board, pot);

    game.init();
    game.setDifficulty(Difficulty.Easy);
    expect(game.remainingHints).toBe(6);

    game.setDifficulty(Difficulty.Medium);
    expect(game.remainingHints).toBe(3);

    game.setDifficulty(Difficulty.Hard);
    expect(game.remainingHints).toBe(0);
  });

  it('blocks hint usage in hard mode', () => {
    const { board, pot } = createGameUi();
    const game = new MahjongGame(board, pot);

    game.init();
    game.setDifficulty(Difficulty.Hard);
    game.start();

    expect(game.showHint()).toBe(HintRequestOutcome.NoHintsLeft);
    expect(game.remainingHints).toBe(0);
  });

  it('resets available hints when a new game starts', () => {
    const { board, pot } = createGameUi();
    const game = new MahjongGame(board, pot);

    game.init();
    game.setDifficulty(Difficulty.Medium);
    game.start();

    while (game.remainingHints > 0) {
      const outcome = game.showHint();
      if (outcome !== HintRequestOutcome.Shown) {
        break;
      }
    }

    game.reset();
    game.start();
    expect(game.remainingHints).toBe(3);
  });

  it('notifies status changes when game starts and resets', () => {
    const { board, pot } = createGameUi();
    const game = new MahjongGame(board, pot);
    const transitions: GameStatus[] = [];

    game.init();
    game.setStatusChangeHandler((status) => {
      transitions.push(status);
    });

    game.start();
    game.reset();

    expect(transitions).toEqual([GameStatus.Running, GameStatus.Idle]);
  });

  it('shows an alert when start is called while a game is already started', () => {
    const { board, pot } = createGameUi();
    const game = new MahjongGame(board, pot);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    game.init();
    game.start();
    game.start();

    expect(alertSpy).toHaveBeenCalledWith('A game is already started. Please reset first.');
    alertSpy.mockRestore();
  });
});