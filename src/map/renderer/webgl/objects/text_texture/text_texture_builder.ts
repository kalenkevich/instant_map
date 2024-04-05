import { vec4 } from 'gl-matrix';
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

export interface GlyphMapping {
  glyph: TextureFontGlyph | SdfFontGlyph;
  font: string;
  fontSize: number;
  color: vec4 | [number, number, number, number];
  borderColor: vec4 | [number, number, number, number];
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
    const colorBuffer: number[] = [];
    const borderColorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];
    const fontAtlas = this.fontManager.getFontAtlas('defaultFont') as TextureFontAtlas | SdfFontAtlas;
    const texture = fontAtlas.sources[0];
    let numElements = 0;

    for (const text of this.objects) {
      let offset = 0;
      const selectionColorId = integerToVector4(text.id);

      for (const char of text.text) {
        const glyphMapping = this.getGlyphMapping(text, char, fontAtlas);
        const scaleFactor = text.fontSize / glyphMapping.glyph.fontSize / glyphMapping.glyph.pixelRatio;
        const textScaledWidth = this.scalarScale(glyphMapping.glyph.width, distance) * scaleFactor;
        const textScaledHeight = this.scalarScale(glyphMapping.glyph.height, distance) * scaleFactor;
        const ascend = this.scalarScale(glyphMapping.glyph.actualBoundingBoxAscent, distance) * scaleFactor;

        // vertex coordinates
        let [x1, y1] = text.center;
        x1 = offset + x1;
        y1 = y1 - ascend;
        const x2 = x1 + textScaledWidth;
        const y2 = y1 + textScaledHeight;

        offset += textScaledWidth;

        // texture coordinates
        const u1 = glyphMapping.glyph.x / texture.source.width;
        const v1 = glyphMapping.glyph.y / texture.source.height;
        const u2 = (glyphMapping.glyph.x + glyphMapping.glyph.width) / texture.source.width;
        const v2 = (glyphMapping.glyph.y + glyphMapping.glyph.height) / texture.source.height;

        // first triangle
        verteciesBuffer.push(x1, y1, x2, y1, x1, y2);
        texcoordBuffer.push(u1, v1, u2, v1, u1, v2);

        // second triangle
        verteciesBuffer.push(x1, y2, x2, y1, x2, y2);
        texcoordBuffer.push(u1, v2, u2, v1, u2, v2);

        addXTimes(colorBuffer, text.color, 6);
        addXTimes(borderColorBuffer, text.borderColor, 6);
        addXTimes(selectionColorBuffer, selectionColorId, 6);

        numElements += 6;
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
        size: 2,
        buffer: createdSharedArrayBuffer(verteciesBuffer),
      },
      textcoords: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(texcoordBuffer),
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
