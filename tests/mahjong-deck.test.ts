import { describe, expect, it } from 'vitest';

import { GameDeck } from '../src/game-deck';
import { MahjongTile, TileType } from '../src/mahjong-tile';

function collectTileCounts(deck: GameDeck): Map<string, number> {
  const dealt = deck.deal(18, 6);
  const tiles = [...dealt.columns.flat(), ...dealt.pot];
  const counts = new Map<string, number>();

  tiles.forEach(({ type, value }) => {
    const key = `${type}:${value}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return counts;
}

describe('GameDeck', () => {
  it('creates the full 144-tile deck', () => {
    const deck = new GameDeck();
    deck.reset();
    const dealt = deck.deal(18, 6);
    const tileCount = dealt.columns.flat().length + dealt.pot.length;

    expect(tileCount).toBe(144);
  });

  it('matches the documented deck composition rules', () => {
    const deck = new GameDeck();
    deck.reset();
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

  it('throws for impossible deal layouts', () => {
    const deck = new GameDeck();
    deck.reset();

    expect(() => deck.deal(18, 9)).toThrowError('Not enough tiles to deal the requested board layout.');
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