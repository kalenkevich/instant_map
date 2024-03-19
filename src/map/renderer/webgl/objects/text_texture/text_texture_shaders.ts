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
    precision highp float;

    uniform sampler2D u_texture;
    uniform bool u_is_read_pixel_render_mode;
    uniform bool u_is_sfd_mode;
    uniform float u_border_width;

    varying vec2 v_texCoord;
    varying vec4 v_color;
    
    void main() {
      float font_size = 10.0;
      float gamma = 1.4142 / font_size;

      if (u_is_read_pixel_render_mode) {
        gl_FragColor = v_color;
      } else if (u_is_sfd_mode) {
        float dist = texture2D(u_texture, v_texCoord).a;
        float alpha = v_color.a * smoothstep(u_border_width - gamma, u_border_width + gamma, dist);

        if (alpha == 0.0) {
          gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
        } else {
          gl_FragColor = vec4(v_color.r, v_color.g, v_color.b, alpha);
        }
      } else {
        gl_FragColor = texture2D(u_texture, v_texCoord);
      }
    }
  `,
};
