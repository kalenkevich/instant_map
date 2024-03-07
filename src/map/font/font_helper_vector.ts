import { Font, parse as parseFont } from 'opentype.js';
import {
  FontFormatType,
  VectorFontConfig,
  VectorFontAtlas,
  VectorFontGlyph,
  DEFAULT_SUPPORTED_CHARCODE_RANGES,
  FontAtlas,
} from './font_config';

export async function getFontAtlasFromVectorConfig(config: VectorFontConfig): Promise<VectorFontAtlas> {
  const fontAtlas: VectorFontAtlas = {
    type: FontFormatType.vector,
    name: config.name,
    glyphs: {},
    ranges: config.ranges || DEFAULT_SUPPORTED_CHARCODE_RANGES,
    ascender: 0,
    descender: 0,
  };

  if (config.sourceUrl.includes('{range}')) {
    await Promise.all(
      fontAtlas.ranges.map(async (range: [number, number]) => {
        const url = config.sourceUrl.replace('{range}', `${range[0]}-${range[1]}`);
        const fontSource = await fetch(url).then(res => res.arrayBuffer());

        populateFontAtlas(fontSource, fontAtlas);
      })
    );
  } else {
    const url = config.sourceUrl;
    const fontSource = await fetch(url).then(res => res.arrayBuffer());

    populateFontAtlas(fontSource, fontAtlas);
  }

  return fontAtlas;
}

export function populateFontAtlas(fontSource: ArrayBuffer, fontAtlas: FontAtlas) {
  const font = parseFont(fontSource);

  for (const [from, to] of fontAtlas.ranges) {
    for (let charCode = from; charCode <= to; charCode++) {
      const char = String.fromCharCode(charCode);
      const glyph = getVectorGlyph(font, char, charCode);

      fontAtlas.glyphs[charCode] = glyph;
    }
  }

  fontAtlas.ascender = font.ascender;
  fontAtlas.descender = font.descender;
}

export function getVectorGlyph(font: Font, char: string, charCode: number): VectorFontGlyph {
  const glyph = font.charToGlyph(char);
  const bbox = glyph.getBoundingBox();

  return {
    type: FontFormatType.vector,
    char,
    charCode,
    source: glyph.getPath().commands,
    width: glyph.advanceWidth,
    height: bbox.y2 - bbox.y1,
  };
}
