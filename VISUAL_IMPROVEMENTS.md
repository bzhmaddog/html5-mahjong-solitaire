# Visual Polish Pass — html5-mahjong-solitaire

Goal: fix the "flat" look of the board and tiles by adding depth, layering,
texture, and interaction feedback — without breaking game logic or the
responsive layout.

Repo: https://github.com/bzhmaddog/html5-mahjong-solitaire

## Ground rules for the agent

- One visual change per commit. Regressions must be easy to isolate/bisect.
- Never touch tile hit-testing / click logic while doing visual-only work.
  If a layering change requires updating click coordinates, stop and treat
  that as its own explicit, separately-reviewed step.
- Prefer CSS/SCSS-only changes before introducing new image/texture assets
  (keeps load time and file size down).
- Screenshot after *every* phase, not just at the end.
- Re-run the SCSS build step (`compile.bat` / `build.rb` / equivalent) after
  every SCSS edit before testing in-browser.

---

## Phase 0 — Setup & baseline

- [ ] Clone/open the repo, confirm `main.html` runs in a browser.
- [ ] Check whether a build step is required before changes are visible
      (`build.bat`, `build.php`, `build.rb`, `compile.bat`, `config.rb`).
- [ ] Start a game, get the board into a representative mid-game state
      (some tiles matched/removed, at least one tile visibly selected).
- [ ] Take a baseline screenshot → save as `screenshots/00-baseline.png`.
- [ ] Locate the relevant source files:
  - Tile rendering CSS/SCSS (likely in `scss/` and/or `css/`)
  - Tile SVG assets (`res/skins/default`)
  - Layer/z-index or board layout logic (likely in `js/`)

---

## Phase 1 — Tile depth

- [ ] Add a `box-shadow` to the tile face class (e.g.
      `0 3px 6px rgba(0,0,0,0.3)`) so tiles look raised off the board.
- [ ] Add a subtle top-to-bottom gradient on the tile face
      (e.g. `linear-gradient(to bottom, #fff, #f0f0f0)`).
- [ ] Add a beveled-edge effect: lighter border top-left, darker border
      bottom-right, to simulate a physical tile block.
- [ ] Rebuild CSS from SCSS if applicable.
- [ ] Screenshot → `screenshots/01-tile-depth.png` → compare to baseline.
- [ ] Confirm tiles read as "raised blocks," not flat squares.
- [ ] Commit: `style: add depth/shading to tile faces`

---

## Phase 2 — Layer stacking

- [ ] Find where tile layer offsets are computed for stacked/overlapping
      tiles (likely in the board layout JS).
- [ ] Add a small per-layer pixel offset (x/y, ~2-4px) plus a shadow
      underneath each stacked tile.
- [ ] Screenshot a multi-layer board state → `screenshots/02-layers.png`.
- [ ] Manually click tiles at various stack depths — confirm clicks still
      map to the *visually correct* tile (this is the main regression risk
      of this phase).
- [ ] Confirm no unintended overlap/clipping bugs at board edges.
- [ ] Commit: `style: add visual offset + shadow to stacked tile layers`

---

## Phase 3 — Board background

- [ ] Replace the flat background color with a CSS gradient first
      (radial, darker at edges / lighter center) — no new asset needed.
- [ ] Optional follow-up: swap in a subtle tiled texture image
      (wood-grain/felt) if the gradient alone isn't enough — keep file
      size small, treat as a separate commit.
- [ ] Screenshot → `screenshots/03-background.png`.
- [ ] Check tile legibility/contrast against the new background at actual
      gameplay zoom (not zoomed in).
- [ ] Commit: `style: add depth to board background`

---

## Phase 4 — Interaction feedback

- [ ] Add hover state on selectable tiles: slight scale-up
      (`transform: scale(1.05)`) + brighter shadow.
- [ ] Add a selected-state glow (e.g. `box-shadow: 0 0 8px gold`).
- [ ] Replace instant tile removal on match with a fade + scale-down
      transition (~200-300ms).
- [ ] Play through a full match sequence and verify:
  - No layout jank/reflow during transitions.
  - Win condition / tile-availability logic fires *after* the animation
    completes, not before (avoid state desync).
  - Transition timing doesn't feel laggy.
- [ ] Screenshot hover + selected states → `screenshots/04-interaction.png`.
- [ ] Commit: `feat: add hover/selected/match transition feedback`

---

## Phase 5 — Tile face / symbol polish

- [ ] Add a subtle `drop-shadow` filter to the SVG tile symbols.
- [ ] Consider a light gradient fill instead of flat fill on symbols.
- [ ] Screenshot at real gameplay size (not zoomed) →
      `screenshots/05-symbols.png` — confirm symbols are still crisp and
      readable; this step is the easiest to overdo into muddiness.
- [ ] Commit: `style: add depth to tile symbol rendering`

---

## Phase 6 — Cross-check

- [ ] Test in at least 2 browsers (e.g. Chrome + Firefox) — confirm
      gradients/shadows render consistently.
- [ ] Resize the window across a few breakpoints to confirm the
      responsive layout still holds with the new styling.
- [ ] Take a final screenshot → `screenshots/06-final.png`.
- [ ] Produce a side-by-side before/after comparison
      (`00-baseline.png` vs `06-final.png`) for review.

---

## Definition of done

- All six phases committed individually.
- No regressions in tile click accuracy or win-condition logic.
- Final screenshot shows clear improvement over baseline in: tile depth,
  board background depth, interaction feedback, and symbol clarity.
- Responsive behavior unchanged.
