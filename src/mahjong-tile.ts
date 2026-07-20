export enum TileType {
  Empty = 0,
  Wheels = 1,
  Numbers = 2,
  Bamboos = 3,
  Winds = 4,
  Flowers = 5
}

export type FadeSpeed = 'fast' | 'slow';

export interface TileInfo {
  type: TileType;
  value: number;
}

export type TileFlipHandler = (type: TileType, value: number) => boolean;
export type TileClickHandler = (event: MouseEvent, tile: MahjongTile) => void;

export class MahjongTile {
  readonly #type: TileType;
  readonly #value: number;
  readonly #content: HTMLDivElement;
  readonly #inner: HTMLDivElement;
  readonly #element: HTMLDivElement;
  readonly #onFlip: TileFlipHandler;
  #visible = false;

  constructor(type: TileType, value: number, onFlip: TileFlipHandler = () => false, onClick: TileClickHandler = () => {}) {
    this.#type = type;
    this.#value = value;
    this.#onFlip = onFlip;

    this.validate();

    this.#content = document.createElement('div');
    this.#inner = document.createElement('div');
    this.#inner.classList.add('inner', 'back');
    this.#inner.appendChild(this.#content);

    this.#element = document.createElement('div');
    this.#element.classList.add('tile');
    this.#element.appendChild(this.#inner);
    this.#element.addEventListener('click', (event) => {
      event.stopPropagation();
      onClick(event, this);
    });
  }

  getElement(): HTMLDivElement {
    return this.#element;
  }

  getInfo(): TileInfo {
    return { type: this.#type, value: this.#value };
  }

  flipTile(show: boolean): void {
    if (show) {
      if (!this.#onFlip(this.#type, this.#value)) {
        console.warn('Tile cannot be flipped', this.#type, this.#value);
        return;
      }

      this.clearFadeClasses();
      this.#element.classList.remove('matched', 'playable');
      this.#inner.classList.remove('back');
      this.#inner.classList.add('front');
      this.#content.className = `t-${this.#type}-${this.#value}`;
      this.#visible = true;
      return;
    }

    this.clearFadeClasses();
    this.#content.className = '';
    this.#inner.classList.remove('selected');
    this.#inner.classList.remove('hinted');
    this.#element.classList.remove('matched', 'playable');
    this.#inner.classList.add('back');
    this.#inner.classList.remove('front');
    this.#visible = false;
  }

  fadeOut(speed: FadeSpeed): void {
    this.clearFadeClasses();
    this.#element.classList.add(`fadedOut-${speed}`);
  }

  fadeIn(speed: FadeSpeed): void {
    this.clearFadeClasses();
    this.#element.classList.add(`fadedIn-${speed}`);
  }

  select(): void {
    this.#element.classList.add('selected-tile');
    this.#inner.classList.add('selected');
  }

  unselect(): void {
    this.#element.classList.remove('selected-tile');
    this.#inner.classList.remove('selected');
  }

  showHint(): void {
    this.#inner.classList.add('hinted');
  }

  clearHint(): void {
    this.#inner.classList.remove('hinted');
  }

  setPlayable(playable: boolean): void {
    this.#element.classList.toggle('playable', playable);
  }

  markMatched(): void {
    this.#element.classList.add('matched');
  }

  isVisible(): boolean {
    return this.#visible;
  }

  private clearFadeClasses(): void {
    this.#element.classList.remove('fadedOut-fast', 'fadedOut-slow', 'fadedIn-fast', 'fadedIn-slow');
  }

  private validate(): void {
    if (this.#type < TileType.Empty || this.#type > TileType.Flowers) {
      throw new Error(`Unsupported tile type: ${this.#type}`);
    }

    switch (this.#type) {
      case TileType.Empty:
        return;
      case TileType.Wheels:
      case TileType.Numbers:
      case TileType.Bamboos:
        if (this.#value < 1 || this.#value > 9) {
          throw new Error(`Unsupported tile value ${this.#value} for type ${this.#type}`);
        }
        return;
      case TileType.Winds:
        if (this.#value < 1 || this.#value > 7) {
          throw new Error(`Unsupported tile value ${this.#value} for winds`);
        }
        return;
      case TileType.Flowers:
        if (this.#value < 1 || this.#value > 8) {
          throw new Error(`Unsupported tile value ${this.#value} for flowers`);
        }
        return;
      default:
        throw new Error(`Unsupported tile type: ${this.#type}`);
    }
  }
}
