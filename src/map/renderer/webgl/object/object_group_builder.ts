import { WebGlObject, WebGlObjectBufferredGroup } from './object';

export abstract class ObjectGroupBuilder<ObjectType extends WebGlObject> {
  protected objects: Array<[ObjectType, number]> = [];
  protected vertecies: number[] = [];

  abstract addObject(obj: ObjectType): void;

  isEmpty(): boolean {
    return this.objects.length === 0;
  }

  abstract build(): WebGlObjectBufferredGroup;
}
