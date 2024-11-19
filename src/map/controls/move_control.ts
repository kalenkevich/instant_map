import { MapControl } from './map_control';
import { throttle } from '../utils/trottle';

export class MoveControl extends MapControl {
  private parentEl: HTMLElement;

  private rows: HTMLElement[];
  private upButton: HTMLButtonElement;
  private downButton: HTMLButtonElement;
  private leftButton: HTMLButtonElement;
  private rightButton: HTMLButtonElement;

  private debounceTimeMs = 20;
  private stepDeltaInPx = 512;

  public init(): void {
    this.parentEl = this.document.createElement('div');
    this.parentEl.style.marginRight = '5px';
    this.parentEl.style.marginBottom = '5px';

    this.rows = [this.createRow(), this.createRow(), this.createRow()];

    this.upButton = this.createButton('▲', 'move-up', 0);
    this.rightButton = this.createButton('▲', 'move-right', 90);
    this.downButton = this.createButton('▲', 'move-down', 180);
    this.leftButton = this.createButton('▲', 'move-left', 270);

    this.upButton.onclick = throttle(() => {
      this.map.panBy([0, -this.stepDeltaInPx, 0]);
    }, this.debounceTimeMs);
    this.downButton.onclick = throttle(() => {
      this.map.panBy([0, this.stepDeltaInPx, 0]);
    }, this.debounceTimeMs);
    this.rightButton.onclick = throttle(() => {
      this.map.panBy([this.stepDeltaInPx, 0, 0]);
    }, this.debounceTimeMs);
    this.leftButton.onclick = throttle(() => {
      this.map.panBy([-this.stepDeltaInPx, 0, 0]);
    }, this.debounceTimeMs);

    this.rows[0].appendChild(this.createEmptyBlock());
    this.rows[0].appendChild(this.upButton);
    this.rows[0].appendChild(this.createEmptyBlock());
    this.rows[1].appendChild(this.leftButton);
    this.rows[1].appendChild(this.createEmptyBlock());
    this.rows[1].appendChild(this.rightButton);
    this.rows[2].appendChild(this.createEmptyBlock());
    this.rows[2].appendChild(this.downButton);
    this.rows[2].appendChild(this.createEmptyBlock());

    for (const row of this.rows) {
      this.parentEl.appendChild(row);
    }
  }

  public attach(rootEl: HTMLElement): void {
    rootEl.appendChild(this.parentEl);
  }

  public destroy(rootEl: HTMLElement): void {
    rootEl.removeChild(this.parentEl);
  }

  private createRow(): HTMLElement {
    const row = this.document.createElement('div');

    row.style.display = 'flex';

    return row;
  }

  private createEmptyBlock(): HTMLElement {
    const div = this.document.createElement('div');

    div.style.width = '30px';
    div.style.height = '30px';

    return div;
  }

  private createButton(text: string, cssClass: string, rotationDegree: number): HTMLButtonElement {
    const button = this.document.createElement('button');

    button.classList.add(cssClass);
    button.style.cursor = 'pointer';
    button.style.width = '30px';
    button.style.height = '30px';
    button.style.lineHeight = '24px';
    button.style.fontSize = '14px';

    button.style.transform = `rotate(${rotationDegree}deg)`;
    button.innerText = text;

    return button;
  }
}
