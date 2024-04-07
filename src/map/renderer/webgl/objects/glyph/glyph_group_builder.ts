import { GlyphMapFeature, MapFeatureType } from '../../../../tile/feature';
import { WebGlGlyphBufferredGroup } from './glyph';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder, VERTEX_QUAD_POSITION } from '../object/object_group_builder';
import { GlyphsManager } from '../../../../glyphs/glyphs_manager';
import { MapFeatureFlags } from '../../../../flags';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';
import { addXTimes } from '../../utils/array_utils';

const TRANSPARENT_COLOR = [0, 0, 0, 0];

export class GlyphGroupBuilder extends ObjectGroupBuilder<GlyphMapFeature, WebGlGlyphBufferredGroup> {
  constructor(
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly pixelRatio: number,
    private readonly glyphsManager: GlyphsManager,
  ) {
    super(featureFlags, pixelRatio);
  }

  build(name: string, zIndex = 0): WebGlGlyphBufferredGroup {
    let textureAtlasName: string;
    const filteredGlyphs: GlyphMapFeature[] = [];
    const glyphTextureMapping = this.glyphsManager.getMappingState();

    for (const glyph of this.objects) {
      textureAtlasName = glyph.atlas;
      const textureAtlas = glyphTextureMapping[glyph.atlas];
      const glyphMapping = textureAtlas.mapping[glyph.name];

      if (!glyphMapping) {
        continue;
      }

      filteredGlyphs.push(glyph);
    }

    const size = filteredGlyphs.length;

    const verteciesBuffer: number[] = [];
    const texcoordBuffer: number[] = [];
    const colorBuffer: number[] = [];
    const glyphProperties: number[] = [];
    const selectionColorBuffer: number[] = [];

    for (const glyph of filteredGlyphs) {
      const colorId = integerToVector4(glyph.id);
      const textureAtlas = glyphTextureMapping[glyph.atlas];
      const glyphMapping = textureAtlas.mapping[glyph.name];
      const offsetTop = glyph.offset?.top || 0;
      const offsetLeft = glyph.offset?.left || 0;
      const textureWidth = textureAtlas.width;
      const textureHeight = textureAtlas.height;
      const glyphScaledWidth = glyphMapping.width / glyphMapping.pixelRatio;
      const glyphScaledHeight = glyphMapping.height / glyphMapping.pixelRatio;

      const [x1, y1] = [glyph.center[0], glyph.center[1]];

      const u1 = glyphMapping.x / textureWidth;
      const v1 = glyphMapping.y / textureHeight;
      const u2 = (glyphMapping.x + glyphMapping.width) / textureWidth;
      const v2 = (glyphMapping.y + glyphMapping.height) / textureHeight;

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

      addXTimes(glyphProperties, [glyphScaledWidth, glyphScaledHeight, offsetTop, offsetLeft], 6);
      addXTimes(colorBuffer, TRANSPARENT_COLOR, 6);
      addXTimes(selectionColorBuffer, colorId, 6);
    }

    return {
      type: MapFeatureType.glyph,
      name,
      zIndex,
      size,
      numElements: verteciesBuffer.length / 3,
      atlas: textureAtlasName,
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
      properties: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(glyphProperties),
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
}
