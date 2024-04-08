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

    attribute vec3 a_position;
    attribute vec2 a_texCoord;
    attribute vec4 a_color;
    attribute vec4 a_text_properties;

    varying vec2 v_texCoord;
    varying vec4 v_color;

    void main() {
      v_texCoord = a_texCoord;
      v_color = a_color;

      float width = a_text_properties[0];
      float height = a_text_properties[1];
      float offsetTop = a_text_properties[2];
      float offsetLeft = a_text_properties[3];

      width /= u_distance;
      height /= u_distance;
      offsetTop /= u_distance;
      offsetLeft /= u_distance;

      float x = a_position.x + offsetLeft;
      float y = a_position.y - offsetTop;
      float alignment = a_position.z;

      if (alignment == VERTEX_QUAD_ALIGNMENT_TOP_RIGHT) {
        x += width;
      } else if (alignment == VERTEX_QUAD_ALIGNMENT_BOTTOM_LEFT) {
        y += height;
      } else if (alignment == VERTEX_QUAD_ALIGNMENT_BOTTOM_RIGHT) {
        x += width;
        y += height;
      }

      gl_Position = vec4(applyMatrix(u_matrix, clipSpace(vec2(x, y))), 0, 1);
    }
  `,
  fragment: `
    #define GAMMA 0.01
    precision highp float;

    uniform sampler2D u_texture;
    uniform bool u_is_read_pixel_render_mode;
    uniform bool u_is_sfd_mode;
    uniform float u_border_width;

    varying vec2 v_texCoord;
    varying vec4 v_color;
    
    void main() {

      if (u_is_read_pixel_render_mode) {
        gl_FragColor = v_color;
      } else if (u_is_sfd_mode) {
        float dist = texture2D(u_texture, v_texCoord).a;
        float alpha = v_color.a * smoothstep(u_border_width - GAMMA, u_border_width + GAMMA, dist);

        gl_FragColor = vec4(v_color.r, v_color.g, v_color.b, alpha);
      } else {
        gl_FragColor = texture2D(u_texture, v_texCoord);
      }
    }
  `,
};
