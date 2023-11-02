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

// precision highp float;

// in vec2 a_position;
// in vec2 point_a;
// in vec2 point_b;

// #define OBJECT_TYPE_CIRCLE   0x00000000u
// #define OBJECT_TYPE_LINE     0x00000001u
// #define OBJECT_TYPE_POLYGON  0x00000002u
// #define OBJECT_TYPE_TEXT     0x00000003u
// #define OBJECT_TYPE_IMAGE    0x00000004u
// uniform uint u_object_type;

// uniform vec2 u_resolution;
// uniform mat3 u_matrix;

// // OBJECT_TYPE_LINE specific uniforms
// uniform float u_line_width;

// vec2 get_line_position() {
//   vec2 xBasis = point_b - point_a;
//   vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));

//   return point_a + xBasis * a_position.x + yBasis * u_line_width * a_position.y;
// }

// vec2 get_position() {
//   if (u_object_type == OBJECT_TYPE_LINE) {
//     return get_line_position();
//   }

//   return a_position;
// }

// void main() {
//   vec2 pos = get_position();

//   // Apply tranlation, rotation and scale.
//   vec2 position = (u_matrix * vec3(pos, 1)).xy;
  
//   // Apply resolution.
//   vec2 zeroToOne = position / u_resolution;
//   vec2 zeroToTwo = zeroToOne * 2.0;
//   vec2 clipSpace = zeroToTwo - 1.0;

//   gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
// }
