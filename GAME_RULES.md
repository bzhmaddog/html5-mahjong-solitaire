# Game Rules

This file describes the rules currently implemented in the codebase. It is extracted from the runtime logic in `src/mahjong-game.ts`, `src/mahjong-deck.ts`, and `src/mahjong-tile.ts`.

## Tile set

The deck contains 144 tiles in total.

Composition:
- 4 copies each of the numbered suits:
  - Wheels: values 1 through 9
  - Numbers: values 1 through 9
  - Bamboos: values 1 through 9
- 4 copies of Winds: values 1 through 7
- 1 copy each of Flowers: values 1 through 8

## Board layout at game start

The board has 18 columns.

At the start of a game:
- The first 108 tiles are dealt onto the board.
- Tiles are distributed round-robin across the 18 columns.
- This produces 6 tiles per column.
- Only the top tile of each column is revealed initially.

The remaining 36 tiles are placed into the pot.
- Only the last tile in the pot is revealed.
- Only that last visible pot tile is interactable.

## What tiles can be interacted with

A tile can only be clicked if it is visible.

In practice, that means:
- On the board, only the top tile of each column is playable.
- In the pot, only the last tile is playable.

Hidden tiles exist in the stacks but cannot be selected until revealed.

## Matching rules

Two tiles can be matched only if they belong to the same tile type.

Type-specific matching rules:
- Wheels, Numbers, and Bamboos:
  - the two values must add up to 10
  - examples: 1+9, 2+8, 3+7, 4+6, 5+5
- Winds:
  - the two values must be exactly equal
- Flowers:
  - any two flower tiles match

Tiles of different types never match.

## Selection rules

The player may select one visible tile at a time.

Selection behavior:
- Clicking a visible tile selects it.
- Clicking the same selected tile again clears the selection.
- If a second visible tile is clicked and it forms a valid match with the selected tile, both tiles are removed.
- If the second clicked tile does not form a valid match, behavior depends on where the selected tile came from.

## Pot-to-board interaction

A selected pot tile has a special move rule.

If the selected tile comes from the pot and the player clicks the board:
- The clicked screen position is converted into one of the 18 columns.
- If the selected pot tile matches the top tile of the clicked column, the game treats that as a match and removes both tiles.
- Otherwise, the selected pot tile is moved onto the top of the clicked column.

When a pot tile is moved onto the board:
- it becomes the new top tile of that column
- it is removed from the pot
- the next last tile in the pot is revealed

## Removing matched tiles

When two tiles match:
- both are faded out
- both are added to an internal trash collection
- both are removed from play

Board updates after a match:
- If a matched tile came from the board, it is removed from the top of its column.
- After removal, the new top tile of that column is revealed.

Pot updates after a match:
- If a matched tile came from the pot, it is removed from the end of the pot.
- After removal, the new last tile of the pot is revealed.

## Reset and start behavior

Initialization:
- `init()` creates and shuffles the deck and prepares the empty board state.

Starting a game:
- `start()` can only run after initialization.
- `start()` cannot run while another game is already active.

Reset:
- `reset()` clears rendered tiles, resets all tiles to face-down, reshuffles the deck, and rebuilds the empty board and pot state.

## Rules that are not currently implemented

The current logic does not implement explicit:
- win detection
- loss detection
- scoring
- move counting
- timer-based rules
- hint rules
- reshuffle during play

The game currently defines how tiles are dealt, revealed, selected, matched, moved from the pot to the board, and removed, but it does not declare a formal end-state.

## Implementation notes

These rules are derived from the current code behavior, not from a broader Mahjong Solitaire standard. If the code changes, this file should be updated to stay aligned with the implementation.
