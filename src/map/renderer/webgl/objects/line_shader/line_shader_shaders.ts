import { FEATURE_FLAGS_UTILS, CLIP_UTILS, MAT_UTILS } from '../object/object_shaders';

export default {
  vertext: `
    precision highp float;
    #define PI 3.141592653589793
    #define VERTEX_QUAD_ALIGNMENT_TOP_LEFT 0.0
    #define VERTEX_QUAD_ALIGNMENT_TOP_RIGHT 1.0
    #define VERTEX_QUAD_ALIGNMENT_BOTTOM_LEFT 2.0
    #define VERTEX_QUAD_ALIGNMENT_BOTTOM_RIGHT 3.0

    ${CLIP_UTILS}
    ${MAT_UTILS}
    ${FEATURE_FLAGS_UTILS}

    uniform mat3 u_matrix;
    uniform float u_width;
    uniform float u_height;
    uniform float u_tile_size;
    uniform float u_distance;

    attribute vec3 a_position;
    attribute vec2 a_prevPoint;
    attribute vec2 a_currPoint;
    attribute vec2 a_nextPoint;
    attribute vec2 a_properties; // [line.width, line.borderWidth]
    attribute vec3 a_renderStyles; // [line.fill, line.cap, line.join]
    attribute vec4 a_color;
    attribute vec4 a_borderColor;
    attribute vec2 a_lineStripVertecies;
    attribute vec2 a_pointVertecies;

    varying vec2 v_prevPoint;
    varying vec2 v_currPoint;
    varying vec2 v_nextPoint;
    varying vec2 v_properties; // [line.width, line.borderWidth]
    varying vec3 v_renderStyles; // [line.fill, line.cap, line.join]
    varying vec4 v_color;
    varying vec4 v_borderColor;

    float atan2(in float y, in float x) {
      return x == 0.0 ? sign(y) * PI / 2.0 : atan(y, x);
    }

    float getLineAngle(vec2 p1, vec2 p2) {
      float dx = p2.x - p1.x;
      float dy = p2.y - p1.y;

      return atan2(dy, dx);
    }

    void main() {
      v_prevPoint = applyMatrix(u_matrix, clipSpace(a_prevPoint));
      v_currPoint = applyMatrix(u_matrix, clipSpace(a_currPoint));
      v_nextPoint = applyMatrix(u_matrix, clipSpace(a_nextPoint));
      v_properties = a_properties;
      v_renderStyles = a_renderStyles;
      v_color = a_color;
      v_borderColor = a_borderColor;

      float alignment = a_position.z;

      float x = 0.0;
      float y = 0.0;
      float x1 = a_prevPoint.x;
      float y1 = a_prevPoint.y;
      float x2 = a_currPoint.x;
      float y2 = a_currPoint.y;
      float centerX = (x1 + x2) / 2.0;
      float centerY = (y1 + y2) / 2.0;
      float borderWidth = a_properties[1] / u_distance;
      float halfTotalWidth = (a_properties[0] / 2.0 + a_properties[1] / 2.0) / u_distance;
      float halfLength = distance(a_prevPoint, a_currPoint) / 2.0 + borderWidth; // add cap or join
      float angle = getLineAngle(a_prevPoint, a_currPoint);

      if (alignment == VERTEX_QUAD_ALIGNMENT_TOP_LEFT) {
        x = centerX - halfLength * cos(angle) - halfTotalWidth * sin(angle);
        y = centerY - halfLength * sin(angle) + halfTotalWidth * cos(angle);
      } else if (alignment == VERTEX_QUAD_ALIGNMENT_TOP_RIGHT) {
        x = centerX + halfLength * cos(angle) - halfTotalWidth * sin(angle);
        y = centerY + halfLength * sin(angle) + halfTotalWidth * cos(angle);
      } else if (alignment == VERTEX_QUAD_ALIGNMENT_BOTTOM_LEFT) {
        x = centerX - halfLength * cos(angle) + halfTotalWidth * sin(angle);
        y = centerY - halfLength * sin(angle) - halfTotalWidth * cos(angle);
      } else if (alignment == VERTEX_QUAD_ALIGNMENT_BOTTOM_RIGHT) {
        x = centerX + halfLength * cos(angle) + halfTotalWidth * sin(angle);
        y = centerY + halfLength * sin(angle) - halfTotalWidth * cos(angle);
      }

      gl_Position = vec4(applyMatrix(u_matrix, clipSpace(vec2(x, y))), 0, 1);
    }
  `,
  fragment: `
    precision highp float;

    uniform mat3 u_matrix;
    uniform float u_width;
    uniform float u_height;
    uniform float u_tile_size;

    varying vec2 v_prevPoint;
    varying vec2 v_currPoint;
    varying vec2 v_nextPoint;
    varying vec2 v_properties; // [line.width, line.borderWidth]
    varying vec3 v_renderStyles; // [line.fill, line.cap, line.join]
    varying vec4 v_color;
    varying vec4 v_borderColor;

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

      return length(point - vec2(x, y));
    }

    bool belongToLine(vec2 lineEquation, float lineWidth, vec2 point) {
      return getDistanceFromLine(lineEquation, point) <= lineWidth;
    }

    void main() {
      vec2 resolution = vec2(u_width, u_height) / 2.0;
      vec2 point = (gl_FragCoord.xy / resolution) - 1.0;
      float lineWidth = v_properties[0] / u_width;
      float borderWidth = v_properties[1] / u_width;

      // vec2 lineEquation = getLineEquation(v_prevPoint, v_currPoint);
      // vec2 perpendicularLeftLineEquation = getPerpendicularLineEquation(lineEquation, v_prevPoint);
      // vec2 perpendicularRightLineEquation = getPerpendicularLineEquation(lineEquation, v_currPoint);
      // float pointAlignmentForLeftEdge = getPointAlignmentToLine(perpendicularLeftLineEquation, point);
      // float pointAlignmentForRightEdge = getPointAlignmentToLine(perpendicularRightLineEquation, point);
      // bool isLeftCap = pointAlignmentForLeftEdge <= 0.0 && pointAlignmentForRightEdge <= 0.0;
      // bool isRightCap = pointAlignmentForLeftEdge >= 0.0 && pointAlignmentForRightEdge >= 0.0;

      // vec2 nextLineEquation = getLineEquation(v_currPoint, v_nextPoint);
      // bool isJoin = belongToLine(nextLineEquation, lineWidth + borderWidth, point) && belongToLine(lineEquation, lineWidth + borderWidth, point);

      // if (isJoin) {
      //   // Render join
      //   float distanceToCurrentLine = getDistanceFromLine(lineEquation, point);
      //   float distanceToNextLine = getDistanceFromLine(nextLineEquation, point);

      //   if (distanceToCurrentLine <= lineWidth || distanceToNextLine <= lineWidth) {
      //     gl_FragColor = v_color;
      //   } else if (distanceToCurrentLine > lineWidth && distanceToCurrentLine <= lineWidth + borderWidth) {
      //     gl_FragColor = v_borderColor;
      //   } else if (distanceToNextLine > lineWidth && distanceToNextLine <= lineWidth + borderWidth) {
      //     gl_FragColor = v_borderColor;
      //   }
      // } else if (isLeftCap || isRightCap) {
      //   // Render Cap

      //   float distanceToEdge = length(point - (isLeftCap ? v_prevPoint: v_currPoint));
      //   bool isCapBody = distanceToEdge <= lineWidth;
      //   bool isBorder = (distanceToEdge > lineWidth) && (distanceToEdge <= lineWidth + borderWidth);

      //   if (isCapBody) {
      //     gl_FragColor = v_color;
      //   } else if (isBorder) {
      //     gl_FragColor = v_borderColor;
      //   }
      // } else {
        // Render body

        vec2 p1 = v_prevPoint;
        vec2 p2 = v_currPoint;
        vec2 p3 = point;
        vec2 p12 = p2 - p1;
        vec2 p13 = p3 - p1;
        vec2 p4 = p1 + normalize(p12) * (dot(p12, p13) / length(p12));
  
        float pointDistance = length(p4 - p3);
        float halfWidth = lineWidth / 2.0;
  
        // Smooth transitions (anti-aliasing)
        if (pointDistance <= halfWidth) {
          gl_FragColor = v_color;
        } else {
          gl_FragColor = v_borderColor;
        }
      // }
    }
  `,
};
