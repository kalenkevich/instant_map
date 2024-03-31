import { WebGlObjectAttributeType } from '../object/object';
import { SceneCamera } from '../../../renderer';
import { ObjectGroupBuilder } from '../object/object_group_builder';
import { LineJoinStyle, WebGlLine } from '../line/line';
import { WebGlShaderLineBufferredGroup } from './line';
import { MapTileFeatureType } from '../../../../tile/tile';
import { createdSharedArrayBuffer } from '../../utils/array_buffer';
import { integerToVector4 } from '../../utils/number2vec';
import { addXTimes } from '../../utils/array_utils';

export class LineShaiderBuilder extends ObjectGroupBuilder<WebGlLine> {
  build(camera: SceneCamera, name: string, zIndex = 0): WebGlShaderLineBufferredGroup {
    const vertecies: number[] = [];
    const prevPoint: number[] = [];
    const currPoint: number[] = [];
    const nextPoint: number[] = [];
    // angle, width, borderWidth,
    const lineProps: number[] = [];
    // fill, cap, join
    const renderStyles: number[] = [];
    const color: number[] = [];
    const borderColor: number[] = [];
    const selectionColor: number[] = [];

    for (const line of this.objects) {
      const halfWidth =
        (this.scalarScale(line.borderWidth, camera.distance) + this.scalarScale(line.width, camera.distance)) / 2;
      const idAsVector4 = integerToVector4(line.id);

      for (let i = 1; i < line.vertecies.length; i++) {
        const aPoint = line.vertecies[i - 1]; // should be projected
        const bPoint = line.vertecies[i]; // should be projected
        // const cPoint = this.projection.fromLngLat(line.vertecies[i + 1]); // should be projected

        const a = aPoint[1] - bPoint[1];
        const b = bPoint[0] - aPoint[0];
        const angleDegree = Math.PI / 2;
        // 1 / Math.tan(-a / b)

        const x1 = aPoint[0] - halfWidth * Math.cos(angleDegree) + 1 - 1;
        const y1 = aPoint[1] + halfWidth * Math.sin(angleDegree) + 1 - 1;

        const x2 = bPoint[0] + halfWidth * Math.cos(angleDegree) + 1 - 1;
        const y2 = bPoint[1] + halfWidth * Math.sin(angleDegree) + 1 - 1;

        const x3 = aPoint[0] - halfWidth * Math.cos(angleDegree) + 1 - 1;
        const y3 = aPoint[1] - halfWidth * Math.sin(angleDegree) + 1 - 1;

        const x4 = bPoint[0] + halfWidth * Math.cos(angleDegree) + 1 - 1;
        const y4 = bPoint[1] - halfWidth * Math.sin(angleDegree) + 1 - 1;

        vertecies.push(
          // first triangle
          x1,
          y1,
          x2,
          y2,
          x3,
          y3,
          // second triangle
          x3,
          y3,
          x2,
          y2,
          x4,
          y4
        );

        addXTimes(prevPoint, [aPoint[0], aPoint[1]], 6);
        addXTimes(currPoint, [bPoint[0], bPoint[1]], 6);
        // addXTimes(nextPoint, [cPoint[0], cPoint[1]], 6);
        addXTimes(lineProps, [angleDegree, line.width, line.borderWidth], 6);
        addXTimes(renderStyles, [line.fill, line.cap, line.join], 6);
        addXTimes(color, [line.color[0], line.color[1], line.color[2], line.color[3]], 6);
        addXTimes(borderColor, [line.borderColor[0], line.borderColor[1], line.borderColor[2], line.borderColor[3]], 6);
        addXTimes(selectionColor, idAsVector4, 6);
      }
    }

    return {
      type: MapTileFeatureType.line,
      name,
      zIndex,
      size: this.objects.length,
      numElements: vertecies.length / 2,
      vertecies: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(vertecies),
      },
      prevPoint: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(prevPoint),
      },
      currPoint: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 2,
        buffer: createdSharedArrayBuffer(currPoint),
      },
      // nextPoint: {
      //   type: WebGlObjectAttributeType.FLOAT,
      //   size: 2,
      //   buffer: createdSharedArrayBuffer(nextPoint),
      // },
      lineProps: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 3,
        buffer: createdSharedArrayBuffer(lineProps),
      },
      renderStyles: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 3,
        buffer: createdSharedArrayBuffer(renderStyles),
      },
      color: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(color),
      },
      borderColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(borderColor),
      },
      selectionColor: {
        type: WebGlObjectAttributeType.FLOAT,
        size: 4,
        buffer: createdSharedArrayBuffer(selectionColor),
      },
    };
  }

  getDistanceBetweenPoints(p1: [number, number], p2: [number, number]): number {
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2.0) + Math.pow(p2[1] - p1[1], 2.0));
  }

  getPointAlignmentToLine(lineEquation: [number, number], point: [number, number]): number {
    const k = lineEquation[0];
    const b = lineEquation[1];
    // creating line start (a) and end (b) points based on k and b.
    const lA = [-1.0, -k + b];
    const lB = [1.0, k + b];

    return (lB[0] - lA[0]) * (point[1] - lA[1]) - (lB[1] - lA[1]) * (point[0] - lA[0]);
  }

  // returns k and b -> y = kx + b;
  getLineEquation(p1: [number, number], p2: [number, number]): [number, number] {
    const k = (p1[1] - p2[1]) / (p1[0] - p2[0]);
    const b = p1[1] - k * p1[1];

    return [k, b];
  }

  getPerpendicularLineEquation(lineEquation: [number, number], point: [number, number]): [number, number] {
    const k1 = lineEquation[0];
    const k2 = -1.0 / k1;
    const b2 = point[1] - k2 * point[0];

    return [k2, b2];
  }

  getDistanceFromLine(lineEquation: [number, number], point: [number, number]): number {
    const perpendicular = this.getPerpendicularLineEquation(lineEquation, point);
    const k1 = lineEquation[0];
    const b1 = lineEquation[1];
    const k2 = perpendicular[0];
    const b2 = perpendicular[1];

    // intersection point
    const x = (b2 - b1) / (k1 - k2);
    const y = k2 * x + b2;

    return this.getDistanceBetweenPoints(point, [x, y]);
  }

  getPointFromPerpendicular(
    lineEquation: [number, number],
    linePoint: [number, number],
    distance: number
  ): [number, number] {
    const angle = Math.PI / 2;
    return [linePoint[0] + distance * Math.cos(angle), linePoint[1] + distance * Math.sin(angle)];
  }
}
