import { FEATURE_FLAGS_UTILS, CLIP_UTILS, MAT_UTILS } from '../object/object_shaders';

export default {
  vertext: `
    precision highp float;
    ${CLIP_UTILS}
    ${MAT_UTILS}
    ${FEATURE_FLAGS_UTILS}

    uniform mat3 u_matrix;
    uniform float u_width;
    uniform float u_height;
    uniform float u_tile_size;
    uniform float u_renderType;

    attribute vec2 a_vertecies;
    attribute vec2 a_prevPoint;
    attribute vec2 a_currPoint;
    // attribute vec2 a_nextPoint;
    attribute vec3 a_lineProps;
    attribute vec3 a_renderStyles;
    attribute vec4 a_color;
    attribute vec4 a_borderColor;
    attribute vec2 a_lineStripVertecies;
    attribute vec2 a_pointVertecies;

    // varying vec2 v_vertecies;
    varying vec2 v_prevPoint;
    varying vec2 v_currPoint;
    // varying vec2 v_nextPoint;
    varying vec3 v_lineProps;
    varying vec3 v_renderStyles;
    varying vec4 v_color;
    varying vec4 v_borderColor;
    varying vec2 v_point;

    void main() {
      v_prevPoint = applyMatrix(u_matrix, clipSpace(a_prevPoint));
      v_currPoint = applyMatrix(u_matrix, clipSpace(a_currPoint));
      // v_nextPoint = applyMatrix(u_matrix, clipSpace(clipSpace(a_nextPoint);
      v_lineProps = a_lineProps;
      v_renderStyles = a_renderStyles;
      v_color = a_color;
      v_borderColor = a_borderColor;

      gl_Position = vec4(applyMatrix(u_matrix, clipSpace(a_vertecies.xy)), 0, 1);
      v_point = gl_Position.xy / gl_Position.w;
    }
  `,
  fragment: `
    precision highp float;

    uniform mat3 u_matrix;
    uniform float u_width;
    uniform float u_height;
    uniform float u_tile_size;
    uniform float u_renderType;

    // varying vec2 v_vertecies;
    varying vec2 v_prevPoint;
    varying vec2 v_currPoint;
    // varying vec2 v_nextPoint;
    varying vec3 v_lineProps; // [angleDegree, line.width, line.borderWidth]
    varying vec3 v_renderStyles; // [line.fill, line.cap, line.join]
    varying vec4 v_color;
    varying vec4 v_borderColor;
    varying vec2 v_point;

    float getDistanceBetweenPoints(vec2 p1, vec2 p2) {
      return sqrt(pow(p2.x - p1.x, 2.0) + pow(p2.y - p1.y, 2.0));
    }

    float getPointAlignmentToLine(vec2 lineEquation, vec2 point) {
      float k = lineEquation.x;
      float b = lineEquation.y;
      // creating line start (a) and end (b) points based on k and b.
      vec2 lA = vec2(-1.0, -k + b);
      vec2 lB = vec2(1.0, k + b);

      return (lB.x - lA.x) * (point.y - lA.y) - (lB.y - lA.y) * (point.x - lA.x);
    }

    // returns k and b -> y = kx + b;
    vec2 getLineEquation(vec2 p1, vec2 p2) {
      float k = (p1.y - p2.y) / (p1.x - p2.x);
      float b = p1.y - k * p1.x;
    
      return vec2(k, b);
    }

    vec2 getPerpendicularLineEquation(vec2 lineEquation, vec2 point) {
      float k1 = lineEquation.x;
      float k2 = -1.0 / k1;
      float b2 = point.y - k2 * point.x;

      return vec2(k2, b2);
    }

    float getDistanceFromLine(vec2 lineEquation, vec2 point) {
      vec2 perpendicular = getPerpendicularLineEquation(lineEquation, point);
      float k1 = lineEquation.x;
      float b1 = lineEquation.y;
      float k2 = perpendicular.x;
      float b2 = perpendicular.y;

      // intersection point
      float x = (b2 - b1) / (k1 - k2);
      float y = k2 * x + b2;

      return getDistanceBetweenPoints(point, vec2(x, y));
    }

    void main() {
      vec2 point = gl_FragCoord.xy / vec2(u_width, u_height);
      float lineWidth = v_lineProps.y;
      float borderWidth = v_lineProps.z;
      vec2 lineEquation = getLineEquation(v_prevPoint, v_currPoint);

      // vec2 perpendicularLeftLineEquation = getPerpendicularLineEquation(lineEquation, v_prevPoint);
      // vec2 perpendicularRightLineEquation = getPerpendicularLineEquation(lineEquation, v_currPoint);
      // float pointAlignmentForLeftEdge = getPointAlignmentToLine(perpendicularLeftLineEquation, point);
      // float pointAlignmentForRightEdge = getPointAlignmentToLine(perpendicularRightLineEquation, point);

      // bool isLeftCap = pointAlignmentForLeftEdge > 0.0;
      // bool isRightCap = pointAlignmentForRightEdge < 0.0;

      // if (isLeftCap || isRightCap) {
      //   float distanceToEdge = getDistanceBetweenPoints(point, isLeftCap ? v_prevPoint: v_currPoint);
      //   bool isBorder = (distanceToEdge > lineWidth) && (distanceToEdge <= lineWidth + borderWidth);

      //   if (isBorder) {
      //     gl_FragColor = v_borderColor;
      //   } else {
      //     gl_FragColor = v_color;
      //   }
      // } else {
      float distanceToLineNormal = getDistanceFromLine(lineEquation, point);
      bool isBorder = (distanceToLineNormal > lineWidth) && (distanceToLineNormal < lineWidth + borderWidth);

        gl_FragColor = v_color;

        if (isBorder) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        } else {
          gl_FragColor = v_color;
        }
      // }
    }
  `,
};
