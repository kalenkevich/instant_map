import { BufferInfo, ProgramInfo, createProgramInfo } from "twgl.js";
import { GlObject } from "../object/object";

export class GlProgram {
  private readonly gl: WebGLRenderingContext;
  private programInfo: ProgramInfo;
  private bufferInfo: BufferInfo;
  private objects: GlObject[];

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.programInfo = null;
    this.bufferInfo = null;
    this.objects = [];
  }

  public compile(): ProgramInfo {
    const gl = this.gl;

    this.programInfo = createProgramInfo(gl, [
      this.getVertexShaderSource(),
      this.getFragmentShaderSource(),
    ]);

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
    return this.bufferInfo;
  }

  public setBufferInfo(bufferInfo: BufferInfo): void {
    this.bufferInfo = bufferInfo;
  }
}