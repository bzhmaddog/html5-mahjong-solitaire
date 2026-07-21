import '../scss/main.scss';
import { Difficulty, HintRequestOutcome, MahjongGame } from './mahjong-game';
import { GameStatus } from './mahjong-game-engine';

declare global {
  interface Window {
    getPot?: () => void;
    getBoard?: (columnIndex: number, tileIndex: number) => void;
    getGameDebugSnapshot?: () => unknown;
    getGameDebugSnapshotJson?: () => string;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const boardEl = document.getElementById('ui-board');
  const rightEl = document.getElementById('ui-right');
  const overlayEl = document.getElementById('overlay');
  const homeEl = document.getElementById('home');
  const gameEl = document.getElementById('game');
  const hintButton = document.getElementById('ui-hint');
  const gameEndScreen = document.getElementById('game-end-screen');
  const gameEndTitle = document.getElementById('game-end-title');
  const gameEndMessage = document.getElementById('game-end-message');
  const gameEndReplay = document.getElementById('game-end-replay');
  const gameEndHome = document.getElementById('game-end-home');
  const difficultySelect = document.getElementById('ui-difficulty');
  const startButton = document.querySelector<HTMLAnchorElement>('#home .startButton');

  if (!boardEl || !rightEl || !overlayEl || !homeEl || !gameEl || !hintButton || !gameEndScreen || !gameEndTitle || !gameEndMessage || !gameEndReplay || !gameEndHome || !difficultySelect || !startButton) {
    throw new Error('Expected game UI elements are missing from the page.');
  }

  const game = new MahjongGame(boardEl, rightEl);
  const hintButtonEl = hintButton as HTMLButtonElement;
  const gameEndScreenEl = gameEndScreen as HTMLDivElement;
  const gameEndTitleEl = gameEndTitle as HTMLHeadingElement;
  const gameEndMessageEl = gameEndMessage as HTMLParagraphElement;
  const gameEndReplayEl = gameEndReplay as HTMLButtonElement;
  const gameEndHomeEl = gameEndHome as HTMLButtonElement;
  const difficultySelectEl = difficultySelect as HTMLSelectElement;

  const hideEndScreen = (): void => {
    gameEndScreenEl.classList.add('hidden');
  };

  const showEndScreen = (title: string, message: string): void => {
    gameEndTitleEl.textContent = title;
    gameEndMessageEl.textContent = message;
    gameEndScreenEl.classList.remove('hidden');
  };

  const updateHintButton = (): void => {
    const remainingHints = game.getRemainingHints();
    const canUseHint = game.getStatus() === GameStatus.Running;
    hintButtonEl.textContent = `Hint (${remainingHints})`;
    hintButtonEl.disabled = remainingHints <= 0 || !canUseHint;
  };

  const toDifficulty = (value: string): Difficulty => {
    if (value === Difficulty.Easy) {
      return Difficulty.Easy;
    }

    if (value === Difficulty.Hard) {
      return Difficulty.Hard;
    }

    return Difficulty.Medium;
  };

  const startGame = (): void => {
    if (game.isStarted()) {
      game.reset();
    }

    game.setDifficulty(toDifficulty(difficultySelectEl.value));
    hideEndScreen();

    overlayEl.classList.remove('animation-reverse', 'hidden');
    game.start();
    updateHintButton();

    window.setTimeout(() => {
      homeEl.classList.add('hidden');
      gameEl.classList.remove('hidden');
      overlayEl.classList.add('animation-reverse', 'hidden');
    }, 500);
  };

  startButton.addEventListener('click', startGame);
  difficultySelectEl.addEventListener('change', () => {
    game.setDifficulty(toDifficulty(difficultySelectEl.value));
    updateHintButton();
  });
  gameEndReplayEl.addEventListener('click', () => {
    hideEndScreen();
    startGame();
  });
  gameEndHomeEl.addEventListener('click', () => {
    hideEndScreen();
    game.reset();
    gameEl.classList.add('hidden');
    homeEl.classList.remove('hidden');
    updateHintButton();
  });
  game.setStatusChangeHandler((status) => {
    updateHintButton();

    if (status === GameStatus.Won) {
      showEndScreen('You Won', 'All tiles are cleared. Great run.');
      return;
    }

    if (status === GameStatus.Lost) {
      showEndScreen('Game Over', 'No more legal moves. Try a new deal.');
    }
  });
  hintButtonEl.addEventListener('click', () => {
    const outcome = game.showHint();
    updateHintButton();
    if (outcome === HintRequestOutcome.NoHintsLeft) {
      alert('No hints left for this game.');
      return;
    }

    if (outcome === HintRequestOutcome.NoMatchAvailable) {
      alert('No direct match found. You can only move the top pot tile to an empty column.');
    }
  });

  game.init();
  game.setDifficulty(Difficulty.Medium);
  updateHintButton();

  window.getPot = () => game.getPot();
  window.getBoard = (columnIndex, tileIndex) => game.getBoard(columnIndex, tileIndex);
  window.getGameDebugSnapshot = () => game.getDebugSnapshot();
  window.getGameDebugSnapshotJson = () => game.getDebugSnapshotJson();

  document.documentElement.classList.remove('preload');
});
