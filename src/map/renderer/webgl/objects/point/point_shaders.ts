import { FEATURE_FLAGS_UTILS, CLIP_UTILS, MAT_UTILS } from '../object/object_shaders';

export default {
  vertext: `
    precision highp float;
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
    uniform float u_distance;
    uniform bool u_is_read_pixel_render_mode;

    attribute vec3 a_position;
    attribute vec4 a_properties; // [radius, borderWidth, offsetTop, offsetLeft];
    attribute vec4 a_color;
    attribute vec4 a_border_color;

    varying vec2 v_center_point;
    varying vec4 v_color;
    varying vec4 v_border_color;
    varying float v_radius;
    varying float v_border_width;

    void main() {
      float radius = a_properties[0];
      float borderWidth = a_properties[1];
      float offsetTop = a_properties[2];
      float offsetLeft = a_properties[3];

      v_radius = radius;
      v_border_width = borderWidth;
      v_color = a_color;
      v_border_color = a_border_color;

      radius /= u_distance;
      borderWidth /= u_distance;
      offsetTop /= u_distance;
      offsetLeft /= u_distance;
      float totalRadius = radius + borderWidth;

      float x = a_position.x - offsetLeft;
      float y = a_position.y + offsetTop;
      float alignment = a_position.z;

      if (alignment == VERTEX_QUAD_ALIGNMENT_TOP_LEFT) {
        x -= totalRadius;
        y -= totalRadius;
      } else if (alignment == VERTEX_QUAD_ALIGNMENT_TOP_RIGHT) {
        x += totalRadius;
        y -= totalRadius;
      } else if (alignment == VERTEX_QUAD_ALIGNMENT_BOTTOM_LEFT) {
        x -= totalRadius;
        y += totalRadius;
      } else if (alignment == VERTEX_QUAD_ALIGNMENT_BOTTOM_RIGHT) {
        x += totalRadius;
        y += totalRadius;
      }

      gl_Position = vec4(applyMatrix(u_matrix, clipSpace(vec2(x, y))), 0, 1);
      v_center_point = gl_Position.xy;
    }
  `,
  fragment: `
    precision highp float;

    uniform float u_width;
    uniform float u_height;
    uniform float u_distance;
    uniform bool u_is_read_pixel_render_mode;

    varying vec2 v_center_point;
    varying float v_radius;
    varying float v_border_width;
    varying vec4 v_color;
    varying vec4 v_border_color;

    void main() {
      vec2 resolution = vec2(u_width, u_height);
      vec2 current_point = (gl_FragCoord.xy / resolution) - 0.5;
      float radius = v_radius;
      float border_width = v_border_width;
      float distanceToCenter = distance(v_center_point, current_point);

      if (distanceToCenter <= radius) {
        gl_FragColor = v_color;
      } else if (distanceToCenter > radius && distanceToCenter <= (radius + border_width)) {
        gl_FragColor = v_border_color;
      } else {
        gl_FragColor = vec4(0.0);
      }
    }
  `,
};
