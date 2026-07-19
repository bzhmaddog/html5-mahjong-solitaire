# html5-mahjong-solitaire

A Mahjong Solitaire game originally built as a static HTML5/CSS3/SVG app and now being modernized onto a Vite-based workflow.

## Current workflow

The active app entrypoint is `index.html`, which loads the ES module app from `src/`.

### Development

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
```

The production bundle is written to `dist/`.

## Project structure

- `src/` contains the modernized JavaScript modules.
- `index.html` is the Vite entrypoint.
- `public/` contains static assets that must be served as-is.
- `scss/` is the active stylesheet source compiled by Vite.
- `public/res/` contains all game image assets used at runtime.

## Migration status

- Vite and npm tooling are in place.
- The main game modules have been migrated to ES modules.
- Core game reset/start state handling has been repaired in the modernized code.
- Legacy asset references required by the active stylesheet are now served through `public/`.
- Asset files were consolidated so there is no separate top-level `res/` folder anymore.
- The old static HTML entrypoint, bundled scripts, legacy build scripts, and editor metadata have been removed.
- The app now imports `scss/main.scss` directly instead of relying on the legacy compiled CSS file.

## Remaining modernization work

- Add automated tests around tile matching, deck setup, and reset behavior.
- Continue simplifying the remaining style and asset pipeline.