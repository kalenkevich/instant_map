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
    #define PI 3.141592653589793
    #define LINE_FILL_SOLID 0.0
    #define LINE_FILL_DASHED 1.0
    #define LINE_FILL_DOTTED 2.0
    #define LINE_FILL_DOTDASHED 3.0
    #define LINE_CAP_BUTT 0.0
    #define LINE_CAP_ROUND 1.0
    #define LINE_CAP_SQUARE 2.0
    #define LINE_JOIN_MITER 0.0
    #define LINE_JOIN_ROUND 1.0
    #define LINE_JOIN_BEVEL 2.0

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

    // Calculate distance from point to line segment
    float distanceToLineSegment(vec2 p1, vec2 p2, vec2 point) {
      vec2 lineDir = p2 - p1;
      vec2 pointDir = point - p1;
      float lineLength = length(lineDir);
      
      if (lineLength < 0.0001) {
        return length(point - p1);
      }
      
      vec2 normalizedLineDir = lineDir / lineLength;
      float t = clamp(dot(pointDir, normalizedLineDir) / lineLength, 0.0, 1.0);
      vec2 closestPoint = p1 + t * lineDir;
      
      return length(point - closestPoint);
    }

    // Calculate distance along line segment from p1
    float distanceAlongLine(vec2 p1, vec2 p2, vec2 point) {
      vec2 lineDir = p2 - p1;
      vec2 pointDir = point - p1;
      float lineLength = length(lineDir);
      
      if (lineLength < 0.0001) {
        return 0.0;
      }
      
      vec2 normalizedLineDir = lineDir / lineLength;
      float t = clamp(dot(pointDir, normalizedLineDir) / lineLength, 0.0, 1.0);
      
      return t * lineLength;
    }

    // Check if point is within line segment bounds
    bool isWithinSegment(vec2 p1, vec2 p2, vec2 point) {
      vec2 lineDir = p2 - p1;
      vec2 pointDir = point - p1;
      float lineLength = length(lineDir);
      
      if (lineLength < 0.0001) {
        return length(point - p1) < lineLength;
      }
      
      vec2 normalizedLineDir = lineDir / lineLength;
      float t = dot(pointDir, normalizedLineDir) / lineLength;
      
      return t >= 0.0 && t <= 1.0;
    }

    // Check if point is in cap region
    bool isInCapRegion(vec2 capPoint, vec2 lineDir, vec2 point, float capType, float lineWidth, float borderWidth) {
      vec2 toPoint = point - capPoint;
      float distToCap = length(toPoint);
      float totalWidth = lineWidth + borderWidth;
      
      if (distToCap > totalWidth) {
        return false;
      }
      
      float lineLength = length(lineDir);
      if (lineLength < 0.0001) {
        return distToCap <= totalWidth;
      }
      
      vec2 normalizedLineDir = normalize(lineDir);
      float alongLine = dot(toPoint, normalizedLineDir);
      
      if (capType == LINE_CAP_BUTT) {
        return alongLine <= 0.0 && distToCap <= totalWidth;
      } else if (capType == LINE_CAP_SQUARE) {
        float halfWidth = totalWidth;
        return alongLine <= halfWidth && abs(dot(toPoint, vec2(-normalizedLineDir.y, normalizedLineDir.x))) <= halfWidth;
      } else { // LINE_CAP_ROUND
        return distToCap <= totalWidth;
      }
    }

    // Render round cap
    float renderRoundCap(vec2 capPoint, vec2 point, float lineWidth, float borderWidth) {
      float dist = length(point - capPoint);
      float halfWidth = lineWidth / 2.0;
      float totalWidth = halfWidth + borderWidth;
      
      if (dist <= halfWidth) {
        return 1.0; // Inside line
      } else if (dist <= totalWidth) {
        return 2.0; // Border
      }
      return 0.0; // Outside
    }

    // Render square cap
    float renderSquareCap(vec2 capPoint, vec2 lineDir, vec2 point, float lineWidth, float borderWidth) {
      vec2 toPoint = point - capPoint;
      float lineLength = length(lineDir);
      if (lineLength < 0.0001) {
        return renderRoundCap(capPoint, point, lineWidth, borderWidth);
      }
      
      vec2 normalizedLineDir = normalize(lineDir);
      vec2 perpDir = vec2(-normalizedLineDir.y, normalizedLineDir.x);
      
      float halfWidth = lineWidth / 2.0;
      float totalWidth = halfWidth + borderWidth;
      
      float alongLine = dot(toPoint, normalizedLineDir);
      float perpDist = abs(dot(toPoint, perpDir));
      
      if (alongLine <= totalWidth && perpDist <= halfWidth) {
        return 1.0; // Inside line
      } else if (alongLine <= totalWidth && perpDist <= totalWidth) {
        return 2.0; // Border
      }
      return 0.0; // Outside
    }

    // Render miter join
    float renderMiterJoin(vec2 p1, vec2 p2, vec2 p3, vec2 point, float lineWidth, float borderWidth) {
      vec2 dir1 = normalize(p2 - p1);
      vec2 dir2 = normalize(p3 - p2);
      vec2 perp1 = vec2(-dir1.y, dir1.x);
      vec2 perp2 = vec2(-dir2.y, dir2.x);
      
      float halfWidth = lineWidth / 2.0;
      float totalWidth = halfWidth + borderWidth;
      
      // Calculate distances to the two line segments
      float dist1 = distanceToLineSegment(p1, p2, point);
      float dist2 = distanceToLineSegment(p2, p3, point);
      float distToJoin = length(point - p2);
      
      // Check if point is within either line segment's width
      if (dist1 <= halfWidth || dist2 <= halfWidth) {
        return 1.0; // Inside line
      } else if (dist1 <= totalWidth || dist2 <= totalWidth) {
        return 2.0; // Border
      }
      
      // For miter extension, check if we're in the outer region
      vec2 toPoint = point - p2;
      vec2 toPointFromP1 = point - p1;
      float side1 = dot(toPointFromP1, perp1);
      float side2 = dot(toPoint, perp2);
      
      // Determine which side is "outer" (the side that extends)
      // For a turn, both outer sides are on the same side of the angle
      bool outerSide1 = side1 > 0.0;
      bool outerSide2 = side2 > 0.0;
      
      // Miter extends the outer edges until they meet
      // Check if we're in the region between the outer edges
      if ((outerSide1 && outerSide2) || (!outerSide1 && !outerSide2)) {
        // Calculate miter direction (bisector)
        vec2 miterDir = normalize(dir1 + dir2);
        vec2 miterPerp = vec2(-miterDir.y, miterDir.x);
        
        float alongMiter = dot(toPoint, miterDir);
        float perpMiter = abs(dot(toPoint, miterPerp));
        
        // Miter extends outward from p2
        if (alongMiter > 0.0 && distToJoin < totalWidth * 2.5) {
          if (perpMiter <= halfWidth) {
            return 1.0; // Inside miter
          } else if (perpMiter <= totalWidth) {
            return 2.0; // Border of miter
          }
        }
      }
      
      return 0.0; // Outside
    }

    // Render round join
    float renderRoundJoin(vec2 joinPoint, vec2 point, float lineWidth, float borderWidth) {
      float dist = length(point - joinPoint);
      float halfWidth = lineWidth / 2.0;
      float totalWidth = halfWidth + borderWidth;
      
      // Round join is a circle centered at the join point
      if (dist <= halfWidth) {
        return 1.0; // Inside line
      } else if (dist <= totalWidth) {
        return 2.0; // Border
      }
      return 0.0; // Outside
    }

    // Render bevel join
    float renderBevelJoin(vec2 p1, vec2 p2, vec2 p3, vec2 point, float lineWidth, float borderWidth) {
      float dist1 = distanceToLineSegment(p1, p2, point);
      float dist2 = distanceToLineSegment(p2, p3, point);
      float distToJoin = length(point - p2);
      
      float halfWidth = lineWidth / 2.0;
      float totalWidth = halfWidth + borderWidth;
      
      // For bevel, we render the union of both line segments
      if (dist1 <= halfWidth || dist2 <= halfWidth) {
        return 1.0; // Inside line
      } else if (dist1 <= totalWidth || dist2 <= totalWidth) {
        return 2.0; // Border
      }
      
      // Bevel also includes the triangular region between the outer edges
      vec2 dir1 = normalize(p2 - p1);
      vec2 dir2 = normalize(p3 - p2);
      vec2 perp1 = vec2(-dir1.y, dir1.x);
      vec2 perp2 = vec2(-dir2.y, dir2.x);
      
      vec2 toPoint = point - p2;
      vec2 toPointFromP1 = point - p1;
      float side1 = dot(toPointFromP1, perp1);
      float side2 = dot(toPoint, perp2);
      
      // Determine outer sides
      bool outerSide1 = side1 > 0.0;
      bool outerSide2 = side2 > 0.0;
      
      // Check if we're in the bevel triangle (between outer edges)
      // Bevel connects the outer edges with a straight line
      bool inBevelRegion = (outerSide1 && outerSide2) && distToJoin < totalWidth * 2.0;
      
      if (inBevelRegion) {
        // Check distance to the bevel line (connecting outer edge endpoints)
        // Simplified: if we're near p2 and on the outer side, include it
        if (distToJoin <= halfWidth) {
          return 1.0;
        } else if (distToJoin <= totalWidth) {
          return 2.0;
        }
      }
      
      return 0.0; // Outside
    }

    // Check dashed line pattern
    bool isDashedVisible(float fillType, float distanceAlong, float lineLength) {
      if (fillType == LINE_FILL_SOLID) {
        return true;
      }
      
      // Normalize distance to pattern space
      float patternLength = 0.0;
      float dashLength = 0.0;
      float gapLength = 0.0;
      
      if (fillType == LINE_FILL_DASHED) {
        dashLength = lineLength * 0.3;
        gapLength = lineLength * 0.2;
        patternLength = dashLength + gapLength;
      } else if (fillType == LINE_FILL_DOTTED) {
        dashLength = lineLength * 0.1;
        gapLength = lineLength * 0.2;
        patternLength = dashLength + gapLength;
      } else if (fillType == LINE_FILL_DOTDASHED) {
        dashLength = lineLength * 0.3;
        gapLength = lineLength * 0.15;
        patternLength = dashLength + gapLength;
      }
      
      if (patternLength < 0.0001) {
        return true;
      }
      
      float position = mod(distanceAlong, patternLength);
      return position < dashLength;
    }

    void main() {
      vec2 resolution = vec2(u_width, u_height) / 2.0;
      vec2 point = (gl_FragCoord.xy / resolution) - 1.0;
      float lineWidth = v_properties[0] / u_width;
      float borderWidth = v_properties[1] / u_width;
      float fillType = v_renderStyles[0];
      float capType = v_renderStyles[1];
      float joinType = v_renderStyles[2];
      
      vec2 p1 = v_prevPoint;
      vec2 p2 = v_currPoint;
      vec2 p3 = v_nextPoint;
      
      float halfWidth = lineWidth / 2.0;
      float totalWidth = halfWidth + borderWidth;
      float lineLength = length(p2 - p1);
      
      if (lineLength < 0.0001) {
        discard;
        return;
      }
      
      // Calculate distances
      float distToP1 = length(point - p1);
      float distToP2 = length(point - p2);
      float distAlong = distanceAlongLine(p1, p2, point);
      float distToLine = distanceToLineSegment(p1, p2, point);
      
      // Check if we have a join (next segment exists and is different)
      bool hasNextSegment = length(p3 - p2) > 0.0001;
      
      // Priority 1: Check if we're in join region (near p2 with next segment)
      // Only render join from the END of the current segment to avoid double-rendering
      if (hasNextSegment) {
        float dist1 = distanceToLineSegment(p1, p2, point);
        float dist2 = distanceToLineSegment(p2, p3, point);
        float distToP2 = length(point - p2);
        
        // Calculate how far along the current segment we are
        float distAlong1 = distanceAlongLine(p1, p2, point);
        float lineLength1 = length(p2 - p1);
        
        // Determine if we're in the join region
        // Join region: near p2 (within 2.5 * totalWidth) AND
        // (within totalWidth of either segment OR past the end of current segment)
        bool nearJoinPoint = distToP2 < totalWidth * 2.5;
        bool inSegmentRegion = dist1 <= totalWidth || dist2 <= totalWidth;
        bool pastSegmentEnd = distAlong1 >= lineLength1;
        
        bool inJoinRegion = nearJoinPoint && (inSegmentRegion || pastSegmentEnd);
        
        if (inJoinRegion) {
          float joinResult = 0.0;
          
          if (joinType == LINE_JOIN_ROUND) {
            joinResult = renderRoundJoin(p2, point, lineWidth, borderWidth);
          } else if (joinType == LINE_JOIN_BEVEL) {
            joinResult = renderBevelJoin(p1, p2, p3, point, lineWidth, borderWidth);
          } else { // LINE_JOIN_MITER
            joinResult = renderMiterJoin(p1, p2, p3, point, lineWidth, borderWidth);
          }
          
          if (joinResult > 0.0) {
            // For joins, ignore dashed pattern - render solid in join region
            if (joinResult == 1.0) {
              gl_FragColor = v_color;
            } else if (joinResult == 2.0) {
              gl_FragColor = v_borderColor;
            } else {
              discard;
            }
            return;
          }
          // If join function returned 0, we might still be in join region but outside join geometry
          // In that case, discard to avoid line body rendering overlap
          if (nearJoinPoint && distToP2 < totalWidth * 1.5) {
            discard;
            return;
          }
        }
      }
      
      // Priority 2: Check if we're at end cap (no next segment, near p2)
      if (!hasNextSegment && distToP2 < totalWidth * 2.0) {
        vec2 lineDir = p2 - p1;
        if (length(lineDir) < 0.0001) {
          lineDir = vec2(1.0, 0.0);
        }
        float capResult = 0.0;
        
        if (capType == LINE_CAP_ROUND) {
          capResult = renderRoundCap(p2, point, lineWidth, borderWidth);
        } else if (capType == LINE_CAP_SQUARE) {
          capResult = renderSquareCap(p2, -lineDir, point, lineWidth, borderWidth);
        } else { // LINE_CAP_BUTT
          vec2 lineDirNorm = normalize(lineDir);
          vec2 toPoint = point - p2;
          float perpDist = abs(dot(toPoint, vec2(-lineDirNorm.y, lineDirNorm.x)));
          float alongDist = dot(toPoint, -lineDirNorm);
          
          if (alongDist <= 0.0 && perpDist <= halfWidth) {
            capResult = 1.0;
          } else if (alongDist <= 0.0 && perpDist <= totalWidth) {
            capResult = 2.0;
          }
        }
        
        if (capResult > 0.0) {
          if (capResult == 1.0) {
            gl_FragColor = v_color;
          } else if (capResult == 2.0) {
            gl_FragColor = v_borderColor;
          } else {
            discard;
          }
          return;
        }
      }
      
      // Priority 3: Check if we're at start cap (near p1, and either before line start or in cap region)
      if (distToP1 < totalWidth * 2.0) {
        vec2 lineDir = p2 - p1;
        if (length(lineDir) < 0.0001) {
          lineDir = vec2(1.0, 0.0);
        }
        vec2 lineDirNorm = normalize(lineDir);
        vec2 toPoint = point - p1;
        float alongDist = dot(toPoint, lineDirNorm);
        
        // Check if we're before the line start (in cap region)
        bool inCapRegion = false;
        if (capType == LINE_CAP_ROUND || capType == LINE_CAP_SQUARE) {
          inCapRegion = distToP1 < totalWidth * 2.0;
        } else { // LINE_CAP_BUTT
          inCapRegion = alongDist <= 0.0;
        }
        
        if (inCapRegion) {
          float capResult = 0.0;
          
          if (capType == LINE_CAP_ROUND) {
            capResult = renderRoundCap(p1, point, lineWidth, borderWidth);
          } else if (capType == LINE_CAP_SQUARE) {
            capResult = renderSquareCap(p1, lineDir, point, lineWidth, borderWidth);
          } else { // LINE_CAP_BUTT
            float perpDist = abs(dot(toPoint, vec2(-lineDirNorm.y, lineDirNorm.x)));
            
            if (alongDist <= 0.0 && perpDist <= halfWidth) {
              capResult = 1.0;
            } else if (alongDist <= 0.0 && perpDist <= totalWidth) {
              capResult = 2.0;
            }
          }
          
          if (capResult > 0.0) {
            if (capResult == 1.0) {
              gl_FragColor = v_color;
            } else if (capResult == 2.0) {
              gl_FragColor = v_borderColor;
            } else {
              discard;
            }
            return;
          }
        }
      }
      
      // Priority 4: Render line body
      // Don't render line body if we're in a join region (to avoid overlap)
      if (hasNextSegment) {
        float distToP2 = length(point - p2);
        float distAlong1 = distanceAlongLine(p1, p2, point);
        float lineLength1 = length(p2 - p1);
        float dist1 = distanceToLineSegment(p1, p2, point);
        float dist2 = distanceToLineSegment(p2, p3, point);
        
        // Skip line body rendering if we're in the join region
        // Join region: near p2 and within totalWidth of either segment
        bool inJoinRegion = distToP2 < totalWidth * 2.0 && 
                           (dist1 <= totalWidth || dist2 <= totalWidth || distAlong1 >= lineLength1);
        
        if (inJoinRegion) {
          discard;
          return;
        }
      }
      
      // Check dashed pattern
      if (!isDashedVisible(fillType, distAlong, lineLength)) {
        discard;
        return;
      }
      
      if (distToLine <= halfWidth) {
        gl_FragColor = v_color;
      } else if (distToLine <= totalWidth) {
        gl_FragColor = v_borderColor;
      } else {
        discard;
      }
    }
  `,
};
