import {
  GlyphsTextrureAtlasType,
  PngGlyphsTextrureAtlasConfig,
  TextureSource,
  TextureAtlasState,
  GlyphTextureAtlasMapping,
} from './glyphs_config';

export async function getGlyphTextureAtlasFromPngConfig(
  config: PngGlyphsTextrureAtlasConfig
): Promise<TextureAtlasState> {
  const [source, mapping] = await Promise.all([
    getGlyphTextureAtlasSourceFromPngConfig(config),
    getGlyphTextureAtlasMappingFromPngConfig(config),
  ]);

  return {
    type: GlyphsTextrureAtlasType.png,
    name: config.name,
    width: config.width,
    height: config.height,
    source,
    mapping,
  };
}

export async function getGlyphTextureAtlasSourceFromPngConfig(
  config: PngGlyphsTextrureAtlasConfig
): Promise<TextureSource> {
  if (config.source) {
    return config.source;
  }

  if (!config.sourceUrl) {
    throw new Error('One of "source" or "sourceUrl" should be defined for PngGlyphsTextrureAtlasConfig.');
  }

  const image = new Image(config.width, config.height);
  image.src = config.sourceUrl;
  image.crossOrigin = 'anonymous';

  return new Promise<HTMLImageElement>(resolve => {
    image.onload = () => {
      resolve(image);
    };
  });
}

export async function getGlyphTextureAtlasMappingFromPngConfig(
  config: PngGlyphsTextrureAtlasConfig
): Promise<Record<string, GlyphTextureAtlasMapping>> {
  if (config.mapping) {
    return config.mapping;
  }

  if (!config.mappingUrl) {
    throw new Error('One of "mapping" or "mappingUrl" should be defined for PngGlyphsTextrureAtlasConfig.');
  }

  return fetch(config.mappingUrl).then(res => res.json());
}
