import { GlideMap } from '../map';
import { MapControl } from './map_control';

export enum MapControlPosition {
  TOP_LEFT,
  TOP_CENTER,
  TOP_RIGHT,
  BOTTOM_LEFT,
  BOTTOM_CENTER,
  BOTTOM_RIGHT,
  LEFT_CENTER,
  RIGHT_CENTER,
}

export class MapParentControl extends MapControl {
  private children: MapControl[] = [];
  private el: HTMLElement;

  constructor(
    protected readonly map: GlideMap,
    protected readonly position: MapControlPosition,
  ) {
    super(map);
  }

  public init() {
    this.el = document.createElement('div');
    this.el.style.position = 'absolute';
    this.el.style.bottom = '10px';
    this.el.style.right = '10px';
    this.el.style.display = 'flex';
    this.el.style.flexDirection = 'column';
    this.el.style.alignItems = 'center';

    for (const child of this.children) {
      child.init();
    }
  }

  public attach(rootEl: HTMLElement) {
    for (const child of this.children) {
      child.attach(this.el);
    }

    rootEl.appendChild(this.el);
  }

  public destroy(rootEl: HTMLElement): void {
    for (const child of this.children) {
      child.destroy(this.el);
    }

    rootEl.removeChild(this.el);
  }

  public addControl(control: MapControl) {
    this.children.push(control);
  }

  public removeControl(control: MapControl) {
    const controlIndex = this.children.findIndex(c => c === control);

    this.children = this.children.splice(controlIndex);
  }
}
