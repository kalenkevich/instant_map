export const DEFAULT_FRAGMENT_SHADER_SOURCE = `
  precision mediump float;

  uniform bool u_is_read_pixel_render_mode;
  varying vec4 v_color;

  void main() {
    gl_FragColor = v_color;
  }
`;

export const FEATURE_FLAGS_UTILS = `
  struct MapFeatureFlags {
    bool enableLineV2Rendering;
  };

  uniform MapFeatureFlags u_feature_flags;
`;

export const CLIP_UTILS = `
  vec2 clipSpace(vec2 position) {
    return vec2(
      -1.0 + position.x * 2.0,
      +1.0 - position.y * 2.0);
  }
`;

export const MAT_UTILS = `
  vec2 applyMatrix(mat3 mat, vec2 position) {
    return (mat * vec3(position, 1)).xy;
  }

  vec2 translate(mat3 a, vec2 v) {
    mat3 inversed = a;

    return vec2(v.x + 1.0 / inversed[2].x, v.y + 1.0 / inversed[2].y);
  }

  mat3 scale(mat3 a, vec2 v) {
    return mat3(
      v.x * a[0].x, v.x * a[0].y, v.x * a[0].z,
      v.y * a[1].x, v.y * a[1].y, v.y * a[1].z, 
      a[2].x, a[2].y, a[2].z
    );
  }

  mat3 unscale(mat3 a, vec2 v) {
    return mat3(
      a[0].x / v.x, a[0].y / v.x, a[0].z / v.x,
      a[1].x / v.y, a[1].y / v.y, a[1].z / v.y, 
      a[2].x, a[2].y, a[2].z
    );
  }
`;
