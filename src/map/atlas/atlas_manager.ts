import { AtlasTextrureConfig, AtlasTextrureMapping } from './atlas_config';

export interface AtlasTextureState {
  name: string;
  width: number;
  height: number;
  ready: boolean;
  source: ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement;
  mapping: Record<string, AtlasTextrureMapping>;
}

export type AtlasManagerState = Record<string, AtlasTextureState>;

export type AtlasTextureMappingState = Record<string, Omit<AtlasTextureState, 'source' | 'ready'>>;

export class AtlasTextureManager {
  private state: AtlasManagerState = {};
  private mappingState?: AtlasTextureMappingState;

  constructor(private readonly atlasesConfigs: Record<string, AtlasTextrureConfig>) {}

  async init() {
    const promises = [];

    for (const atlasConfig of Object.values(this.atlasesConfigs)) {
      if (typeof atlasConfig.source) {
        promises.push(this.setupAtlasSourceAndMapping(atlasConfig));
      }
    }

    return Promise.all(promises).then(() => this.setupMappingState());
  }

  destroy() {}

  private setupAtlasSourceAndMapping(atlasConfig: AtlasTextrureConfig): Promise<void> {
    const promises: Promise<void>[] = [];

    this.state[atlasConfig.name] = {
      ...atlasConfig,
      ready: false,
      source: undefined,
      mapping: undefined,
    };

    if (typeof atlasConfig.source === 'string') {
      const image = new Image(atlasConfig.width, atlasConfig.height);

      image.src = atlasConfig.source;
      image.crossOrigin = 'anonymous';

      promises.push(
        new Promise<void>(resolve => {
          image.onload = () => {
            this.state[atlasConfig.name].source = image;

            if (this.state[atlasConfig.name].mapping) {
              this.state[atlasConfig.name].ready = true;
            }

            resolve();
          };
        })
      );
    } else {
      this.state[atlasConfig.name].source = atlasConfig.source;
      if (this.state[atlasConfig.name].mapping) {
        this.state[atlasConfig.name].ready = true;
      }
    }

    if (typeof atlasConfig.mapping === 'string') {
      if (atlasConfig.mapping.startsWith('font_default_mapping')) {
        const [, , , widthS, heightS, sizeS, pixelRatioS] = atlasConfig.mapping.split('_');
        const width = parseInt(widthS);
        const height = parseInt(heightS);
        const size = parseInt(sizeS);
        const pixelRatio = parseInt(pixelRatioS);

        let currentX = 0;
        let currentY = 0;
        const mapping: Record<string, AtlasTextrureMapping> = {};
        for (let i = 0; i < size; i++) {
          const char = String.fromCharCode(i);

          mapping[char] = {
            x: currentX,
            y: currentY,
            width,
            height,
            pixelRatio,
            visible: true,
          };

          currentX += width;
          if (currentX >= atlasConfig.width) {
            currentX = 0;
            currentY += height;
          }
        }

        this.state[atlasConfig.name].mapping = mapping;
        if (!!this.state[atlasConfig.name].source) {
          this.state[atlasConfig.name].ready = true;
        }
      } else {
        promises.push(
          fetch(atlasConfig.mapping)
            .then(res => res.json())
            .then((mapping: Record<string, AtlasTextrureMapping>) => {
              this.state[atlasConfig.name].mapping = mapping;

              if (!!this.state[atlasConfig.name].source) {
                this.state[atlasConfig.name].ready = true;
              }
            })
        );
      }
    } else {
      this.state[atlasConfig.name].mapping = atlasConfig.mapping;
      if (!!this.state[atlasConfig.name].source) {
        this.state[atlasConfig.name].ready = true;
      }
    }

    return Promise.all(promises).then();
  }

  private setupMappingState() {
    const stateWithoutSource: AtlasTextureMappingState = {};

    for (const atlasState of Object.values(this.state)) {
      stateWithoutSource[atlasState.name] = {
        name: atlasState.name,
        width: atlasState.width,
        height: atlasState.height,
        mapping: atlasState.mapping,
      };
    }

    return (this.mappingState = stateWithoutSource);
  }

  public getMappingState(): AtlasTextureMappingState | undefined {
    return this.mappingState;
  }

  public getAll(): AtlasTextureState[] {
    return Object.values(this.state);
  }

  public getAtlas(name: string): AtlasTextureState | undefined {
    return this.state[name];
  }
}
