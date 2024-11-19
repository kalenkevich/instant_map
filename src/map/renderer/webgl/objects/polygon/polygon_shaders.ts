import { FEATURE_FLAGS_UTILS, CLIP_UTILS, MAT_UTILS } from '../object/object_shaders';

export default {
  vertext: `#version 300 es
    precision highp float;
    ${CLIP_UTILS}
    ${MAT_UTILS}
    ${FEATURE_FLAGS_UTILS}

    uniform mat3 u_matrix;
    uniform float u_width;
    uniform float u_height;
    uniform float u_distance;
    uniform bool u_is_read_pixel_render_mode;

    layout(location=0) in vec3 a_position;
    layout(location=1) in vec4 a_color;

    out vec4 v_color;

    void main() {
      v_color = a_color;
      gl_Position = vec4(applyMatrix(u_matrix, clipSpace(a_position)), 1);
    }
  `,
  fragment: `#version 300 es
    precision mediump float;

    uniform bool u_is_read_pixel_render_mode;
    in vec4 v_color;
    out vec4 outColor;

    void main() {
      outColor = v_color;
    }
  `,
};
