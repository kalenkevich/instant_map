import earcut from 'earcut';
import { GlProgram, GlProgramProps, GlProgramType, BufferAttrs, ProgramCache } from './program';
import { v2 } from '../types';

export interface GlAreaPorps extends GlProgramProps {
  points: v2[];
}

export class WebGlArea extends GlProgram {
  type = GlProgramType.AREA;

  protected points: v2[];

  constructor(props: GlAreaPorps) {
    super(props);
    this.points = props.points;
  }

  public getType(): GlProgramType {
    return GlProgramType.AREA;
  }

  getPoints(): v2[] {
    return this.points;
  }

  setPoints(points: v2[]) {
    this.points = points;
  }

  public draw(gl: WebGLRenderingContext, cache: ProgramCache) {
    const program = this.getProgram(gl, cache);
    if (program !== cache.currentProgram) {
      gl.useProgram(program);
      cache.currentProgram = program;
    }

    const bufferAttrs = this.bufferAttrsCache || this.getBufferAttrs(gl);
    if (!this.bufferAttrsCache) {
      this.bufferAttrsCache = bufferAttrs;
    }
    this.setBuffers(gl, bufferAttrs);
    this.setUniforms(gl, program);

    const primitiveType = this.getPrimitiveType(gl);
    const offset = bufferAttrs.offset || 0;

    gl.drawElements(primitiveType, bufferAttrs.numElements, gl.UNSIGNED_SHORT, offset);
  }

  protected setBuffers(gl: WebGLRenderingContext, buffers: BufferAttrs) {
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(buffers.indices), gl.STATIC_DRAW);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffers.a_position.data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.a_positionLocation);
    gl.vertexAttribPointer(this.a_positionLocation, buffers.a_position.numComponents, gl.FLOAT, true, 8, 0);
  }

  public getBufferAttrs(gl: WebGLRenderingContext): BufferAttrs {
    const points = this.points.flatMap(p => p);
    // Magic here! This function returns the indexes of the coordinates for triangle from the source point array.
    const indices = earcut(points);

    return {
      type: 'arrays',
      a_position: {
        numComponents: 2,
        data: new Float32Array(points),
      },
      indices,
      numElements: indices.length,
    };
  }
}
