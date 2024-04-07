import { MapFeatureType, TextMapFeature } from '../../../../tile/feature';
import { WebGlTextTextureBufferredGroup } from './text_texture';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';
import { MapFeatureFlags } from '../../../../flags';
import { FontManager } from '../../../../font/font_manager';
import {
  FontFormatType,
  SdfFontAtlas,
  SdfFontGlyph,
  TextureFontAtlas,
  TextureFontGlyph,
  UNDEFINED_CHAR_CODE,
} from '../../../../font/font_config';
import { addXTimes } from '../../utils/array_utils';

enum VERTEX_POSITION {
  TOP_LEFT = 0,
  TOP_RIGHT = 1,
  BOTTOM_LEFT = 2,
  BOTTOM_RIGHT = 3,
}

export interface GlyphMapping {
  glyph: TextureFontGlyph | SdfFontGlyph;
  font: string;
  fontSize: number;
  color: [number, number, number, number];
  borderColor: [number, number, number, number];
}

export class TextTextureGroupBuilder extends ObjectGroupBuilder<TextMapFeature, WebGlTextTextureBufferredGroup> {
  constructor(
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly pixelRatio: number,
    private readonly fontManager: FontManager,
  ) {
    super(featureFlags, pixelRatio);
  }

  addObject(text: TextMapFeature): void {
    if (!text.text) {
      return;
    }

    this.objects.push(text);
  }

  build(distance: number, name: string, zIndex = 0): WebGlTextTextureBufferredGroup {
    const size = this.objects.length;
    const verteciesBuffer: number[] = [];
    const texcoordBuffer: number[] = [];
    const textProperties: number[] = [];
    const colorBuffer: number[] = [];
    const borderColorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];
    // TODO: support any font
    const fontAtlas = this.fontManager.getFontAtlas('defaultFont') as TextureFontAtlas | SdfFontAtlas;
    const texture = fontAtlas.sources[0];
    let numElements = 0;

    for (const text of this.objects) {
      let offset = 0;
      const selectionColorId = integerToVector4(text.id);
      // vertex coordinates
      const x1 = text.center[0];
      const y1 = text.center[1];

      for (const char of text.text) {
        const glyphMapping = this.getGlyphMapping(text, char, fontAtlas);
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
          VERTEX_POSITION.TOP_LEFT,
          x1,
          y1,
          VERTEX_POSITION.TOP_RIGHT,
          x1,
          y1,
          VERTEX_POSITION.BOTTOM_LEFT,
          x1,
          y1,
          VERTEX_POSITION.BOTTOM_LEFT,
          x1,
          y1,
          VERTEX_POSITION.TOP_RIGHT,
          x1,
          y1,
          VERTEX_POSITION.BOTTOM_RIGHT,
        );
        texcoordBuffer.push(u1, v1, u2, v1, u1, v2, u1, v2, u2, v1, u2, v2);

        addXTimes(textProperties, [textScaledWidth, textScaledHeight, ascend, offset], 6);
        addXTimes(colorBuffer, text.color, 6);
        addXTimes(borderColorBuffer, text.borderColor, 6);
        addXTimes(selectionColorBuffer, selectionColorId, 6);

        numElements += 6;
        offset += textScaledWidth;
      }
    }

    return {
      type: MapFeatureType.text,
      name,
      zIndex,
      size,
      numElements,
      textureIndex: 0,
      sfdTexture: fontAtlas.type === FontFormatType.sdf,
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 3,
        buffer: createdSharedArrayBuffer(verteciesBuffer),
      },
      textcoords: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(texcoordBuffer),
      },
      textProperties: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(textProperties),
      },
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(colorBuffer),
      },
      borderColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(borderColorBuffer),
      },
      selectionColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(selectionColorBuffer),
      },
    };
  }

  getGlyphMapping(text: TextMapFeature, char: string, fontAtlas: TextureFontAtlas | SdfFontAtlas): GlyphMapping {
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
}
