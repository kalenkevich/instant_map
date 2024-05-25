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

  vec3 clipSpace(vec3 position) {
    return vec3(
      -1.0 + position.x * 2.0,
      +1.0 - position.y * 2.0,
      position.z);
  }
`;

export const MAT_UTILS = `
  vec2 applyMatrix(mat3 mat, vec2 position) {
    return (mat * vec3(position, 1.0)).xy;
  }

  vec3 applyMatrix(mat3 mat, vec3 position) {
    return mat * position;
  }
`;
