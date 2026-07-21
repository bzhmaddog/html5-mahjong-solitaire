# html5-mahjong-solitaire

Mahjong Solitaire built with Vite, TypeScript, SCSS, and Vitest.

## Overview

The app entrypoint is `index.html`, which loads `src/main.ts` and `scss/main.scss`.

Current gameplay includes:
- Full game setup and shuffle/deal flow.
- Win/loss detection.
- Difficulty levels (`easy`, `medium`, `hard`) with per-difficulty hint limits.
- In-game hint system.

For rules currently implemented by the engine, see `GAME_RULES.md`.

## Quick Start

```bash
npm install
npm run dev
```

Vite will print a local URL (usually `http://localhost:5173`).

## Scripts

- `npm run dev`: Start the Vite dev server.
- `npm run build`: Build a production bundle into `dist/`.
- `npm run preview`: Preview the production build locally.
- `npm run lint`: Run ESLint.
- `npm run typecheck`: Run TypeScript checks with no emit.
- `npm run test`: Run Vitest in watch mode.
- `npm run test:run`: Run the test suite once.
- `npm run test:coverage`: Run tests with coverage output.
- `npm run pre-commit`: Run lint-staged, typecheck, and tests (used by Husky).

## Testing

Tests live in `tests/` and currently cover:
- Deck composition and setup behavior.
- Core game engine interactions.
- Game-level behaviors.

Coverage reports are written under `coverage/` when using `npm run test:coverage`.

## Project Structure

- `src/`: TypeScript source modules for game logic and UI wiring.
- `tests/`: Vitest test suite.
- `scss/`: SCSS styles.
- `public/`: Static assets served as-is.
- `public/res/skins/default/`: Tile, UI, and font assets used at runtime.
- `GAME_RULES.md`: Human-readable rules extracted from the current runtime behavior.
