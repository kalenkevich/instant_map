import { Point } from './point';

export type PointLike = Point | [number, number] | [number, number, number] | { x: number; y: number; z?: number };

export function toPoint(pointLike: PointLike): Point {
  if (Array.isArray(pointLike)) {
    return new Point(pointLike[0], pointLike[1], pointLike[2]);
  }

  return new Point(pointLike.x, pointLike.y, pointLike.z);
}
