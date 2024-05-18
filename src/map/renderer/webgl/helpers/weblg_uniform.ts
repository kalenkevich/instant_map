import { ExtendedWebGLRenderingContext } from '../webgl_context';

export interface CreateWebGlUniformParams {
  name: string;
  program: WebGLProgram;
}

export interface WebGlUniform {
  setBoolean(v: boolean): void;
  setInteger(v: number): void;
  setFloat(v: number): void;
  setVector2(v: [number, number]): void;
  setVector3(v: [number, number, number]): void;
  setVector4(v: [number, number, number, number]): void;
  setMatrix2(v: [number, number, number, number]): void;
  setMatrix3(v: [number, number, number, number, number, number, number, number, number]): void;
}

export function createWebGlUniform(gl: ExtendedWebGLRenderingContext, params: CreateWebGlUniformParams): WebGlUniform {
  const uniformLocation = gl.getUniformLocation(params.program, params.name);

  return {
    setBoolean(v: boolean) {
      gl.uniform1i(uniformLocation, v ? 1 : 0);
    },
    setInteger(v: number) {
      gl.uniform1i(uniformLocation, v);
    },
    setFloat(v: number) {
      gl.uniform1f(uniformLocation, v);
    },
    setVector2(v: [number, number]) {
      gl.uniform2f(uniformLocation, v[0], v[1]);
    },
    setVector3(v: [number, number, number]) {
      gl.uniform3f(uniformLocation, v[0], v[1], v[2]);
    },
    setVector4(v: [number, number, number, number]) {
      gl.uniform4f(uniformLocation, v[0], v[1], v[2], v[3]);
    },
    setMatrix2(v: [number, number, number, number]) {
      gl.uniformMatrix2fv(uniformLocation, false, v);
    },
    setMatrix3(v: [number, number, number, number, number, number, number, number, number]) {
      gl.uniformMatrix3fv(uniformLocation, false, v);
    },
  };
}
