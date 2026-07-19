import { TileInfo, TileType } from './mahjong-tile';

export function canTilesMatch(first: TileInfo, second: TileInfo): boolean {
  if (first.type !== second.type) {
    return false;
  }

  switch (first.type) {
    case TileType.Wheels:
    case TileType.Numbers:
    case TileType.Bamboos:
      return first.value + second.value === 10;
    case TileType.Winds:
      return first.value === second.value;
    case TileType.Flowers:
      return true;
    default:
      return false;
  }
}