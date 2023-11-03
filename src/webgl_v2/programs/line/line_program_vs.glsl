#version 300 es
precision highp float;

in vec2 a_position;
in vec2 point_a;
in vec2 point_b;

uniform vec2 u_resolution;
uniform mat3 u_matrix;
uniform float u_line_width;

void main() {
  vec2 xBasis = point_b - point_a;
  vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));
  vec2 pos = point_a + xBasis * a_position.x + yBasis * u_line_width * a_position.y;

  // Apply tranlation, rotation and scale.
  vec2 position = (u_matrix * vec3(pos, 1)).xy;
  
  // Apply resolution.
  vec2 zeroToOne = position / u_resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
