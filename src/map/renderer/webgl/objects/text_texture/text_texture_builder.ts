import { MapFeatureType, TextAlign, TextMapFeature } from '../../../../tile/feature';
import { WebGlTextTextureBufferredGroup } from './text_texture';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder, ObjectGroupBuilderOptions, VERTEX_QUAD_POSITION } from '../object/object_group_builder';
import { toSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';
import { FontAtlas, FontGlyph, FontFormatType, UNDEFINED_CHAR_CODE } from '../../../../font/font_config';
import { addXTimes } from '../../utils/array_utils';
import { createObjectPropertiesTexture } from '../../helpers/object_properties_texture';
import { TextureSource } from '../../../../texture/texture';

export interface GlyphMapping {
  glyph: FontGlyph;
  font: string;
  fontSize: number;
  color: [number, number, number, number];
  borderColor: [number, number, number, number];
}

export const getTextFeatureGroups: ObjectGroupBuilder<TextMapFeature, WebGlTextTextureBufferredGroup> = (
  objects: TextMapFeature[],
  name: string,
  zIndex = 0,
  options: ObjectGroupBuilderOptions,
) => {
  const bufferedGroups: WebGlTextTextureBufferredGroup[] = [];
  let objectIndex: number[] = [];
  let verteciesBuffer: number[] = [];
  let texcoordBuffer: number[] = [];
  let textProperties: number[] = [];
  let colorBuffer: number[] = [];
  let borderColorBuffer: number[] = [];
  let selectionColorBuffer: number[] = [];
  let propertiesTexture = createObjectPropertiesTexture();
  let numElements = 0;
  let currentObjectIndex = 0;
  let currentFontAtlas: FontAtlas | undefined;
  let currentTextureSource: TextureSource | undefined;

  for (const text of objects) {
    const fontAtlas = options.fontManager.getFontAtlas(text.font);
    currentFontAtlas = fontAtlas;
    const texture = fontAtlas.sources[0];

    if (currentTextureSource !== texture.source) {
      if (currentTextureSource) {
        bufferedGroups.push({
          type: MapFeatureType.text,
          name: name + '_' + fontAtlas.name,
          zIndex,
          numElements,
          texture: currentTextureSource,
          isSfdTexture: fontAtlas.type === FontFormatType.sdf,
          properties: {
            texture: propertiesTexture.compileTexture(),
            sizeInPixels: 1,
          },
          objectIndex: {
            type: WebGlObjectAttributeType.FLOAT,
            size: 1,
            buffer: toSharedArrayBuffer(objectIndex),
          },
          vertecies: {
            type: WebGlObjectAttributeType.FLOAT,
            size: 3,
            buffer: toSharedArrayBuffer(verteciesBuffer),
          },
          textcoords: {
            type: WebGlObjectAttributeType.FLOAT,
            size: 2,
            buffer: toSharedArrayBuffer(texcoordBuffer),
          },
          textProperties: {
            type: WebGlObjectAttributeType.FLOAT,
            size: 4,
            buffer: toSharedArrayBuffer(textProperties),
          },
          color: {
            type: WebGlObjectAttributeType.FLOAT,
            size: 4,
            buffer: toSharedArrayBuffer(colorBuffer),
          },
          borderColor: {
            type: WebGlObjectAttributeType.FLOAT,
            size: 4,
            buffer: toSharedArrayBuffer(borderColorBuffer),
          },
          selectionColor: {
            type: WebGlObjectAttributeType.FLOAT,
            size: 4,
            buffer: toSharedArrayBuffer(selectionColorBuffer),
          },
        });
      }
      numElements = 0;
      currentObjectIndex = 0;
      propertiesTexture = createObjectPropertiesTexture();
      currentTextureSource = texture.source;

      objectIndex = [];
      verteciesBuffer = [];
      texcoordBuffer = [];
      textProperties = [];
      colorBuffer = [];
      borderColorBuffer = [];
      selectionColorBuffer = [];
    }

    let offsetX = 0;
    const selectionColorId = integerToVector4(text.id);
    const x1 = text.center[0];
    const y1 = text.center[1];
    const offsetTop = text.offset?.top || 0;
    const offsetLeft = text.offset?.left || 0;
    const textAlign = text.align || TextAlign.left;
    const totalWidth = getTextTotalWidth(text, fontAtlas);

    if (textAlign === TextAlign.center) {
      offsetX -= totalWidth / 2;
    } else if (textAlign === TextAlign.right) {
      offsetX -= totalWidth;
    }

    offsetX -= offsetLeft;

    for (const char of text.text) {
      const glyphMapping = getGlyphMapping(text, char, fontAtlas);

      if (glyphMapping.glyph.charCode === UNDEFINED_CHAR_CODE) {
        continue;
      }

      const scaleFactor = text.fontSize / glyphMapping.glyph.fontSize / glyphMapping.glyph.pixelRatio;
      const textScaledWidth = glyphMapping.glyph.width * scaleFactor;
      const textScaledHeight = glyphMapping.glyph.height * scaleFactor;
      const ascend = glyphMapping.glyph.actualBoundingBoxAscent * scaleFactor;

      // texture coordinates
      const u1 = glyphMapping.glyph.x / texture.source.width;
      const v1 = glyphMapping.glyph.y / texture.source.height;
      const u2 = (glyphMapping.glyph.x + glyphMapping.glyph.width) / texture.source.width;
      const v2 = (glyphMapping.glyph.y + glyphMapping.glyph.height) / texture.source.height;

      verteciesBuffer.push(
        x1,
        y1,
        VERTEX_QUAD_POSITION.TOP_LEFT,
        x1,
        y1,
        VERTEX_QUAD_POSITION.TOP_RIGHT,
        x1,
        y1,
        VERTEX_QUAD_POSITION.BOTTOM_LEFT,
        x1,
        y1,
        VERTEX_QUAD_POSITION.BOTTOM_LEFT,
        x1,
        y1,
        VERTEX_QUAD_POSITION.TOP_RIGHT,
        x1,
        y1,
        VERTEX_QUAD_POSITION.BOTTOM_RIGHT,
      );
      texcoordBuffer.push(u1, v1, u2, v1, u1, v2, u1, v2, u2, v1, u2, v2);

      // propertiesTexture.addValue([textScaledWidth, textScaledHeight, ascend + offsetTop, offsetX]);
      // propertiesTexture.addValue(text.color);
      // propertiesTexture.addValue(text.borderColor);
      // propertiesTexture.addValue(selectionColorId);

      addXTimes(objectIndex, currentObjectIndex, 6);
      addXTimes(textProperties, [textScaledWidth, textScaledHeight, ascend + offsetTop, offsetX], 6);
      addXTimes(colorBuffer, text.color, 6);
      addXTimes(borderColorBuffer, text.borderColor, 6);
      addXTimes(selectionColorBuffer, selectionColorId, 6);

      currentObjectIndex++;
      numElements += 6;
      offsetX += textScaledWidth;
    }
  }

  bufferedGroups.push({
    type: MapFeatureType.text,
    name,
    zIndex,
    numElements,
    texture: currentTextureSource,
    isSfdTexture: currentFontAtlas.type === FontFormatType.sdf,
    properties: {
      texture: propertiesTexture.compileTexture(),
      sizeInPixels: 1,
    },
    objectIndex: {
      type: WebGlObjectAttributeType.FLOAT,
      size: 1,
      buffer: toSharedArrayBuffer(objectIndex),
    },
    vertecies: {
      type: WebGlObjectAttributeType.FLOAT,
      size: 3,
      buffer: toSharedArrayBuffer(verteciesBuffer),
    },
    textcoords: {
      type: WebGlObjectAttributeType.FLOAT,
      size: 2,
      buffer: toSharedArrayBuffer(texcoordBuffer),
    },
    textProperties: {
      type: WebGlObjectAttributeType.FLOAT,
      size: 4,
      buffer: toSharedArrayBuffer(textProperties),
    },
    color: {
      type: WebGlObjectAttributeType.FLOAT,
      size: 4,
      buffer: toSharedArrayBuffer(colorBuffer),
    },
    borderColor: {
      type: WebGlObjectAttributeType.FLOAT,
      size: 4,
      buffer: toSharedArrayBuffer(borderColorBuffer),
    },
    selectionColor: {
      type: WebGlObjectAttributeType.FLOAT,
      size: 4,
      buffer: toSharedArrayBuffer(selectionColorBuffer),
    },
  });

  return bufferedGroups;
};

function getTextTotalWidth(text: TextMapFeature, fontAtlas: FontAtlas): number {
  let width = 0;

  for (const char of text.text) {
    const glyphMapping = getGlyphMapping(text, char, fontAtlas);
    const scaleFactor = text.fontSize / glyphMapping.glyph.fontSize / glyphMapping.glyph.pixelRatio;
    const textScaledWidth = glyphMapping.glyph.width * scaleFactor;

    if (glyphMapping.glyph.charCode === UNDEFINED_CHAR_CODE) {
      continue;
    }

    width += textScaledWidth;
  }

  return width;
}

function getGlyphMapping(text: TextMapFeature, char: string, fontAtlas: FontAtlas): GlyphMapping {
  const charCode = char.charCodeAt(0);
  const glyph = fontAtlas.glyphs[charCode] || fontAtlas.glyphs[UNDEFINED_CHAR_CODE];

  return {
    glyph,
    font: text.font,
    color: text.color,
    borderColor: text.borderColor,
    fontSize: text.fontSize,
  };
}
