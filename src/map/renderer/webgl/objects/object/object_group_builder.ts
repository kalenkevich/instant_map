import { MapFeature } from '../../../../tile/feature';
import { WebGlObjectBufferredGroup } from './object';
import { MapFeatureFlags } from '../../../../flags';

export abstract class ObjectGroupBuilder<
  InputObjectType extends MapFeature,
  OutputObjectType extends WebGlObjectBufferredGroup,
> {
  protected objects: Array<InputObjectType> = [];

  constructor(
    protected readonly featureFlags: MapFeatureFlags,
    protected readonly pixelRatio: number,
  ) {}

  addObject(obj: InputObjectType): void {
    this.objects.push(obj);
  }

  isEmpty(): boolean {
    return this.objects.length === 0;
  }

  /**
   * Scales value for webgl canvas value according to the current zoom and tileSize.
   * */
  scalarScale(val: number, distance: number): number {
    return val / distance;
  }

  abstract build(distance: number, name: string, zIndex: number): OutputObjectType | Promise<OutputObjectType>;

  clear(): void {
    this.objects = [];
  }
}
