import { FEATURE_FLAGS_UTILS, CLIP_UTILS, MAT_UTILS, MERCATOR_PROJECTION_UTILS } from '../object/object_shaders';

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
    void main() {}
  `,
  fragment: ``,
};
