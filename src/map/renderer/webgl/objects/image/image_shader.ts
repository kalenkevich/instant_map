import { FEATURE_FLAGS_UTILS, CLIP_UTILS, MAT_UTILS } from '../object/object_shaders';

export default {
  vertext: `
    precision highp float;
    #define VERTEX_ALIGNMENT_TOP_LEFT 0.0
    #define VERTEX_ALIGNMENT_TOP_RIGHT 1.0
    #define VERTEX_ALIGNMENT_BOTTOM_LEFT 2.0
    #define VERTEX_ALIGNMENT_BOTTOM_RIGHT 3.0

    ${CLIP_UTILS}
    ${MAT_UTILS}
    ${FEATURE_FLAGS_UTILS}

    uniform mat3 u_matrix;
    uniform float u_width;
    uniform float u_height;
    uniform float u_distance;

    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    attribute vec4 a_color;

    varying vec2 v_texCoord;
    varying vec4 v_color;

    void main() {
      v_texCoord = a_texCoord;
      v_color = a_color;

      gl_Position = vec4(applyMatrix(u_matrix, clipSpace(a_position)), 0, 1);
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
