import { MapControl } from './map_control';
import { MapEventType } from '../map';
import { RenderStats } from '../render/renderer';
import { GlRenderStats } from '../render/gl/gl_renderer';

export class MapDebugControl extends MapControl {
  private rootEl: HTMLElement;
  private renderRows: HTMLElement[];
  private preheatRows: HTMLElement[];

  public init(): void {
    this.updateRenderStats = this.updateRenderStats.bind(this);
    this.updatePreheatStats = this.updatePreheatStats.bind(this);

    this.rootEl = this.document.createElement('div');

    this.rootEl.style.marginRight = '5px';
    this.rootEl.style.marginBottom = '5px';
    this.rootEl.style.fontSize = '12px';
    this.rootEl.style.background = 'white';
    this.rootEl.style.border = '1px solid black';

    this.renderRows = [this.createRow('Time'), this.createRow('FPS'), this.createRow('Objects')];
    this.preheatRows = [this.createRow('Time'), this.createRow('Objects')];

    this.rootEl.appendChild(this.createSection('Render'));
    for (const row of this.renderRows) {
      this.rootEl.appendChild(row);
    }

    this.rootEl.appendChild(this.createSectionDivider());
    this.rootEl.appendChild(this.createSection('Preheat'));
    for (const row of this.preheatRows) {
      this.rootEl.appendChild(row);
    }

    this.map.on(MapEventType.RENDER, this.updateRenderStats);
    this.map.on(MapEventType.PREHEAT, this.updatePreheatStats);
  }

  public attach(parent: HTMLElement): void {
    parent.appendChild(this.rootEl);

    this.updateRenderStats(MapEventType.RENDER, { timeInMs: 0, tiles: 0 });
    this.updatePreheatStats(MapEventType.PREHEAT, { timeInMs: 0, tiles: 0 });
  }

  public destroy(parent: HTMLElement): void {
    parent.removeChild(this.rootEl);

    this.map.off(MapEventType.RENDER, this.updateRenderStats);
    this.map.off(MapEventType.PREHEAT, this.updatePreheatStats);
  }

  private createSection(name: string): HTMLElement {
    const section = this.document.createElement('div');

    section.innerText = `${name}:`;
    section.style.padding = '3px';

    return section;
  }

  private createSectionDivider(): HTMLElement {
    const divider = this.document.createElement('div');

    divider.style.borderBottom = '1px solid black';

    return divider;
  }

  private createRow(name: string): HTMLElement {
    const row = this.document.createElement('div');
    const label = this.document.createElement('span');
    const value = this.document.createElement('span');

    label.innerText = `${name}: `;

    row.style.padding = '3px';
    row.appendChild(label);
    row.appendChild(value);

    return row;
  }

  private updateRenderStats(eventType: MapEventType, renderStats: RenderStats) {
    // Render time row
    (this.renderRows[0].children[1] as HTMLElement).innerText = `${renderStats.timeInMs} ms`;
    // FPS row
    (this.renderRows[1].children[1] as HTMLElement).innerText = `${Math.ceil(1000 / renderStats.timeInMs)}`;

    if ((renderStats as GlRenderStats).objects) {
      (this.renderRows[2].children[1] as HTMLElement).innerText = `${(renderStats as GlRenderStats).objects}`;
    }
  }

  private updatePreheatStats(eventType: MapEventType, preheatStats: RenderStats) {
    // Preheat time row
    (this.preheatRows[0].children[1] as HTMLElement).innerText = `${preheatStats.timeInMs} ms`;

    if ((preheatStats as GlRenderStats).objects) {
      (this.preheatRows[1].children[1] as HTMLElement).innerText = `${(preheatStats as GlRenderStats).objects}`;
    }
  }
}
