import { MapControl } from "./map_control";
import { throttle } from "../utils";
import { Point } from "../geometry/point";

export class MoveControl extends MapControl {
  private parentEl: HTMLElement;
  private upButton: HTMLButtonElement;
  private downButton: HTMLButtonElement;
  private leftButton: HTMLButtonElement;
  private rightButton: HTMLButtonElement;

  private debounceTimeMs = 0;

  private stepDeltaInPx = 256;

  public init(): void {
    this.parentEl = this.document.createElement('div');
    this.parentEl.style.display = 'flex';

    this.upButton = this.createButton('▲', 'move-up', 0);
    this.rightButton = this.createButton('▲', 'move-right', 90);
    this.downButton = this.createButton('▲', 'move-down', 180);
    this.leftButton = this.createButton('▲', 'move-left', 270);

    this.upButton.onclick = throttle(() => {
      this.map.panBy(new Point(0, -this.stepDeltaInPx), { animate: true, durationInSec: 0.5 });
    }, this.debounceTimeMs);
    this.downButton.onclick = throttle(() => {
      this.map.panBy(new Point(0, this.stepDeltaInPx), { animate: true, durationInSec: 0.5 });
    }, this.debounceTimeMs);
    this.rightButton.onclick = throttle(() => {
      this.map.panBy(new Point(this.stepDeltaInPx, 0), { animate: true, durationInSec: 0.5 });
    }, this.debounceTimeMs);
    this.leftButton.onclick = throttle(() => {
      this.map.panBy(new Point(-this.stepDeltaInPx, 0), { animate: true, durationInSec: 0.5 });
    }, this.debounceTimeMs);

    this.parentEl.appendChild(this.upButton);
    this.parentEl.appendChild(this.downButton);
    this.parentEl.appendChild(this.leftButton);
    this.parentEl.appendChild(this.rightButton);
  }

  public attach(rootEl: HTMLElement): void {
    rootEl.appendChild(this.parentEl);
  }

  public destroy(rootEl: HTMLElement): void {
    rootEl.removeChild(this.parentEl);
  }

  private createButton(text: string, cssClass: string, rotationDegree: number): HTMLButtonElement {
    const button = this.document.createElement('button');

    button.classList.add(cssClass);
    button.style.cursor = 'pointer';
    button.style.width = '30px';
    button.style.height = '30px';
    button.style.lineHeight = '24px';
    button.style.fontSize = '14px';
    button.style.marginRight = '5px';
    button.style.marginBottom = '5px';
    button.style.transform = `rotate(${rotationDegree}deg)`;
    button.innerText = text;

    return button;
  }
}