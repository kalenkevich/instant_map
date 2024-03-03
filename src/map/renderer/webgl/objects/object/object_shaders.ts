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

export const MERCATOR_PROJECTION_UTILS = `
  #define PI 3.141592653589793
  #define HALF_PI PI/2.0
  #define QUARTER_PI PI/4.0
  #define RAD_TO_DEG 180.0/PI
  #define DEG_TO_RAD PI/180.0

  float mercatorXfromLng(float lng) {
    return (180.0 + lng) / 360.0;
  }

  float mercatorYfromLat(float lat) {
    return (180.0 - (RAD_TO_DEG * log(tan(QUARTER_PI + (lat * PI) / 360.0)))) / 360.0;
  }

  vec2 mercatorProject(vec2 lngLat) {
    float x = mercatorXfromLng(lngLat.x);
    float y = mercatorYfromLat(lngLat.y);

    return vec2(x, y);
  }

  vec2 mercatorProject(vec3 lngLat) {
    float x = mercatorXfromLng(lngLat.x);
    float y = mercatorYfromLat(lngLat.y);

    return vec2(x, y);
  }
`;
