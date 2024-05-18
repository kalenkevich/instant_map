import { MapControl } from './map_control';
import { InstantMap } from '../map';
import { DataTileStyles } from '../styles/styles';

export interface DataTileStylesSelectConfig {
  id: string;
  name: string;
  styles: DataTileStyles;
  onSelect: (styles: DataTileStyles) => void;
}

export class StyleSelectControl extends MapControl {
  private parentEl: HTMLElement;
  private selectedStyleConfig: DataTileStylesSelectConfig;

  constructor(
    protected readonly map: InstantMap,
    protected readonly document: Document,
    private readonly styleConfigs: DataTileStylesSelectConfig[],
  ) {
    super(map, document);
  }

  public init(): void {
    this.parentEl = createParentEl(this.document);

    const mapStyles = this.map.getStyles();
    for (const styleConfig of this.styleConfigs) {
      const isStyleSelected = mapStyles === styleConfig.styles;

      const styleEl = createMapStyleOption(this.document, styleConfig, isStyleSelected, (selectedId: string) => {
        this.selectedStyleConfig = this.styleConfigs.find(s => s.id === selectedId);
        this.selectedStyleConfig.onSelect(this.selectedStyleConfig.styles);

        this.map.setStyles(this.selectedStyleConfig.styles);
      });

      this.parentEl.appendChild(styleEl);
    }
  }

  public attach(rootEl: HTMLElement): void {
    rootEl.appendChild(this.parentEl);
  }

  public destroy(rootEl: HTMLElement): void {
    rootEl.removeChild(this.parentEl);
  }
}

export function createParentEl(doc: Document): HTMLElement {
  const div = doc.createElement('div');
  div.style.display = 'flex';
  div.style.padding = '5px 5px 0 0';
  div.style.flexDirection = 'column';
  div.style.background = 'white';
  div.style.border = '1px solid';
  div.style.borderRadius = '3px';

  return div;
}

export function createMapStyleOption(
  doc: Document,
  styleConfig: DataTileStylesSelectConfig,
  checked: boolean,
  onSelect: (id: string) => void,
): HTMLElement {
  const div = doc.createElement('div');
  div.style.margin = '0 0 5px 0';
  div.innerHTML = `
    <label>
      <input type="radio" ${checked ? 'checked="checked"' : ''} name="${styleConfig.id}" value="${styleConfig.id}" />
      <span>${styleConfig.name}</span>
    </label>
  `;

  (div.children[0].children[0] as HTMLInputElement).onchange = function () {
    onSelect(styleConfig.id);
  };

  return div;
}
