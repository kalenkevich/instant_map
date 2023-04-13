import { BufferInfo, ProgramInfo, createProgramInfo, createBufferInfoFromArrays } from "twgl.js";
import { GlObject } from "../object/object";

export class GlProgram {
  private readonly gl: WebGLRenderingContext;
  private programInfo: ProgramInfo;
  private bufferInfo: BufferInfo;
  private objects: GlObject[];
  private compiled: boolean = false;

  constructor(gl: WebGLRenderingContext, objects?: GlObject[]) {
    this.gl = gl;
    this.objects = objects || [];
    this.programInfo = null;
    this.bufferInfo = null;
  }

  public addObject(obj: GlObject) {
    this.objects.push(obj);
  }

  public compile(): ProgramInfo {
    if (this.compiled) {
      return this.programInfo;
    }

    this.programInfo = createProgramInfo(this.gl, [
      this.getVertexShaderSource(),
      this.getFragmentShaderSource(),
    ]);

    this.compiled = true;

    return this.programInfo;
  }

  public getVertexShaderSource(): string {
    return this.objects[0].getVertexShaderSource();
  }

  public getFragmentShaderSource(): string {
    return this.objects[0].getFragmentShaderSource();
  }

  public getProgramInfo(): ProgramInfo {
    return this.programInfo;
  }

  public getBufferInfo(): BufferInfo {
    const gl = this.gl;
    let arrays = {};

    for (const obj of this.objects) {
      const objBufferAttrs = obj.getBufferAttrs();

      arrays = {
        ...arrays,
        ...objBufferAttrs,
      };
    }

    return createBufferInfoFromArrays(this.gl, arrays);
  }

  public getUniforms(): Record<string, any> {
    const gl = this.gl;

    let uniforms = {
      resolution: [gl.canvas.width, gl.canvas.height]
    };

    for (const obj of this.objects) {
      const objUniforms = obj.getUniforms();

      uniforms = {
        ...uniforms,
        ...objUniforms,
      };
    }

    return uniforms;
  }
}