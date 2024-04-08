import { MapFeatureFlags } from '../flags';
import { GlyphsTextrureAtlasType, GlyphsTextrureAtlasConfig, TextureAtlasState } from './glyphs_config';
import { getGlyphTextureAtlasFromPngConfig } from './glyphs_helper_png';
import { getGlyphTextureAtlasFromSvgConfig } from './glyphs_helper_svg';

export type GlyphsManagerState = Record<string, TextureAtlasState>;
export type GlyphsManagerMappingState = Record<string, Omit<TextureAtlasState, 'source'>>;

const GLYPH_TYPE_SOURCE_MAP: Record<
  GlyphsTextrureAtlasType,
  (config: GlyphsTextrureAtlasConfig) => Promise<TextureAtlasState>
> = {
  [GlyphsTextrureAtlasType.png]: getGlyphTextureAtlasFromPngConfig,
  [GlyphsTextrureAtlasType.svg]: getGlyphTextureAtlasFromSvgConfig,
};

export class GlyphsManager {
  constructor(
    private readonly featureFlags: MapFeatureFlags,
    private readonly atlasesConfigs: Record<string, GlyphsTextrureAtlasConfig> = {},
    private readonly state: GlyphsManagerState = {},
    private readonly mappingState: GlyphsManagerMappingState = {},
  ) {}

  async init() {
    const promises = [];

    for (const atlasConfig of Object.values(this.atlasesConfigs)) {
      const glyphSourceHelper = GLYPH_TYPE_SOURCE_MAP[atlasConfig.type];

      promises.push(glyphSourceHelper(atlasConfig));
    }

    return Promise.all(promises).then((textureAtlases: TextureAtlasState[]) => this.setupMappingState(textureAtlases));
  }

  destroy() {}

  private setupMappingState(textureAtlases: TextureAtlasState[]) {
    for (const atlasState of textureAtlases) {
      this.mappingState[atlasState.name] = {
        type: atlasState.type,
        name: atlasState.name,
        width: atlasState.width,
        height: atlasState.height,
        mapping: atlasState.mapping,
      };

      this.state[atlasState.name] = atlasState;
    }

    return this.mappingState;
  }

  public getMappingState(): GlyphsManagerMappingState | undefined {
    return this.mappingState;
  }

  public getAll(): TextureAtlasState[] {
    return Object.values(this.state);
  }

  public getAtlas(name: string): TextureAtlasState | undefined {
    return this.state[name];
  }
}
