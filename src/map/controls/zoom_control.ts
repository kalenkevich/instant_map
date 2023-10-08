import { throttle } from "../utils";
import { MapControl } from "./map_control";

export class ZoomControl extends MapControl {
  private parentEl: HTMLElement;
  private plusButton: HTMLButtonElement;
  private minusButton: HTMLButtonElement;

  private zoomStep = 0.2;
  private debounceTimeMs = 20;

  public init(): void {
    this.parentEl = this.document.createElement('div');
    this.parentEl.style.display = 'flex';
    this.parentEl.style.flexDirection = 'column';

    this.plusButton = this.createButton('+', 'zoom-plus');
    this.minusButton = this.createButton('-', 'zoom-minus');

    this.plusButton.onclick = throttle(() => {
      this.map.setZoom(this.map.getZoom() + this.zoomStep);
    }, this.debounceTimeMs);
    this.minusButton.onclick = throttle(() => {
      this.map.setZoom(this.map.getZoom() - this.zoomStep);
    }, this.debounceTimeMs);

    this.parentEl.appendChild(this.plusButton);
    this.parentEl.appendChild(this.minusButton);
  }

  public attach(rootEl: HTMLElement): void {
    rootEl.appendChild(this.parentEl);
  }

  public destroy(rootEl: HTMLElement): void {
    rootEl.removeChild(this.parentEl);
  }

  private createButton(text: string, cssClass?: string): HTMLButtonElement {
    const button = this.document.createElement('button');

    button.classList.add(cssClass);
    button.style.cursor = 'pointer';
    button.style.width = '30px';
    button.style.height = '30px';
    button.style.lineHeight = '24px';
    button.style.fontSize = '14px';
    button.style.marginRight = '5px';
    button.style.marginBottom = '5px';
    button.innerText = text;

    return button;
  }
}