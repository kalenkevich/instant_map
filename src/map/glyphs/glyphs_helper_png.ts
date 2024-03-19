import { ImageBitmapTextureSource } from '../texture/texture';
import { imageToImageBitmapTextureSource, toImageBitmapTexture } from '../texture/texture_utils';
import {
  GlyphsTextrureAtlasType,
  PngGlyphsTextrureAtlasConfig,
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
): Promise<ImageBitmapTextureSource> {
  if (config.source) {
    return toImageBitmapTexture(config.source);
  }

  if (!config.sourceUrl) {
    throw new Error('One of "source" or "sourceUrl" should be defined for PngGlyphsTextrureAtlasConfig.');
  }

  const image = new Image(config.width, config.height);
  image.src = config.sourceUrl;
  image.crossOrigin = 'anonymous';

  return new Promise<ImageBitmapTextureSource>(resolve => {
    image.onload = async () => {
      resolve(await imageToImageBitmapTextureSource(image, 0, 0, image.width, image.height));
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
