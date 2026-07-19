import { describe, expect, it } from 'vitest';

import { MahjongDeck } from '../src/mahjong-deck';
import { MahjongTile, TileType } from '../src/mahjong-tile';

function collectTileCounts(deck: MahjongDeck): Map<string, number> {
  const counts = new Map<string, number>();

  for (let index = 0; index < deck.getLength(); index += 1) {
    const { type, value } = deck.getTile(index).getInfo();
    const key = `${type}:${value}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

describe('MahjongDeck', () => {
  it('creates the full 144-tile deck', () => {
    const deck = new MahjongDeck(() => true, () => {});

    expect(deck.getLength()).toBe(144);
  });

  it('matches the documented deck composition rules', () => {
    const deck = new MahjongDeck(() => true, () => {});
    const counts = collectTileCounts(deck);

    for (const type of [TileType.Wheels, TileType.Numbers, TileType.Bamboos] as const) {
      for (let value = 1; value <= 9; value += 1) {
        expect(counts.get(`${type}:${value}`)).toBe(4);
      }
    }

    for (let value = 1; value <= 7; value += 1) {
      expect(counts.get(`${TileType.Winds}:${value}`)).toBe(4);
    }

    for (let value = 1; value <= 8; value += 1) {
      expect(counts.get(`${TileType.Flowers}:${value}`)).toBe(1);
    }

    expect(counts.size).toBe((3 * 9) + 7 + 8);
  });

  it('returns an empty tile for out-of-range access', () => {
    const deck = new MahjongDeck(() => true, () => {});

    expect(deck.getTile(-1).getInfo()).toEqual({ type: TileType.Empty, value: 0 });
    expect(deck.getTile(999).getInfo()).toEqual({ type: TileType.Empty, value: 0 });
  });
});

describe('MahjongTile', () => {
  it('reveals and hides a tile while tracking visibility', () => {
    const tile = new MahjongTile(TileType.Wheels, 4, () => true, () => {});

    expect(tile.isVisible()).toBe(false);

    tile.flipTile(true);
    expect(tile.isVisible()).toBe(true);
    expect(tile.getElement().querySelector('.front')).not.toBeNull();

    tile.flipTile(false);
    expect(tile.isVisible()).toBe(false);
    expect(tile.getElement().querySelector('.back')).not.toBeNull();
  });
});