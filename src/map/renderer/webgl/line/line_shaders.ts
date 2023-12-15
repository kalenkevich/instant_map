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

    attribute vec2 a_position;
    attribute vec3 point_a;
    attribute vec3 point_b;
    attribute vec4 a_color;
    attribute float a_width;

    varying vec4 v_color;

    void main() {
      if (point_a.z == -1.0) {
        // trasparent
        v_color = vec4(0, 0, 0, 0);
      } else {
        v_color = a_color;
      }

      vec2 point_a_projected = mercatorProject(point_a);
      vec2 point_b_projected = mercatorProject(point_b);
      vec2 xBasis = point_b_projected - point_a_projected;
      vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));
      vec2 pos = point_a_projected + xBasis * a_position.x + yBasis * a_width * a_position.y;

      gl_Position = vec4(applyMatrix(u_matrix, clipSpace(pos)), 0, 1);
    }
  `,
  fragment: DEFAULT_FRAGMENT_SHADER_SOURCE,
};
