import { MapFeatureType, ImageMapFeature } from '../../../../tile/feature';
import { WebGlImageBufferredGroup } from './image';
import { WebGlObjectAttributeType } from '../object/object';
import { ObjectGroupBuilder, VERTEX_QUAD_POSITION } from '../object/object_group_builder';
import { integerToVector4 } from '../../utils/number2vec';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { addXTimes } from '../../utils/array_utils';

export class ImageGroupBuilder extends ObjectGroupBuilder<ImageMapFeature, WebGlImageBufferredGroup> {
  build(name: string, zIndex = 0): WebGlImageBufferredGroup[] {
    const verteciesBuffer: number[] = [];
    const texcoordBuffer: number[] = [];
    const propertiesBuffer: number[] = [];
    const selectionColorBuffer: number[] = [];
    let textureSource;

    for (const image of this.objects) {
      const colorId = integerToVector4(image.id);
      const offsetTop = image.offset?.top || 0;
      const offsetLeft = image.offset?.left || 0;
      textureSource = image.source;

      const [x1, y1] = [image.bbox[0][0], image.bbox[0][1]];
      const [x4, y4] = [image.bbox[1][0], image.bbox[1][1]];
      const p1 = [x1, y1];
      const p2 = [x4, y1];
      const p3 = [x1, y4];
      const p4 = [x4, y4];

      // flip it by y basis
      verteciesBuffer.push(
        ...p3,
        VERTEX_QUAD_POSITION.BOTTOM_LEFT,
        ...p4,
        VERTEX_QUAD_POSITION.BOTTOM_RIGHT,
        ...p1,
        VERTEX_QUAD_POSITION.TOP_LEFT,
        ...p1,
        VERTEX_QUAD_POSITION.TOP_LEFT,
        ...p4,
        VERTEX_QUAD_POSITION.BOTTOM_RIGHT,
        ...p2,
        VERTEX_QUAD_POSITION.TOP_RIGHT,
      );
      texcoordBuffer.push(0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0);

      addXTimes(propertiesBuffer, [image.width, image.height, offsetTop, offsetLeft], 6);
      addXTimes(selectionColorBuffer, colorId, 6);
    }

    return [
      {
        type: MapFeatureType.image,
        name,
        zIndex,
        numElements: verteciesBuffer.length / 3,
        texture: textureSource,
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
          buffer: createdSharedArrayBuffer(propertiesBuffer),
        },
        selectionColor: {
          type: WebGlObjectAttributeType.FLOAT,
          size: 4,
          buffer: createdSharedArrayBuffer(selectionColorBuffer),
        },
      },
    ];
  }
}
