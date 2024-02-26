import { mat3 } from 'gl-matrix';
import { WebGlGlyph, WebGlGlyphBufferredGroup } from './glyph';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { AtlasTextureMappingState } from '../../../atlas/atlas_manager';
import { MapTileFeatureType } from '../../../tile/tile';
import { Projection } from '../../../geo/projection/projection';
import { MapFeatureFlags } from '../../../flags';
import { createdSharedArrayBuffer } from '../utils/array_buffer';

export class GlyphGroupBuilder extends ObjectGroupBuilder<WebGlGlyph> {
  constructor(
    protected readonly projectionViewMat: mat3,
    protected readonly canvasWidth: number,
    protected readonly canvasHeight: number,
    protected readonly pixelRatio: number,
    protected readonly zoom: number,
    protected readonly tileSize: number,
    protected readonly projection: Projection,
    protected readonly featureFlags: MapFeatureFlags,
    private readonly atlasesMappingState: AtlasTextureMappingState
  ) {
    super(projectionViewMat, canvasWidth, canvasHeight, pixelRatio, zoom, tileSize, projection, featureFlags);
  }

  addObject(glyph: WebGlGlyph): void {
    this.objects.push([glyph, 0]);
  }

  build(): WebGlGlyphBufferredGroup {
    let textureAtlasName: string;
    const filteredGlyphs: WebGlGlyph[] = [];
    for (const [glyph] of this.objects) {
      textureAtlasName = glyph.atlas;
      const textureAtlas = this.atlasesMappingState[glyph.atlas];
      const glyphMapping = textureAtlas.mapping[glyph.name];

      if (!glyphMapping) {
        continue;
      }

      filteredGlyphs.push(glyph);
    }

    const size = filteredGlyphs.length;

    const verteciesBuffer = [];
    const texcoordBuffer = [];

    for (const glyph of filteredGlyphs) {
      const textureAtlas = this.atlasesMappingState[glyph.atlas];
      const glyphMapping = textureAtlas.mapping[glyph.name];

      const textureWidth = textureAtlas.width;
      const textureHeight = textureAtlas.height;
      const glyphScaledWidth = this.scalarScale(glyphMapping.width / glyphMapping.pixelRatio);
      const glyphScaledHeight = this.scalarScale(glyphMapping.height / glyphMapping.pixelRatio);
      const marginTop = this.scalarScale((glyph.margin?.top || 0) / this.pixelRatio);
      const marginLeft = this.scalarScale((glyph.margin?.left || 0) / this.pixelRatio);

      let [x1, y1] = this.projection.fromLngLat([glyph.center[0], glyph.center[1]]);
      x1 = x1 - glyphScaledWidth / 2 + marginTop;
      y1 = y1 - glyphScaledHeight / 2 + marginLeft;
      const x2 = x1 + glyphScaledWidth;
      const y2 = y1 + glyphScaledHeight;

      const u1 = glyphMapping.x / textureWidth;
      const v1 = glyphMapping.y / textureHeight;
      const u2 = (glyphMapping.x + glyphMapping.width) / textureWidth;
      const v2 = (glyphMapping.y + glyphMapping.height) / textureHeight;

      // first triangle
      verteciesBuffer.push(x1, y1, x2, y1, x1, y2);
      texcoordBuffer.push(u1, v1, u2, v1, u1, v2);

      // second triangle
      verteciesBuffer.push(x1, y2, x2, y1, x2, y2);
      texcoordBuffer.push(u1, v2, u2, v1, u2, v2);
    }

    return {
      type: MapTileFeatureType.glyph,
      size,
      numElements: verteciesBuffer.length / 2,
      atlas: textureAtlasName,
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
    };
  }
}
