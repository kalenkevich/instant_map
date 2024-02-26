import { vec2, mat3, vec3 } from 'gl-matrix';
import { WebGlObject, WebGlObjectBufferredGroup } from './object';
import { Projection } from '../../../geo/projection/projection';
import { MapFeatureFlags } from '../../../flags';

export abstract class ObjectGroupBuilder<ObjectType extends WebGlObject> {
  protected objects: Array<[ObjectType, number]> = [];
  protected vertecies: number[] = [];

  constructor(
    protected readonly projectionViewMat: mat3,
    protected readonly canvasWidth: number,
    protected readonly canvasHeight: number,
    protected readonly pixelRatio: number,
    protected readonly zoom: number,
    protected readonly tileSize: number,
    protected readonly projection: Projection,
    protected readonly featureFlags: MapFeatureFlags
  ) {}

  abstract addObject(obj: ObjectType): void;

  isEmpty(): boolean {
    return this.objects.length === 0;
  }

  /** Scales value for webgl canvas value according to the current zoom and tileSize */
  scalarScale(val: number): number {
    return val / (Math.pow(2, this.zoom) * this.tileSize);
  }

  applyProjectionViewMatrix(point: [number, number] | vec2): [number, number] {
    const result = vec3.create();

    vec3.transformMat3(result, vec3.fromValues(point[0], point[1], 1), this.projectionViewMat);

    return [result[0], result[1]];
  }

  clipSpace(position: [number, number] | vec2): [number, number] {
    return [-1.0 + position[0] * 2.0, +1.0 - position[1] * 2.0];
  }

  abstract build(): Promise<WebGlObjectBufferredGroup> | WebGlObjectBufferredGroup;

  clear(): void {
    this.objects = [];
  }
}
