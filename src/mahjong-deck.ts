import { MahjongTile, TileClickHandler, TileFlipHandler, TileType } from './mahjong-tile';

export class MahjongDeck {
  readonly #tiles: MahjongTile[] = [];
  readonly #emptyTile: MahjongTile;
  #canShuffle = false;

  constructor(onFlip: TileFlipHandler, onClick: TileClickHandler) {
    this.#emptyTile = new MahjongTile(TileType.Empty, 0, () => false, () => {});

    for (let n = 0; n < 4; n += 1) {
      for (let type = TileType.Wheels; type <= TileType.Bamboos; type += 1) {
        for (let value = 1; value <= 9; value += 1) {
          this.#tiles.push(new MahjongTile(type, value, onFlip, onClick));
        }
      }

      for (let value = 1; value <= 7; value += 1) {
        this.#tiles.push(new MahjongTile(TileType.Winds, value, onFlip, onClick));
      }
    }

    for (let value = 1; value <= 8; value += 1) {
      this.#tiles.push(new MahjongTile(TileType.Flowers, value, onFlip, onClick));
    }
  }

  getTile(index: number): MahjongTile {
    if (index < 0 || index >= this.#tiles.length) {
      return this.#emptyTile;
    }

    return this.#tiles[index];
  }

  getLength(): number {
    return this.#tiles.length;
  }

  shuffle(iterations = 1): boolean {
    if (this.#canShuffle) {
      return false;
    }

    for (let iteration = 0; iteration < iterations; iteration += 1) {
      for (let i = this.#tiles.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.#tiles[i], this.#tiles[j]] = [this.#tiles[j], this.#tiles[i]];
      }
    }

    this.#canShuffle = true;
    return true;
  }

  reset(): void {
    this.#tiles.forEach((tile) => {
      const element = tile.getElement();
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      tile.flipTile(false);
    });

    this.#canShuffle = false;
  }
}
