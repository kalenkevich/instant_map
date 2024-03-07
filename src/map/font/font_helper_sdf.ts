import Protobuf from 'pbf';
import {
  FontFormatType,
  SdfFontConfig,
  SdfFontAtlas,
  SdfFontGlyph,
  DEFAULT_SUPPORTED_CHARCODE_RANGES,
} from './font_config';

export const DEFAULT_GLYPH_BORDER = 3;

// https://github.com/mapbox/node-fontnik/blob/master/proto/glyphs.proto
export enum SdfAtlasSourceProtobuf {
  atlas = 1,
}

export enum SdfAtlasProtobuf {
  name = 1,
  range = 2,
  glyph = 3,
  ascender = 4,
  descender = 5,
}

export enum SdfGlyphProtobuf {
  char = 1,
  source = 2,
  width = 3,
  height = 4,
  x = 5,
  y = 6,
  advance = 7,
}

export async function getFontAtlasFromSdfConfig(config: SdfFontConfig): Promise<SdfFontAtlas> {
  const fontAtlas: SdfFontAtlas = {
    type: FontFormatType.sdf,
    name: config.name,
    glyphs: {},
    ranges: config.ranges || DEFAULT_SUPPORTED_CHARCODE_RANGES,
    ascender: 0,
    descender: 0,
  };

  if (config.sourceUrl.includes('{range}')) {
    await Promise.all(
      fontAtlas.ranges.map(range => {
        const url = config.sourceUrl.replace('{range}', `${range[0]}-${range[1]}`);

        return fetch(url)
          .then(res => res.arrayBuffer())
          .then(arrayBuffer => populateSdfAtlasFromPbf(arrayBuffer, fontAtlas));
      })
    );
  } else {
    await fetch(config.sourceUrl)
      .then(res => res.arrayBuffer())
      .then(arrayBuffer => populateSdfAtlasFromPbf(arrayBuffer, fontAtlas));
  }

  return fontAtlas;
}

export function populateSdfAtlasFromPbf(source: ArrayBuffer, fontAtlas: SdfFontAtlas) {
  return new Protobuf(source).readFields((tag: number, fontAtlas: SdfFontAtlas, pbf: Protobuf) => {
    if (tag === SdfAtlasSourceProtobuf.atlas) {
      pbf.readMessage(parseSdfTextureAtlas, fontAtlas);
    }
  }, fontAtlas);
}

export function parseSdfTextureAtlas(tag: number, fontAtlas: SdfFontAtlas, pbf: Protobuf) {
  switch (tag) {
    case SdfAtlasProtobuf.glyph: {
      const glyph = pbf.readMessage(parseSdfGlyph, {} as SdfFontGlyph);
      if (glyph.source && glyph.width > 0 && glyph.height > 0) {
        fontAtlas.glyphs[glyph.charCode] = glyph;
      }

      return;
    }
    case SdfAtlasProtobuf.ascender: {
      fontAtlas.ascender = pbf.readSVarint();
      return;
    }
    case SdfAtlasProtobuf.descender: {
      fontAtlas.descender = pbf.readSVarint();
      return;
    }
  }
}

export function parseSdfGlyph(tag: number, glyph: SdfFontGlyph, pbf: Protobuf) {
  switch (tag) {
    case SdfGlyphProtobuf.char: {
      glyph.charCode = pbf.readVarint();
      glyph.char = String.fromCharCode(glyph.charCode);
      return;
    }
    case SdfGlyphProtobuf.source: {
      glyph.source = new Uint8ClampedArray(pbf.readBytes());
      return;
    }
    case SdfGlyphProtobuf.width: {
      glyph.width = pbf.readVarint() + 2 * DEFAULT_GLYPH_BORDER;
      return;
    }
    case SdfGlyphProtobuf.height: {
      glyph.height = pbf.readVarint() + 2 * DEFAULT_GLYPH_BORDER;
      return;
    }
    case SdfGlyphProtobuf.x: {
      glyph.x = pbf.readSVarint();
      return;
    }
    case SdfGlyphProtobuf.y: {
      glyph.y = pbf.readSVarint();
      return;
    }
    case SdfGlyphProtobuf.advance: {
      glyph.advance = pbf.readVarint();
      return;
    }
  }
}
