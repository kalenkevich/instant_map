/**
 * Extended WebGL 1.0 context API with extensions. Mimic WebGL 2.0 context API.
 * */
export type ExtendedWebGLRenderingContext = WebGLRenderingContext & {
  vertexAttribDivisor(index: number, divisor: number): void;
  drawArraysInstanced(primitiveType: number, offset: number, numElements: number, instanceCount: number): void;
  createVertexArray(): WebGLVertexArrayObjectOES;
  bindVertexArray(vao: WebGLVertexArrayObjectOES): void;
  drawBuffers(buffers: Array<GLenum>): void;
};

export const SUPPORTED_EXTENSIONS = [
  'ANGLE_instanced_arrays',
  'EXT_blend_minmax',
  'EXT_color_buffer_float',
  'EXT_color_buffer_half_float',
  'EXT_disjoint_timer_query',
  'EXT_disjoint_timer_query_webgl2',
  'EXT_frag_depth',
  'EXT_sRGB',
  'EXT_shader_texture_lod',
  'EXT_texture_filter_anisotropic',
  'OES_element_index_uint',
  'OES_standard_derivatives',
  'OES_texture_float',
  'OES_texture_float_linear',
  'OES_texture_half_float',
  'OES_texture_half_float_linear',
  'OES_vertex_array_object',
  'WEBGL_color_buffer_float',
  'WEBGL_compressed_texture_atc',
  'WEBGL_compressed_texture_etc1',
  'WEBGL_compressed_texture_pvrtc',
  'WEBGL_compressed_texture_s3tc',
  'WEBGL_compressed_texture_s3tc_srgb',
  'WEBGL_depth_texture',
  'WEBGL_draw_buffers',
];

export function addExtensionsToContext(gl: WebGLRenderingContext): ExtendedWebGLRenderingContext {
  const prefixRE = /^(.*?)_/;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const glContextObject: Record<string, any> = gl;

  for (const extensionName of SUPPORTED_EXTENSIONS) {
    const ext = gl.getExtension(extensionName);
    if (!ext) {
      continue;
    }

    const fnSuffix = prefixRE.exec(extensionName)[1];
    const enumSuffix = '_' + fnSuffix;
    for (const key in ext) {
      const value = ext[key];
      const isFunc = typeof value === 'function';
      const suffix = isFunc ? fnSuffix : enumSuffix;
      let name = key;
      // examples of where this is not true are WEBGL_compressed_texture_s3tc
      // and WEBGL_compressed_texture_pvrtc
      if (key.endsWith(suffix)) {
        name = key.substring(0, key.length - suffix.length);
      }
      if (glContextObject[name] !== undefined) {
        if (!isFunc && glContextObject[name] !== value) {
          console.warn(name, glContextObject[name], value, key);
        }
      } else {
        if (isFunc) {
          glContextObject[name] = (function (origFn) {
            return function (...args: unknown[]) {
              return origFn.apply(ext, args);
            };
          })(value);
        } else {
          glContextObject[name] = value;
        }
      }
    }
  }

  return glContextObject as ExtendedWebGLRenderingContext;
}
