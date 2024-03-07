import {
  FontFormatType,
  TextureFontConfig,
  TextureFontAtlas,
  TextureFontGlyph,
  DEFAULT_SUPPORTED_CHARCODE_RANGES,
} from './font_config';

export async function getFontAtlasFromTextureConfig(config: TextureFontConfig): Promise<TextureFontAtlas> {
  const fontAtlas: TextureFontAtlas = {
    type: FontFormatType.sdf,
    name: config.name,
    glyphs: {},
    sources: {},
    ranges: config.ranges || DEFAULT_SUPPORTED_CHARCODE_RANGES,
    pixelRatio: config.pixelRatio,
    ascender: 0,
    descender: 0,
  };

  await Promise.all(
    fontAtlas.ranges.map(async (range: [number, number]) => {
      const url = config.sourceUrl.replace('{range}', `${range[0]}-${range[1]}`);

      await populateFontAtlas(url, range, config, fontAtlas);
    })
  );

  return fontAtlas;
}

export async function populateFontAtlas(
  url: string,
  range: [number, number],
  config: TextureFontConfig,
  fontAtlas: TextureFontAtlas
) {
  const rangeStr = `${range[0]}-${range[1]}`;
  const sourceImage = new Image(config.width, config.height);
  sourceImage.src = url;
  sourceImage.crossOrigin = 'anonymous';
  await new Promise<HTMLImageElement>(resolve => {
    sourceImage.onload = () => {
      resolve(sourceImage);
    };
  });
  fontAtlas.sources[rangeStr] = sourceImage;

  let currentX = 0;
  let currentY = 0;

  for (let charCode = range[0]; charCode <= range[1]; charCode++) {
    const char = String.fromCharCode(charCode);
    fontAtlas.glyphs[charCode] = getTextureFontGlyph(config, char, charCode, currentX, currentY);

    currentX += config.glyphWidth;
    if (currentX >= config.width) {
      currentX = 0;
      currentY += config.glyphHeight;
    }
  }
}

export function getTextureFontGlyph(
  config: TextureFontConfig,
  char: string,
  charCode: number,
  x: number,
  y: number
): TextureFontGlyph {
  return {
    type: FontFormatType.texture,
    char,
    charCode,
    x,
    y,
    width: config.glyphWidth,
    height: config.glyphHeight,
    pixelRatio: config.pixelRatio,
  };
}
