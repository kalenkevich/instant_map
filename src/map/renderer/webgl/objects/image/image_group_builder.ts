import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { integerToVector4 } from '../../utils/number2vec';
import { MapTileFeatureType } from '../../../../tile/tile';
import { WebGlImage, WebGlImageBufferredGroup } from './image';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';

const TRANSPARENT_COLOR = [0, 0, 0, 0];
export class ImageGroupBuilder extends ObjectGroupBuilder<WebGlImage> {
  addObject(image: WebGlImage): void {
    this.objects.push([image, 0]);
  }

  build(): WebGlImageBufferredGroup {
    const verteciesBuffer: number[] = [];
    const texcoordBuffer: number[] = [];
    const colorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];

    const size = this.objects.length;
    let textureSource;
    let textureWidth: number;
    let textureHeight: number;

    for (const [image] of this.objects) {
      const colorId = integerToVector4(image.id);
      textureSource = image.source;
      textureWidth = image.width * image.pixelRatio;
      textureHeight = image.height * image.pixelRatio;

      const marginTop = this.scalarScale((image.margin?.top || 0) / this.pixelRatio);
      const marginLeft = this.scalarScale((image.margin?.left || 0) / this.pixelRatio);

      let [x1, y1] = this.projection.fromLngLat([image.bbox[0][0], image.bbox[0][1]]);
      let [x4, y4] = this.projection.fromLngLat([image.bbox[1][0], image.bbox[1][1]]);
      x1 = x1 + marginLeft;
      y1 = y1 + marginTop;
      x4 = x4 + marginLeft;
      y4 = y4 + marginTop;
      const x2 = x4 + marginLeft;
      const y2 = y1 + marginTop;
      const x3 = x1 + marginLeft;
      const y3 = y4 + marginTop;

      const u1 = 0;
      const v1 = 0;
      const u2 = 1;
      const v2 = 1;

      // first triangle
      verteciesBuffer.push(x1, y1, x2, y2, x3, y3);
      texcoordBuffer.push(u1, v1, u2, v1, u1, v2);

      // second triangle
      verteciesBuffer.push(x2, y2, x3, y3, x4, y4);
      texcoordBuffer.push(u1, v2, u2, v1, u2, v2);

      colorBuffer.push(
        ...TRANSPARENT_COLOR,
        ...TRANSPARENT_COLOR,
        ...TRANSPARENT_COLOR,
        ...TRANSPARENT_COLOR,
        ...TRANSPARENT_COLOR,
        ...TRANSPARENT_COLOR
      );
      selectionColorBuffer.push(...colorId, ...colorId, ...colorId, ...colorId, ...colorId, ...colorId);
    }

    return {
      type: MapTileFeatureType.image,
      size,
      numElements: verteciesBuffer.length / 2,
      texture: {
        source: textureSource,
        width: textureWidth,
        height: textureHeight,
      },
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
}
