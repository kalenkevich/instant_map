import { vec2, vec3 } from 'gl-matrix';
import { MapFeature } from '../../../../tile/feature';
import { WebGlObjectBufferredGroup } from './object';
import { MapFeatureFlags } from '../../../../flags';
import { SceneCamera } from '../../../renderer';

export abstract class ObjectGroupBuilder<InputObjectType extends MapFeature, OutputObjectType extends WebGlObjectBufferredGroup> {
  protected objects: Array<InputObjectType> = [];

  constructor(protected readonly featureFlags: MapFeatureFlags, protected readonly pixelRatio: number) {}

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
    // return this.tileSize * Math.pow(2, zoom);
    return val / distance;
  }

  applyProjectionViewMatrix(camera: SceneCamera, point: [number, number] | vec2): [number, number] {
    const result = vec3.create();

    vec3.transformMat3(result, vec3.fromValues(point[0], point[1], 1), camera.viewMatrix);

    return [result[0], result[1]];
  }

  clipSpace(position: [number, number] | vec2): [number, number] {
    return [-1.0 + position[0] * 2.0, +1.0 - position[1] * 2.0];
  }

  abstract build(
    camera: SceneCamera,
    name: string,
    zIndex: number
  ): OutputObjectType | Promise<OutputObjectType>;

  clear(): void {
    this.objects = [];
  }
}
