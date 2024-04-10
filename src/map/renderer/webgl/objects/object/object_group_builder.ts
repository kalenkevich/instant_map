import { MapFeature } from '../../../../tile/feature';
import { WebGlObjectBufferredGroup } from './object';
import { MapFeatureFlags } from '../../../../flags';

export enum VERTEX_QUAD_POSITION {
  TOP_LEFT = 0,
  TOP_RIGHT = 1,
  BOTTOM_LEFT = 2,
  BOTTOM_RIGHT = 3,
}

export abstract class ObjectGroupBuilder<
  InputObjectType extends MapFeature,
  OutputObjectType extends WebGlObjectBufferredGroup,
> {
  protected objects: Array<InputObjectType> = [];

  constructor(protected readonly featureFlags: MapFeatureFlags) {}

  addObject(obj: InputObjectType): void {
    this.objects.push(obj);
  }

  isEmpty(): boolean {
    return this.objects.length === 0;
  }

  abstract build(name: string, zIndex: number): OutputObjectType | Promise<OutputObjectType>;

  clear(): void {
    this.objects = [];
  }
}
