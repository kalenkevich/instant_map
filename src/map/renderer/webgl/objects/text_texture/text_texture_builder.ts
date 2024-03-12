import { vec4, mat3 } from 'gl-matrix';
import { WebGlText } from '../text/text';
import { WebGlTextTextureBufferredGroup } from './text_texture';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { MapTileFeatureType } from '../../../../tile/tile';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';
import { Projection } from '../../../../geo/projection/projection';
import { MapFeatureFlags } from '../../../../flags';
import { FontManager } from '../../../../font/font_manager';
import { TextureFontAtlas, TextureFontGlyph, UNDEFINED_CHAR_CODE } from '../../../../font/font_config';

export interface GlyphMapping {
  glyph: TextureFontGlyph;
  font: string;
  fontSize: number;
  color: vec4 | [number, number, number, number];
  borderColor: vec4 | [number, number, number, number];
}

export class TextTextureGroupBuilder extends ObjectGroupBuilder<WebGlText> {
  constructor(
    protected readonly projectionViewMat: mat3,
    protected readonly canvasWidth: number,
    protected readonly canvasHeight: number,
    protected readonly pixelRatio: number,
    protected readonly zoom: number,
    protected readonly minZoom: number,
    protected readonly maxZoom: number,
    protected readonly tileSize: number,
    protected readonly projection: Projection,
    protected readonly featureFlags: MapFeatureFlags,
    private readonly fontManager: FontManager
  ) {
    super(
      projectionViewMat,
      canvasWidth,
      canvasHeight,
      pixelRatio,
      zoom,
      minZoom,
      maxZoom,
      tileSize,
      projection,
      featureFlags
    );
  }

  addObject(text: WebGlText): void {
    if (!text.text || text.text === ' ') {
      return;
    }

    this.objects.push([text, 0]);
  }

  // async build(): Promise<WebGlTextTextureBufferredGroup> {
  build(): WebGlTextTextureBufferredGroup {
    const size = this.objects.length;
    const verteciesBuffer: number[] = [];
    const texcoordBuffer: number[] = [];
    const colorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];
    const fontAtlas = this.fontManager.getFontAtlas('defaultFont') as TextureFontAtlas;
    const texture = fontAtlas.sources[0];

    for (const [text] of this.objects) {
      let offset = 0;
      for (const char of text.text) {
        const glyphMapping = this.getGlyphMapping(text, char, fontAtlas);
        const scaleFactor = text.fontSize / glyphMapping.glyph.fontSize;
        const textScaledWidth = this.scalarScale(glyphMapping.glyph.width) * scaleFactor;
        const textScaledHeight = this.scalarScale(glyphMapping.glyph.height) * scaleFactor;
        const ascend = this.scalarScale(glyphMapping.glyph.actualBoundingBoxAscent) * scaleFactor;

        // vertex coordinates
        let [x1, y1] = this.projection.fromLngLat([text.center[0], text.center[1]]);
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

        colorBuffer.push(...text.color, ...text.color, ...text.color, ...text.color, ...text.color, ...text.color);

        const selectionColorId = integerToVector4(text.id);
        selectionColorBuffer.push(
          ...selectionColorId,
          ...selectionColorId,
          ...selectionColorId,
          ...selectionColorId,
          ...selectionColorId,
          ...selectionColorId
        );
      }
    }

    return {
      type: MapTileFeatureType.text,
      size,
      numElements: size,
      textureIndex: 0,
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
      selectionColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(selectionColorBuffer),
      },
    };
  }

  getGlyphMapping(text: WebGlText, char: string, fontAtlas: TextureFontAtlas): GlyphMapping {
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
