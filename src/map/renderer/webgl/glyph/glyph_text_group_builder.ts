import { WebGlGlyphBufferredGroup } from './glyph';
import { WebGlText } from '../text/text';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { Projection } from '../../../geo/projection/projection';
import { AtlasTextrureMapping } from '../../../atlas/atlas_config';
import { AtlasTextureMappingState } from '../../../atlas/atlas_manager';
import { MapTileFeatureType } from '../../../tile/tile';

const customScaleFactor = 0.0001;

export class GlyphTextGroupBuilder extends ObjectGroupBuilder<WebGlText> {
  constructor(
    protected readonly canvasWidth: number,
    protected readonly canvasHeight: number,
    protected readonly projection: Projection,
    private readonly atlasesMappingState: AtlasTextureMappingState
  ) {
    super(canvasWidth, canvasHeight, projection);
  }

  addObject(text: WebGlText): void {
    this.objects.push([text, 0]);
  }

  build(): WebGlGlyphBufferredGroup {
    let textureAtlasName: string;
    const glyphsMappings: Array<[WebGlText, AtlasTextrureMapping[]]> = [];

    let size = 0;
    for (const [text] of this.objects) {
      textureAtlasName = text.font;
      const textureAtlas = this.atlasesMappingState[text.font];

      const labelAsAGlyphs: AtlasTextrureMapping[] = [];
      for (const c of text.text) {
        const glyphMapping = textureAtlas.mapping[c] || textureAtlas.mapping[' '];

        labelAsAGlyphs.push(glyphMapping);
        size++;
      }

      glyphsMappings.push([text, labelAsAGlyphs]);
    }

    const verteciesBuffer = [];
    const texcoordBuffer = [];

    for (const [text, labelAsAGlyphs] of glyphsMappings) {
      const textureAtlas = this.atlasesMappingState[text.font];
      let [x1, y1] = this.projection.fromLngLat([text.center[0], text.center[1]]);
      let labelWidth = 0;
      let pixelRatio = 1;
      for (const charGlyph of labelAsAGlyphs) {
        pixelRatio = charGlyph.pixelRatio;
        labelWidth += charGlyph.width;
      }

      const labelScaledWidth = labelWidth / pixelRatio / this.canvasWidth;
      x1 = x1 - (labelScaledWidth / 2) * customScaleFactor * text.fontSize;
      y1 = y1 - (labelScaledWidth / 2) * customScaleFactor * text.fontSize;

      for (const glyphMapping of labelAsAGlyphs) {
        const textureWidth = textureAtlas.width;
        const textureHeight = textureAtlas.height;

        const glyphScaledWidth = glyphMapping.width / glyphMapping.pixelRatio / this.canvasWidth;

        const x2 = x1 + glyphScaledWidth * customScaleFactor * text.fontSize;
        const y2 = y1 + glyphScaledWidth * customScaleFactor * text.fontSize;

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

        x1 = x1 + glyphScaledWidth * customScaleFactor * text.fontSize * 0.65;
      }
    }

    return {
      type: MapTileFeatureType.glyph,
      size,
      numElements: verteciesBuffer.length / 2,
      atlas: textureAtlasName,
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: new Float32Array(verteciesBuffer),
      },
      textcoords: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: new Float32Array(texcoordBuffer),
      },
    };
  }
}
