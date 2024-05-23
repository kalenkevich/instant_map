import { FEATURE_FLAGS_UTILS, CLIP_UTILS, MAT_UTILS } from '../object/object_shaders';

export default {
  vertext: `#version 300 es
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
    uniform float u_device_pixel_ratio;
    uniform vec3 u_properties_data;
    uniform sampler2D u_properties;

    layout (location=0) in vec3 a_position;
    layout (location=1) in vec2 a_texCoord;
    layout (location=2) in vec4 a_color;
    layout (location=3) in vec4 a_text_properties;
    layout (location=4) in float a_object_index;

    out vec2 v_texCoord;
    out vec4 v_color;

    vec4 getValueByIndexFromTexture(sampler2D tex, vec2 texSize, float index) {
      float col = mod(index, texSize.x);
      float row = floor(index / texSize.x);

      return texelFetch(tex, ivec2(col, row), 0);
    }

    void main() {
      v_texCoord = a_texCoord;
      v_color = a_color;

      // vec4 text_properties = getValueByIndexFromTexture(u_properties, u_properties_data.xy, a_object_index);
      // float width = text_properties[0] / 1.0;
      // float height = text_properties[1] / 1.0;
      // float offsetTop = text_properties[2] / 1.0;
      // float offsetLeft = text_properties[3] / 1.0;

      float width = a_text_properties[0];
      float height = a_text_properties[1];
      float offsetTop = a_text_properties[2];
      float offsetLeft = a_text_properties[3];

      width /= u_distance * (u_device_pixel_ratio / 2.0);
      height /= u_distance * (u_device_pixel_ratio / 2.0);
      offsetTop /= u_distance * (u_device_pixel_ratio / 2.0);
      offsetLeft /= u_distance* (u_device_pixel_ratio / 2.0);

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
  fragment: `#version 300 es
    #define GAMMA 0.01
    precision highp float;

    uniform sampler2D u_texture;
    uniform sampler2D u_properties;
    uniform bool u_is_read_pixel_render_mode;
    uniform bool u_is_sfd_mode;
    uniform float u_border_width;

    in vec2 v_texCoord;
    in vec4 v_color;

    out vec4 outputColor;
    
    void main() {
      if (u_is_read_pixel_render_mode) {
        outputColor = v_color;
      } else if (u_is_sfd_mode) {
        float dist = texture(u_texture, v_texCoord).a;
        float alpha = v_color.a * smoothstep(u_border_width - GAMMA, u_border_width + GAMMA, dist);

        outputColor = vec4(v_color.r, v_color.g, v_color.b, alpha);
      } else {
        outputColor = texture(u_texture, v_texCoord);
      }
    }
  `,
};
