import {
  FEATURE_FLAGS_UTILS,
  DEFAULT_FRAGMENT_SHADER_SOURCE,
  CLIP_UTILS,
  MAT_UTILS,
  MERCATOR_PROJECTION_UTILS,
} from '../object/object_shaders';

export default {
  vertext: `
    precision highp float;
    ${CLIP_UTILS}
    ${MAT_UTILS}
    ${MERCATOR_PROJECTION_UTILS}
    ${FEATURE_FLAGS_UTILS}

    uniform mat3 u_matrix;
    uniform float u_zoom;
    uniform float u_width;
    uniform float u_height;
    uniform float u_tile_size;

    attribute vec2 point_a;
    attribute vec4 a_color;

    varying vec4 v_color;

    void main() {
      v_color = a_color;
      gl_Position = vec4(applyMatrix(u_matrix, clipSpace(point_a.xy)), 0, 1);
    } 
  `,
  fragment: DEFAULT_FRAGMENT_SHADER_SOURCE,
};
