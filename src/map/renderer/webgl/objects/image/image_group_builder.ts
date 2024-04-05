import { MapFeatureType, ImageMapFeature } from '../../../../tile/feature';
import { WebGlImageBufferredGroup } from './image';
import { WebGlObjectAttributeType } from '../object/object';
import { SceneCamera } from '../../../renderer';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { integerToVector4 } from '../../utils/number2vec';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { addXTimes } from '../../utils/array_utils';

const TRANSPARENT_COLOR = [0, 0, 0, 0];
export class ImageGroupBuilder extends ObjectGroupBuilder<ImageMapFeature, WebGlImageBufferredGroup> {
  build(camera: SceneCamera, name: string, zIndex = 0): WebGlImageBufferredGroup {
    const verteciesBuffer: number[] = [];
    const texcoordBuffer: number[] = [];
    const colorBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];

    const size = this.objects.length;
    let textureSource;

    for (const image of this.objects) {
      const colorId = integerToVector4(image.id);
      textureSource = image.source;

      const marginTop = this.scalarScale((image.margin?.top || 0) / this.pixelRatio, camera.distance);
      const marginLeft = this.scalarScale((image.margin?.left || 0) / this.pixelRatio, camera.distance);

      let [x1, y1] = [image.bbox[0][0], image.bbox[0][1]];
      let [x4, y4] = [image.bbox[1][0], image.bbox[1][1]];
      x1 = x1 + marginLeft;
      y1 = y1 + marginTop;
      x4 = x4 + marginLeft;
      y4 = y4 + marginTop;
      const p1 = [x1, y1];
      const p2 = [x4, y1];
      const p3 = [x1, y4];
      const p4 = [x4, y4];

      // flip it by y basis
      verteciesBuffer.push(...p3, ...p4, ...p1, ...p1, ...p4, ...p2);
      texcoordBuffer.push(0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0);

      addXTimes(colorBuffer, TRANSPARENT_COLOR, 6);
      addXTimes(selectionColorBuffer, colorId, 6);
    }

    return {
      type: MapFeatureType.image,
      name,
      zIndex,
      size,
      numElements: verteciesBuffer.length / 2,
      texture: textureSource,
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
