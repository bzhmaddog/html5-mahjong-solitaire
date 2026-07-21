import { TileType } from './mahjong-tile';

export interface DeckTileState {
  id: number;
  type: TileType;
  value: number;
  visible: boolean;
  selected: boolean;
}

export interface DeckDealResult {
  columns: DeckTileState[][];
  pot: DeckTileState[];
}

export class GameDeck {
  private tiles: DeckTileState[] = [];

  reset(): void {
    this.tiles = [];
    let id = 1;

    for (let copy = 0; copy < 4; copy += 1) {
      for (let type = TileType.Wheels; type <= TileType.Bamboos; type += 1) {
        for (let value = 1; value <= 9; value += 1) {
          this.tiles.push(this.createTile(id, type, value));
          id += 1;
        }
      }

      for (let value = 1; value <= 7; value += 1) {
        this.tiles.push(this.createTile(id, TileType.Winds, value));
        id += 1;
      }
    }

    for (let value = 1; value <= 8; value += 1) {
      this.tiles.push(this.createTile(id, TileType.Flowers, value));
      id += 1;
    }
  }

  shuffle(iterations = 1): void {
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      for (let index = this.tiles.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [this.tiles[index], this.tiles[swapIndex]] = [this.tiles[swapIndex], this.tiles[index]];
      }
    }
  }

  deal(columnCount: number, tilesPerColumn: number): DeckDealResult {
    const boardTileCount = columnCount * tilesPerColumn;
    if (boardTileCount > this.tiles.length) {
      throw new Error('Not enough tiles to deal the requested board layout.');
    }

    const columns = Array.from({ length: columnCount }, () => [] as DeckTileState[]);
    let columnIndex = 0;

    for (let index = 0; index < boardTileCount; index += 1) {
      columns[columnIndex].push(this.cloneTile(index));
      columnIndex += 1;
      if (columnIndex >= columnCount) {
        columnIndex = 0;
      }
    }

    const pot: DeckTileState[] = [];
    for (let index = boardTileCount; index < this.tiles.length; index += 1) {
      pot.push(this.cloneTile(index));
    }

    return { columns, pot };
  }

  private createTile(id: number, type: TileType, value: number): DeckTileState {
    return {
      id,
      type,
      value,
      visible: false,
      selected: false
    };
  }

  private cloneTile(index: number): DeckTileState {
    return { ...this.tiles[index] };
  }
}
