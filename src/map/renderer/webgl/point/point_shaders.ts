import {
  DEFAULT_FRAGMENT_SHADER_SOURCE,
  CLIP_UTILS,
  MAT_UTILS,
  MERCATOR_PROJECTION_UTILS,
} from '../object/object_shaders';

export default {
  vertext: `
    ${CLIP_UTILS}
    ${MAT_UTILS}
    ${MERCATOR_PROJECTION_UTILS}

    uniform mat3 u_matrix;
    uniform float u_zoom;
    uniform float u_width;
    uniform float u_height;
    uniform float u_tile_size;

    attribute vec2 a_position;
    attribute vec4 a_color;

    varying vec4 v_color;

    void main() {
      v_color = a_color;
      gl_Position = vec4(applyMatrix(u_matrix, clipSpace(a_position)), 0, 1);
    }
  `,
  fragment: DEFAULT_FRAGMENT_SHADER_SOURCE,
};
