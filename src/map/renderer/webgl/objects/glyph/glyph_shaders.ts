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
    uniform float u_device_pixel_ratio;

    attribute vec3 a_position;
    attribute vec2 a_texCoord;
    attribute vec4 a_color;
    attribute vec4 a_properties;

    varying vec2 v_texCoord;
    varying vec4 v_color;

    void main() {
      v_texCoord = a_texCoord;
      v_color = a_color;

      float width = a_properties[0];
      float height = a_properties[1];
      float offsetTop = a_properties[2];
      float offsetLeft = a_properties[3];

      width /= u_distance * (u_device_pixel_ratio / 2.0);
      height /= u_distance * (u_device_pixel_ratio / 2.0);
      offsetTop /= u_distance * (u_device_pixel_ratio / 2.0);
      offsetLeft /= u_distance* (u_device_pixel_ratio / 2.0);

      float x = a_position.x - offsetLeft;
      float y = a_position.y + offsetTop;
      float alignment = a_position.z;

      if (alignment == VERTEX_QUAD_ALIGNMENT_TOP_LEFT) {
        x -= width / 2.0;
        y -= height / 2.0;
      } else if (alignment == VERTEX_QUAD_ALIGNMENT_TOP_RIGHT) {
        x += width / 2.0;
        y -= height / 2.0;
      } else if (alignment == VERTEX_QUAD_ALIGNMENT_BOTTOM_LEFT) {
        x -= width / 2.0;
        y += height / 2.0;
      } else if (alignment == VERTEX_QUAD_ALIGNMENT_BOTTOM_RIGHT) {
        x += width / 2.0;
        y += height / 2.0;
      }

      gl_Position = vec4(applyMatrix(u_matrix, clipSpace(vec2(x, y))), 0, 1);
    }
  `,
  fragment: `
    precision mediump float;

    uniform sampler2D u_texture;
    uniform bool u_is_read_pixel_render_mode;

    varying vec2 v_texCoord;
    varying vec4 v_color;
    
    void main() {
      if (u_is_read_pixel_render_mode) {
        gl_FragColor = v_color;
      } else {
        gl_FragColor = texture2D(u_texture, v_texCoord);
      }
    }
  `,
};
