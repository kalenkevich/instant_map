import { MapFeatureFlags } from '../flags';
import { FontFormatType, FontConfig, FontAtlas } from './font_config';
import { getFontAtlasFromVectorConfig } from './font_helper_vector';
import { getFontAtlasFromSdfConfig } from './font_helper_sdf';
import { getFontAtlasFromTextureConfig } from './font_helper_texture';

const FONT_FORMAT_TYPE_ATLAS_MAP: Record<
  FontFormatType,
  (config: FontConfig, debugMode: boolean) => Promise<FontAtlas>
> = {
  [FontFormatType.vector]: getFontAtlasFromVectorConfig,
  [FontFormatType.sdf]: getFontAtlasFromSdfConfig,
  [FontFormatType.texture]: getFontAtlasFromTextureConfig,
};

export class FontManager {
  constructor(
    private readonly featureFlags: MapFeatureFlags,
    private readonly fontsConfig: Record<string, FontConfig> = {},
    private readonly state: Record<string, FontAtlas> = {},
  ) {}

  async init() {
    const promises = [];

    for (const fontConfig of Object.values(this.fontsConfig)) {
      const helper = FONT_FORMAT_TYPE_ATLAS_MAP[fontConfig.type];

      promises.push(helper(fontConfig, this.featureFlags.fontManagerDebugModeEnabled));
    }

    return Promise.all(promises).then(fontAtlases => {
      for (const fontAtlas of fontAtlases) {
        this.state[fontAtlas.name] = fontAtlas;
      }
    });
  }

  destroy() {}

  getFontAtlas(fontName: string): FontAtlas {
    return this.state[fontName];
  }

  getState(): Record<string, FontAtlas> {
    return this.state;
  }
}
