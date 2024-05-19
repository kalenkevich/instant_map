import { ArrayBufferTextureSource } from '../../../texture/texture';
import { toFloat32TextureSource } from '../../../texture/texture_utils';

export interface PropertiesTexture {
  addValue(value: ObjectPropertyValue): number;
  compileTexture(): ArrayBufferTextureSource;
}

export type ObjectPropertyValue =
  | number
  | [number, number]
  | [number, number, number]
  | [number, number, number, number];

export type ObjectProperties = Record<string, ObjectPropertyValue>;

const MAX_TEXTURE_WIDTH = 2048;

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
    compileTexture(): ArrayBufferTextureSource {
      let width = arrayBuffer.length / 4;
      let height = 1;

      if (width > MAX_TEXTURE_WIDTH) {
        height = width = Math.ceil(Math.sqrt(width));
      }

      const zerosToAdd = width * height * 4 - arrayBuffer.length;
      for (let i = 0; i < zerosToAdd; i++) {
        arrayBuffer.push(0);
      }

      return toFloat32TextureSource(arrayBuffer, width, height, { sharedMemory: true, flipY: true });
    },
  };
}
