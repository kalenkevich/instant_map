import Protobuf from 'pbf';
import {
  FontFormatType,
  SdfFontConfig,
  SdfFontAtlas,
  SdfFontGlyph,
  UNDEFINED_CHAR_CODE,
  DEFAULT_SUPPORTED_CHARCODE_RANGES,
} from './font_config';
import { downloadBitmapImage } from '../utils/download_utils';
import { Uint8ClampedArrayBufferTextureSource } from '../texture/texture';
import { arrayBufferToImageBitmapTextureSource, toUint8ClampedTextureSource } from '../texture/texture_utils';

export const DEFAULT_GLYPH_BORDER = 3;
export const SDF_SCALE = 2;
export const SPACE_CHAR_CODE = ' '.charCodeAt(0);

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

export async function getFontAtlasFromSdfConfig(
  config: SdfFontConfig,
  debugMode: boolean = false,
): Promise<SdfFontAtlas> {
  const fontAtlas: SdfFontAtlas = {
    type: FontFormatType.sdf,
    name: config.name,
    fontName: config.fontName,
    glyphs: {},
    sources: [],
    ranges: config.ranges || DEFAULT_SUPPORTED_CHARCODE_RANGES,
    ascender: 0,
    descender: 0,
  };

  const canvas = new OffscreenCanvas(config.fontSize, config.fontSize);
  const ctx = canvas.getContext('2d');

  if (config.sourceUrl.includes('{range}')) {
    await Promise.all(
      fontAtlas.ranges.map(range => {
        const url = config.sourceUrl.replace('{range}', `${range[0]}-${range[1]}`);

        return fetch(url)
          .then(res => {
            if (res.status === 200) {
              return res.arrayBuffer();
            }

            throw new Error(res.statusText);
          })
          .then(arrayBuffer => populateSdfAtlasFromPbf(arrayBuffer, fontAtlas, config, ctx))
          .catch(() => {});
      }),
    );
  } else {
    await fetch(config.sourceUrl)
      .then(res => res.arrayBuffer())
      .then(arrayBuffer => populateSdfAtlasFromPbf(arrayBuffer, fontAtlas, config, ctx));
  }

  if (!fontAtlas.glyphs[SPACE_CHAR_CODE]) {
    // create SDF Glyph for space char.
    fontAtlas.glyphs[SPACE_CHAR_CODE] = {
      type: FontFormatType.sdf,
      char: ' ',
      charCode: SPACE_CHAR_CODE,
      source: new Uint8ClampedArray(new Array(config.fontSize).map(() => 0)),
      width: config.fontSize * 0.5,
      height: 1,
      x: 0,
      y: 0,
      actualBoundingBoxAscent: 0,
      actualBoundingBoxDescent: 0,
      fontSize: config.fontSize,
      pixelRatio: config.pixelRatio || 1,
    };
  }

  const textureSource = createTextureFromSdfGlyphs(fontAtlas);
  fontAtlas.sources.push({ index: 0, source: textureSource, name: config.name });

  if (debugMode) {
    // renders texture image and attach it to html
    const bitmapTexture = await arrayBufferToImageBitmapTextureSource(
      textureSource.data,
      0,
      0,
      textureSource.width,
      textureSource.height,
    );
    await downloadBitmapImage(bitmapTexture.data);
  }

  fontAtlas.glyphs[UNDEFINED_CHAR_CODE] = getUndefinedCharGlyph(0, 0, 0, 0);

  return fontAtlas;
}

export async function populateSdfAtlasFromPbf(
  source: ArrayBuffer,
  fontAtlas: SdfFontAtlas,
  config: SdfFontConfig,
  ctx: OffscreenCanvasRenderingContext2D,
) {
  const pbf = new Protobuf(source);

  // extract values from pbf;
  pbf.readFields((tag: number, fontAtlas: SdfFontAtlas, pbf: Protobuf) => {
    if (tag === SdfAtlasSourceProtobuf.atlas) {
      pbf.readMessage(parseSdfTextureAtlas, { fontAtlas, config, ctx });
    }
  }, fontAtlas);
}

export function parseSdfTextureAtlas(
  tag: number,
  {
    fontAtlas,
    config,
    ctx,
  }: { fontAtlas: SdfFontAtlas; config: SdfFontConfig; ctx: OffscreenCanvasRenderingContext2D },
  pbf: Protobuf,
) {
  switch (tag) {
    case SdfAtlasProtobuf.name: {
      fontAtlas.fontName = pbf.readString();

      return;
    }
    case SdfAtlasProtobuf.glyph: {
      const glyph = pbf.readMessage(parseSdfGlyph, {} as SdfFontGlyph);
      if (glyph.source && glyph.width > 0 && glyph.height > 0) {
        const { actualBoundingBoxAscent, actualBoundingBoxDescent } = mesureChar(
          ctx,
          glyph.char,
          fontAtlas.fontName,
          config.fontSize,
        );

        glyph.fontSize = config.fontSize;
        glyph.pixelRatio = config.pixelRatio || 1;
        glyph.actualBoundingBoxAscent = actualBoundingBoxAscent;
        glyph.actualBoundingBoxDescent = actualBoundingBoxDescent;

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
  }
}

// Creates texture atlas array buffer from glyphs
export function createTextureFromSdfGlyphs(fontAtlas: SdfFontAtlas): Uint8ClampedArrayBufferTextureSource {
  const glyphs = Object.values(fontAtlas.glyphs);
  const { columns: textureColumns, cellWidth, cellHeight } = getTextureDimentions(glyphs);
  const EMPTY_PIXEL = [0, 0, 0, 0];

  const rows: Array<Array<Array<number[]>>> = [];
  let cells: Array<Array<number[]>> = [];
  for (const glyph of glyphs) {
    let currentPixelColumn = 0;
    let sourcePointer = 0;

    const cellBufferBucket: Array<number[]> = [];
    while (sourcePointer < glyph.source.length) {
      if (currentPixelColumn < glyph.width) {
        // make RBGA image from AlphaImage (image where alpha channel defined only)
        cellBufferBucket.push([0, 0, 0, glyph.source[sourcePointer]]);
        sourcePointer++;
        currentPixelColumn++;
      } else if (glyph.width === cellWidth) {
        currentPixelColumn = 0;
      } else {
        while (currentPixelColumn < cellWidth) {
          cellBufferBucket.push(EMPTY_PIXEL);
          currentPixelColumn++;
        }

        currentPixelColumn = 0;
      }
    }

    // Set new glyph position in texture
    glyph.x = cells.length * cellWidth;
    glyph.y = rows.length * cellHeight;

    // add empty pixels to meet cellWidth
    while (currentPixelColumn < cellWidth) {
      cellBufferBucket.push(EMPTY_PIXEL);
      currentPixelColumn++;
    }

    // add empty rows of pixels to meet cellHeight
    for (let r = glyph.height; r < cellHeight; r++) {
      for (let c = 0; c < cellWidth; c++) {
        cellBufferBucket.push(EMPTY_PIXEL);
      }
    }

    cells.push(cellBufferBucket);
    if (cells.length === textureColumns) {
      rows.push(cells);
      cells = [];
    }
  }

  const sourceBufferBucket: number[] = [];

  for (let currentRow = 0; currentRow < rows.length; currentRow++) {
    const row = rows[currentRow]; // list of glyphs

    for (let r = 0; r < cellHeight; r++) {
      for (let currentColumn = 0; currentColumn < row.length; currentColumn++) {
        const column = row[currentColumn]; // glyph

        for (let c = 0; c < cellWidth; c++) {
          const pixel = column[r * cellWidth + c];

          sourceBufferBucket.push(pixel[0]);
          sourceBufferBucket.push(pixel[1]);
          sourceBufferBucket.push(pixel[2]);
          sourceBufferBucket.push(pixel[3]);
        }
      }
    }
  }

  return toUint8ClampedTextureSource(
    new Uint8ClampedArray(sourceBufferBucket),
    cellWidth * textureColumns,
    cellHeight * rows.length,
    { sharedMemory: true, flipY: true },
  );
}

export function getTextureDimentions(glyphs: SdfFontGlyph[]): {
  width: number;
  height: number;
  rows: number;
  columns: number;
  cellWidth: number;
  cellHeight: number;
} {
  let cellWidth = 0;
  let cellHeight = 0;

  for (let i = 0; i < glyphs.length; i++) {
    cellWidth = Math.max(cellWidth, glyphs[i].width);
    cellHeight = Math.max(cellHeight, glyphs[i].height);
  }

  const squareRoot = Math.round(Math.sqrt(glyphs.length));
  const columns = squareRoot;
  const rows = squareRoot;

  return {
    width: cellWidth * columns,
    height: cellHeight * rows,
    rows,
    columns,
    cellWidth,
    cellHeight,
  };
}

export function getUndefinedCharGlyph(x: number, y: number, width: number, height: number): SdfFontGlyph {
  return {
    type: FontFormatType.sdf,
    char: '',
    charCode: UNDEFINED_CHAR_CODE,
    x,
    y,
    width: width,
    height: height,
    source: new Uint8ClampedArray([]),
    fontSize: 0,
    actualBoundingBoxAscent: 0,
    actualBoundingBoxDescent: 0,
    pixelRatio: 0,
  };
}

export function mesureChar(ctx: OffscreenCanvasRenderingContext2D, char: string, fontName: string, fontSize: number) {
  ctx.font = `${fontSize}px ${fontName}`;

  return ctx.measureText(char);
}
