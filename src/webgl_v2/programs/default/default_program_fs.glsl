#version 300 es
precision lowp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {
  outColor = u_color;
}