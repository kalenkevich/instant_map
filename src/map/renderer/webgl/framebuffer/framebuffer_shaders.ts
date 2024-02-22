import { FEATURE_FLAGS_UTILS } from '../object/object_shaders';

export default {
  vertext: `
    ${FEATURE_FLAGS_UTILS}
    attribute vec4 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;

    uniform mat3 u_matrix;
    uniform float u_zoom;
    uniform float u_width;
    uniform float u_height;
    uniform float u_tile_size;

    void main() {
      v_texCoord = a_texCoord;
      v_texCoord.y = 1.0 - v_texCoord.y;
      gl_Position = a_position;
    }
  `,
  fragment: `
    precision mediump float;

    uniform sampler2D u_texture;
    varying vec2 v_texCoord;
    
    void main() {
      gl_FragColor = texture2D(u_texture, v_texCoord);
    }
  `,
};
