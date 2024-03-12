import { Font, Glyph, parse as parseFont } from 'opentype.js';
import { canvasToArrayBufferTextureSource, imageElToTextureSource } from '../texture/texture_utils';
import {
  FontSourceType,
  FontFormatType,
  TextureFontConfig,
  TextureFontAtlas,
  TextureFontGlyph,
  DEFAULT_SUPPORTED_CHARCODE_RANGES,
  UNDEFINED_CHAR_CODE,
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
    sources: [],
    ranges: config.ranges || DEFAULT_SUPPORTED_CHARCODE_RANGES,
    pixelRatio: config.pixelRatio,
    ascender: 0,
    descender: 0,
  };

  await Promise.all(
    fontAtlas.ranges.map(async (range: [number, number], index: number) => {
      const url = config.sourceUrl.replace('{range}', `${range[0]}-${range[1]}`);

      await populateFontAtlasFromImage(url, range, index, config, fontAtlas);
    })
  );

  return fontAtlas;
}

export async function populateFontAtlasFromImage(
  url: string,
  range: [number, number],
  index: number,
  config: TextureFontConfig,
  fontAtlas: TextureFontAtlas
) {
  const sourceImage = new Image(config.width, config.height);
  sourceImage.src = url;
  sourceImage.crossOrigin = 'anonymous';
  await new Promise<HTMLImageElement>(resolve => {
    sourceImage.onload = () => {
      resolve(sourceImage);
    };
  });
  fontAtlas.sources[index] = { source: imageElToTextureSource(sourceImage), range, index };

  let currentX = 0;
  let currentY = 0;

  for (let charCode = range[0]; charCode <= range[1]; charCode++) {
    const char = String.fromCharCode(charCode);
    fontAtlas.glyphs[charCode] = getTextureFontGlyph(
      char,
      charCode,
      currentX,
      currentY,
      config.fontSize,
      config.glyphWidth,
      config.glyphHeight,
      0,
      0,
      config.pixelRatio || 1
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
    sources: [],
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

  return fontAtlas;
}

export async function populateFontAtlasFromFont(
  fontSource: ArrayBuffer,
  config: TextureFontConfig,
  fontAtlas: TextureFontAtlas
) {
  const font = parseFont(fontSource);

  await Promise.all(
    fontAtlas.ranges.map(async (range, index) => {
      const { source, glyphs } = await generateTextureAtlas(config, range, font, 42);
      if (source === null) {
        return;
      }

      fontAtlas.sources.push({ source, range, index });

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
  margin: number = 4
) {
  const columns = getRowCount(range);
  const rows = getRowCount(range);
  const width = fontSize * columns;
  const height = fontSize * rows;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const glyphs: TextureFontGlyph[] = [];

  let currentX = margin;
  let currentY = fontSize + margin;
  let c = 0;
  let r = 0;

  // draw undefined char
  glyphs.push(
    getUndefinedCharGlyph(currentX, currentY - fontSize, fontSize, fontSize, fontSize, config.pixelRatio || 1)
  );
  ctx.rect(currentX, currentY - fontSize + margin, fontSize, fontSize);
  ctx.stroke();
  c++;
  currentX += fontSize + margin;

  let actualCanvasWidth = 0;
  let actualCanvasHeight = 0;
  for (let charCode = range[0]; charCode <= range[1]; charCode++) {
    const char = String.fromCharCode(charCode);
    const glyph = font.charToGlyph(char);
    if (glyph.name === '.notdef') {
      continue;
    }

    const charMesurement = mesureChar(font, glyph, fontSize, margin);
    const glyphX = currentX;
    const glyphY = currentY - charMesurement.height - charMesurement.actualBoundingBoxDescent - margin;

    // ctx.fillRect(glyphX, glyphY, charMesurement.width, charMesurement.height);
    // ctx.stroke();
    font.draw(ctx as unknown as CanvasRenderingContext2D, char, currentX, currentY, fontSize);

    glyphs.push(
      getTextureFontGlyph(
        char,
        charCode,
        glyphX,
        glyphY,
        charMesurement.width,
        charMesurement.height,
        fontSize,
        charMesurement.actualBoundingBoxAscent,
        charMesurement.actualBoundingBoxDescent,
        config.pixelRatio || 1
      )
    );
    currentX += charMesurement.width + margin;
    c++;
    if (c === columns) {
      actualCanvasWidth = Math.max(actualCanvasWidth, currentX);
      c = 0;
      currentX = margin;
      currentY += fontSize + margin;
      r++;
    }
  }
  actualCanvasHeight = currentY;

  if (actualCanvasWidth === 0) {
    return {
      source: null,
      glyphs: [],
    };
  }

  return {
    source: canvasToArrayBufferTextureSource(
      canvas,
      0,
      margin,
      Math.ceil(actualCanvasWidth),
      Math.ceil(actualCanvasHeight + margin)
    ),
    glyphs,
  };
}

function getRowCount(range: [number, number]) {
  return Math.ceil(Math.sqrt(range[1] - range[0] + 1));
}

export function mesureChar(font: Font, glyph: Glyph, fontSize: number, margin: number) {
  const scale = (1 / font.unitsPerEm) * fontSize;
  const width = glyph.advanceWidth * scale;
  const height = ((glyph.yMax - glyph.yMin) * scale || 0) + margin;
  const actualBoundingBoxAscent = glyph.yMax * scale || 0;
  const actualBoundingBoxDescent = glyph.yMin * scale || 0;

  return { width, height, actualBoundingBoxAscent, actualBoundingBoxDescent };
}

export function getUndefinedCharGlyph(
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  pixelRatio: number
): TextureFontGlyph {
  return {
    type: FontFormatType.texture,
    char: '',
    charCode: UNDEFINED_CHAR_CODE,
    x,
    y,
    width: width,
    height: height,
    fontSize,
    actualBoundingBoxAscent: 0,
    actualBoundingBoxDescent: 0,
    pixelRatio,
  };
}

export function getTextureFontGlyph(
  char: string,
  charCode: number,
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  actualBoundingBoxAscent: number,
  actualBoundingBoxDescent: number,
  pixelRatio: number
): TextureFontGlyph {
  return {
    type: FontFormatType.texture,
    char,
    charCode,
    x,
    y,
    width: width,
    height: height,
    fontSize,
    actualBoundingBoxAscent,
    actualBoundingBoxDescent,
    pixelRatio,
  };
}
