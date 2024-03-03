import { WebGlObjectBufferredGroup } from '../object/object';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { WebGlImage } from './image';

export class ImageGroupBuilder extends ObjectGroupBuilder<WebGlImage> {
  addObject(obj: WebGlImage): void {
    throw new Error('Method not implemented.');
  }

  build(): WebGlObjectBufferredGroup | Promise<WebGlObjectBufferredGroup> {
    throw new Error('Method not implemented.');
  }
}
