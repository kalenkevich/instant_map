#version 300 es

in vec2 a_position;
in vec2 a_texcoord;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

out vec2 v_texcoord;

void main() {
  // Apply tranlation, rotation and scale.
  vec2 position = (u_matrix * vec3(a_position, 1)).xy;

  // Apply resolution.
  vec2 zeroToOne = position / u_resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

  // Pass the texcoord to the fragment shader.
  v_texcoord = a_texcoord;
}