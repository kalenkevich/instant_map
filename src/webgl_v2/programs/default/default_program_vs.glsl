#version 300 es

in vec2 a_position;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

// all shaders have a main function
void main() {
    // Apply tranlation, rotation and scale.
  vec2 position = (u_matrix * vec3(a_position, 1)).xy;
  
  // Apply resolution.
  vec2 zeroToOne = position / u_resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}