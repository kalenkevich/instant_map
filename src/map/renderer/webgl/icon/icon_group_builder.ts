import { WebGlIcon, WebGlIconBufferredGroup } from './icon';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { AtlasTextureMappingState } from '../../../atlas/atlas_manager';
import { MapTileFeatureType } from '../../../tile/tile';
import { Projection } from '../../../geo/projection/projection';

export class IconGroupBuilder extends ObjectGroupBuilder<WebGlIcon> {
  constructor(
    protected readonly canvasWidth: number,
    protected readonly canvasHeight: number,
    protected readonly projection: Projection,
    private readonly atlasesMappingState: AtlasTextureMappingState
  ) {
    super(canvasWidth, canvasHeight, projection);
  }

  addObject(icon: WebGlIcon): void {
    this.objects.push([icon, 0]);
  }

  build(): WebGlIconBufferredGroup {
    let textureAtlasName: string;
    const filteredIcons: WebGlIcon[] = [];
    for (const [icon] of this.objects) {
      textureAtlasName = icon.atlas;
      const textureAtlas = this.atlasesMappingState[icon.atlas];
      const iconMapping = textureAtlas.mapping[icon.name];

      if (!iconMapping) {
        continue;
      }

      filteredIcons.push(icon);
    }

    const size = filteredIcons.length;

    const verteciesBuffer = [];
    const texcoordBuffer = [];

    for (const icon of filteredIcons) {
      const textureAtlas = this.atlasesMappingState[icon.atlas];
      const iconMapping = textureAtlas.mapping[icon.name];

      const textureWidth = textureAtlas.width;
      const textureHeight = textureAtlas.height;

      const customScaleFactor = 0.0001;
      const scaledIconWidth = iconMapping.width / iconMapping.pixelRatio / this.canvasWidth;
      const scaledIconHeight = iconMapping.height / iconMapping.pixelRatio / this.canvasHeight;

      let [x1, y1] = this.projection.fromLngLat([icon.center[0], icon.center[1]]);
      x1 = x1 - (scaledIconWidth / 2) * customScaleFactor;
      y1 = y1 - (scaledIconHeight / 2) * customScaleFactor;
      const x2 = x1 + scaledIconWidth * customScaleFactor;
      const y2 = y1 + scaledIconHeight * customScaleFactor;

      const padding = 4;
      const u1 = iconMapping.x / textureWidth;
      const v1 = (iconMapping.y + 54) / textureHeight;
      const u2 = (iconMapping.x + iconMapping.width + padding) / textureWidth;
      const v2 = (iconMapping.y + 54 + iconMapping.height + padding) / textureHeight;

      // first triangle
      verteciesBuffer.push(x1, y1, x2, y1, x1, y2);
      texcoordBuffer.push(u1, v1, u2, v1, u1, v2);

      // second triangle
      verteciesBuffer.push(x1, y2, x2, y1, x2, y2);
      texcoordBuffer.push(u1, v2, u2, v1, u2, v2);
    }

    return {
      type: MapTileFeatureType.icon,
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
