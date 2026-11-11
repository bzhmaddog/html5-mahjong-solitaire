import { describe, expect, it, vi } from 'vitest';

import { MahjongTile, TileType } from '../src/mahjong-tile';

describe('MahjongTile', () => {
  it('throws for unsupported tile type and invalid values', () => {
    expect(() => new MahjongTile(99 as TileType, 1)).toThrowError('Unsupported tile type: 99');
    expect(() => new MahjongTile(TileType.Wheels, 0)).toThrowError('Unsupported tile value 0 for type 1');
    expect(() => new MahjongTile(TileType.Winds, 8)).toThrowError('Unsupported tile value 8 for winds');
    expect(() => new MahjongTile(TileType.Flowers, 9)).toThrowError('Unsupported tile value 9 for flowers');
  });

  it('keeps tile hidden when flip handler rejects reveal', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const tile = new MahjongTile(TileType.Numbers, 3, () => false);

    tile.flipTile(true);

    expect(tile.isVisible()).toBe(false);
    expect(tile.getElement().querySelector('.back')).not.toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('applies visual state classes for fade, selection, hints, playable, and matched', () => {
    const tile = new MahjongTile(TileType.Bamboos, 7, () => true);
    const element = tile.getElement();
    const inner = element.querySelector('.inner');

    tile.fadeOut('fast');
    expect(element.classList.contains('fadedOut-fast')).toBe(true);

    tile.fadeIn('slow');
    expect(element.classList.contains('fadedOut-fast')).toBe(false);
    expect(element.classList.contains('fadedIn-slow')).toBe(true);

    tile.select();
    expect(element.classList.contains('selected-tile')).toBe(true);
    expect(inner?.classList.contains('selected')).toBe(true);

    tile.showHint();
    expect(inner?.classList.contains('hinted')).toBe(true);

    tile.setPlayable(true);
    expect(element.classList.contains('playable')).toBe(true);

    tile.markMatched();
    expect(element.classList.contains('matched')).toBe(true);

    tile.clearHint();
    expect(inner?.classList.contains('hinted')).toBe(false);

    tile.unselect();
    expect(element.classList.contains('selected-tile')).toBe(false);
    expect(inner?.classList.contains('selected')).toBe(false);
  });

  it('invokes click handler with tile reference', () => {
    const onClick = vi.fn();
    const tile = new MahjongTile(TileType.Wheels, 2, () => true, onClick);

    tile.getElement().click();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][1]).toBe(tile);
  });
});
