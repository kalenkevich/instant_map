import { GlyphMapFeature, MapFeatureType } from '../../../../tile/feature';
import { WebGlGlyphBufferredGroup } from './glyph';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder, ObjectGroupBuilderOptions, VERTEX_QUAD_POSITION } from '../object/object_group_builder';
import { toSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';
import { addXTimes } from '../../utils/array_utils';

const TRANSPARENT_COLOR = [0, 0, 0, 0];

export const getGlyphFeatureGroups: ObjectGroupBuilder<GlyphMapFeature, WebGlGlyphBufferredGroup> = (
  objects: GlyphMapFeature[],
  name: string,
  zIndex = 0,
  options: ObjectGroupBuilderOptions,
) => {
  const bufferedGroup: WebGlGlyphBufferredGroup[] = [];
  const filteredGlyphs: GlyphMapFeature[] = [];
  const glyphTextureMapping = options.glyphsManager.getMappingState();
  for (const glyph of objects) {
    const textureAtlas = glyphTextureMapping[glyph.atlas];
    const glyphMapping = textureAtlas.mapping[glyph.name];

    if (!glyphMapping) {
      continue;
    }

    filteredGlyphs.push(glyph);
  }

  if (!filteredGlyphs.length) {
    return [];
  }

  let verteciesBuffer: number[] = [];
  let texcoordBuffer: number[] = [];
  let colorBuffer: number[] = [];
  let glyphProperties: number[] = [];
  let selectionColorBuffer: number[] = [];
  let currentAtlas: string | undefined;

  for (const glyph of filteredGlyphs) {
    if (currentAtlas !== glyph.atlas) {
      if (currentAtlas) {
        bufferedGroup.push({
          type: MapFeatureType.glyph,
          name,
          zIndex,
          numElements: verteciesBuffer.length / 3,
          atlas: currentAtlas,
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
          properties: {
            type: WebGlObjectAttributeType.FLOAT,
            size: 4,
            buffer: toSharedArrayBuffer(glyphProperties),
          },
          color: {
            type: WebGlObjectAttributeType.FLOAT,
            size: 4,
            buffer: toSharedArrayBuffer(colorBuffer),
          },
          selectionColor: {
            type: WebGlObjectAttributeType.FLOAT,
            size: 4,
            buffer: toSharedArrayBuffer(selectionColorBuffer),
          },
        });
      }
      currentAtlas = glyph.atlas;

      verteciesBuffer = [];
      texcoordBuffer = [];
      colorBuffer = [];
      glyphProperties = [];
      selectionColorBuffer = [];
    }

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

  bufferedGroup.push({
    type: MapFeatureType.glyph,
    name,
    zIndex,
    numElements: verteciesBuffer.length / 3,
    atlas: currentAtlas,
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
    properties: {
      type: WebGlObjectAttributeType.FLOAT,
      size: 4,
      buffer: toSharedArrayBuffer(glyphProperties),
    },
    color: {
      type: WebGlObjectAttributeType.FLOAT,
      size: 4,
      buffer: toSharedArrayBuffer(colorBuffer),
    },
    selectionColor: {
      type: WebGlObjectAttributeType.FLOAT,
      size: 4,
      buffer: toSharedArrayBuffer(selectionColorBuffer),
    },
  });

  return bufferedGroup;
};
