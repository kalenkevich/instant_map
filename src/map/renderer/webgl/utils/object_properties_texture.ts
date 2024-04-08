import { Float32ArrayBufferTextureSource } from '../../../texture/texture';
import { floatArrayBufferToSharebleTextureSource } from '../../../texture/texture_utils';

export interface PropertiesTexture {}

export type ObjectPropertyValue =
  | number
  | [number, number]
  | [number, number, number]
  | [number, number, number, number];

export type ObjectProperties = Record<string, ObjectPropertyValue>;

export function createObjectPropertiesTexture(): PropertiesTexture {
  const arrayBuffer: number[] = [];

  return {
    addValue(value: ObjectPropertyValue): number {
      const ref = arrayBuffer.length;

      if (Array.isArray(value)) {
        if (value.length === 2) {
          arrayBuffer.push(...value, 0, 0);
        } else if (value.length === 3) {
          arrayBuffer.push(...value, 0);
        } else {
          arrayBuffer.push(...value);
        }
      } else {
        arrayBuffer.push(value, 0, 0, 0);
      }

      return ref;
    },
    compileTexture(): Float32ArrayBufferTextureSource {
      const width = Math.ceil(Math.sqrt(arrayBuffer.length / 4));
      const height = width;

      const zerosToAdd = width * height * 4 - arrayBuffer.length;
      for (let i = 0; i < zerosToAdd; i++) {
        arrayBuffer.push(0);
      }

      return floatArrayBufferToSharebleTextureSource(arrayBuffer, width, height);
    },
  };
}
