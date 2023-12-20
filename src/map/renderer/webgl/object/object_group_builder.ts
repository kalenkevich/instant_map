import { WebGlObject, WebGlObjectBufferredGroup } from './object';
import { Projection } from '../../../geo/projection/projection';

export abstract class ObjectGroupBuilder<ObjectType extends WebGlObject> {
  protected objects: Array<[ObjectType, number]> = [];
  protected vertecies: number[] = [];

  constructor(
    protected readonly canvasWidth: number,
    protected readonly canvasHeight: number,
    protected readonly projection: Projection
  ) {}

  abstract addObject(obj: ObjectType): void;

  isEmpty(): boolean {
    return this.objects.length === 0;
  }

  abstract build(): WebGlObjectBufferredGroup;
}
