import { DEFAULT_FRAGMENT_SHADER_SOURCE, CLIP_UTILS, MAT_UTILS } from '../object/object_shaders';

export default {
  vertext: `
    precision highp float;
    ${CLIP_UTILS}
    ${MAT_UTILS}

    attribute vec2 a_position;
    attribute vec4 a_color;

    uniform mat3 u_matrix;
    uniform bool u_is_read_pixel_render_mode;

    varying vec4 v_color;

    void main() {
      if (u_is_read_pixel_render_mode) {
        v_color = a_color;
      } else {
        v_color = vec4(0.0, 0.0, 0.0, 1.0);
      }

      gl_Position = vec4(applyMatrix(u_matrix, clipSpace(a_position)), 0, 1);
    }
  `,
  fragment: DEFAULT_FRAGMENT_SHADER_SOURCE,
};
