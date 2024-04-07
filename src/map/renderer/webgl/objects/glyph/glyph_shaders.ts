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
    attribute vec2 a_glyph_properties;

    varying vec2 v_texCoord;
    varying vec4 v_color;

    void main() {
      v_texCoord = a_texCoord;
      v_color = a_color;

      float width = a_glyph_properties[0];
      float height = a_glyph_properties[1];

      width /= u_distance;
      height /= u_distance;

      float x = a_position.x;
      float y = a_position.y;
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
