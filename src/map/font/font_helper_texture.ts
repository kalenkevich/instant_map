import { Font, Glyph, parse as parseFont } from 'opentype.js';
import {
  FontSourceType,
  FontFormatType,
  TextureFontConfig,
  TextureFontAtlas,
  TextureFontGlyph,
  DEFAULT_SUPPORTED_CHARCODE_RANGES,
} from './font_config';
import { downloadBitmapImage } from '../utils/download_utils';

export async function getFontAtlasFromTextureConfig(config: TextureFontConfig): Promise<TextureFontAtlas> {
  if (config.sourceType === FontSourceType.image) {
    return getFontAtlasFromImage(config);
  }

  return getFontAtlasFromFont(config);
}

export async function getFontAtlasFromImage(config: TextureFontConfig): Promise<TextureFontAtlas> {
  const fontAtlas: TextureFontAtlas = {
    type: FontFormatType.texture,
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

      await populateFontAtlasFromImage(url, range, config, fontAtlas);
    })
  );

  return fontAtlas;
}

export async function populateFontAtlasFromImage(
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
    fontAtlas.glyphs[charCode] = getTextureFontGlyph(
      config,
      char,
      charCode,
      currentX,
      currentY,
      config.glyphWidth,
      config.glyphHeight,
      0,
      0
    );

    currentX += config.glyphWidth;
    if (currentX >= config.width) {
      currentX = 0;
      currentY += config.glyphHeight;
    }
  }
}

export async function getFontAtlasFromFont(config: TextureFontConfig): Promise<TextureFontAtlas> {
  const fontAtlas: TextureFontAtlas = {
    type: FontFormatType.texture,
    name: config.name,
    glyphs: {},
    sources: {},
    ranges: config.ranges || DEFAULT_SUPPORTED_CHARCODE_RANGES,
    ascender: 0,
    descender: 0,
    pixelRatio: config.pixelRatio || 1,
  };

  if (config.sourceUrl.includes('{range}')) {
    await Promise.all(
      fontAtlas.ranges.map(async (range: [number, number]) => {
        const url = config.sourceUrl.replace('{range}', `${range[0]}-${range[1]}`);
        const fontSource = await fetch(url).then(res => res.arrayBuffer());

        populateFontAtlasFromFont(fontSource, config, fontAtlas);
      })
    );
  } else {
    const url = config.sourceUrl;
    const fontSource = await fetch(url).then(res => res.arrayBuffer());

    populateFontAtlasFromFont(fontSource, config, fontAtlas);
  }

  return {} as TextureFontAtlas;
}

export async function populateFontAtlasFromFont(
  fontSource: ArrayBuffer,
  config: TextureFontConfig,
  fontAtlas: TextureFontAtlas
) {
  const font = parseFont(fontSource);

  await Promise.all(
    fontAtlas.ranges.map(async range => {
      const key = `${range[0]}-${range[1]}`;
      const { source, glyphs } = await generateTextureAtlas(config, range, font, 32);

      fontAtlas.sources[key] = source;

      // downloadBitmapImage(source);

      for (const g of glyphs) {
        fontAtlas.glyphs[g.charCode] = g;
      }
    })
  );
}

export async function generateTextureAtlas(
  config: TextureFontConfig,
  range: [number, number],
  font: Font,
  fontSize: number,
  margin: number = 3
) {
  const columns = getRowCount(range);
  const rows = getRowCount(range);
  const charWidth = fontSize;
  const charHeight = fontSize;
  const width = charWidth * columns;
  const height = charWidth * rows;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const glyphs: TextureFontGlyph[] = [];

  let currentX = margin;
  let currentY = charHeight + margin;
  let c = 0;
  let r = 0;

  let actualCanvasWidth = 0;
  let actualCanvasHeight = 0;
  for (let charCode = range[0]; charCode <= range[1]; charCode++) {
    const char = String.fromCharCode(charCode);
    const glyph = font.charToGlyph(char);
    if (glyph.name === '.notdef') {
      glyphs.push(getTextureFontEmptyGlyph(char, charCode));
      continue;
    }

    const charMesurement = mesureChar(font, glyph, fontSize);
    const glyphX = currentX;
    const glyphY = currentY - charMesurement.height - charMesurement.actualBoundingBoxDescent;

    ctx.rect(glyphX, glyphY, charMesurement.width, charMesurement.height);
    ctx.stroke();
    font.draw(ctx as unknown as CanvasRenderingContext2D, char, currentX, currentY, fontSize);

    glyphs.push(
      getTextureFontGlyph(
        config,
        char,
        charCode,
        glyphX,
        glyphY,
        charMesurement.width,
        charMesurement.height,
        charMesurement.actualBoundingBoxAscent,
        charMesurement.actualBoundingBoxDescent
      )
    );
    currentX += charMesurement.width + margin;
    c++;

    if (c === columns) {
      actualCanvasWidth = Math.max(actualCanvasWidth, currentX);
      c = 0;
      currentX = margin;
      currentY += charHeight + margin;
      r++;
    }
  }
  actualCanvasHeight = currentY;

  return {
    source: await createImageBitmap(canvas, 0, margin, actualCanvasWidth, actualCanvasHeight + margin, {
      premultiplyAlpha: 'premultiply',
    }),
    glyphs,
  };
}

function getRowCount(range: [number, number]) {
  return Math.sqrt(range[1] - range[0] + 1);
}

export function mesureChar(font: Font, glyph: Glyph, fontSize: number) {
  const scale = (1 / font.unitsPerEm) * fontSize;
  const width = glyph.advanceWidth * scale;
  const actualBoundingBoxAscent = glyph.yMax * scale;
  const actualBoundingBoxDescent = glyph.yMin * scale;
  const height = (glyph.yMax - glyph.yMin) * scale;

  return { width, height, actualBoundingBoxAscent, actualBoundingBoxDescent };
}

export function getTextureFontGlyph(
  config: TextureFontConfig,
  char: string,
  charCode: number,
  x: number,
  y: number,
  width: number,
  height: number,
  actualBoundingBoxAscent: number,
  actualBoundingBoxDescent: number
): TextureFontGlyph {
  return {
    type: FontFormatType.texture,
    char,
    charCode,
    x,
    y,
    width: width,
    height: height,
    actualBoundingBoxAscent,
    actualBoundingBoxDescent,
    pixelRatio: config.pixelRatio,
  };
}

export function getTextureFontEmptyGlyph(char: string, charCode: number): TextureFontGlyph {
  return {
    type: FontFormatType.texture,
    char,
    charCode,
    x: -1,
    y: -1,
    width: 0,
    height: 0,
    actualBoundingBoxAscent: 0,
    actualBoundingBoxDescent: 0,
    pixelRatio: 0,
  };
}
