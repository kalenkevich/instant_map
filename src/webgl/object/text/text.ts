import { Font } from 'opentype.js';

import { GlProgram, GlProgramProps, GlProgramType, ProgramCache, BufferAttrs } from '../program';
import { v2 } from '../../types';
import { getVerticiesFromText } from './text_utils';

export interface WebGlTextProps extends GlProgramProps {
  p: v2;
  vector?: v2;
  text: string;
  font: Font;
  fontSize: number;
}

interface TextBufferAttrs {
  indices: Uint16Array;
  vertices: Float32Array;
  count: number;
}

export class WebGlText extends GlProgram {
  type = GlProgramType.TEXT;

  protected p: v2;
  protected vector?: v2;
  protected text: string;
  protected font: Font;
  protected fontSize: number;

  protected textBufferAttrsCache?: TextBufferAttrs;

  constructor(props: WebGlTextProps) {
    super(props);

    this.p = props.p;
    this.vector = props.vector;
    this.text = props.text;
    this.font = props.font;
    this.fontSize = props.fontSize;
  }

  public preheat(gl: WebGLRenderingContext, cache: ProgramCache) {
    const program = this.getProgram(gl, cache);

    this.textBufferAttrsCache = this.getTextBufferAttrs(gl);
    this.setUniforms(gl, program);
  }

  public draw(gl: WebGLRenderingContext, cache: ProgramCache) {
    const program = this.getProgram(gl, cache);
    if (this.type !== cache.currentProgramType) {
      gl.useProgram(program);
      cache.currentProgramType = this.type;
    }

    const buffers = this.textBufferAttrsCache || this.getTextBufferAttrs(gl);
    if (!this.textBufferAttrsCache) {
      this.textBufferAttrsCache = buffers;
    }
    this.setTextBuffers(gl, buffers);
    this.setUniforms(gl, program);

    gl.drawElements(gl.TRIANGLES, buffers.count, gl.UNSIGNED_SHORT, 0);
  }

  public getTextBufferAttrs(gl: WebGLRenderingContext): TextBufferAttrs {
    const { indices, vertices } = getVerticiesFromText(this.font, this.text, this.p, this.fontSize);

    return {
      indices: new Uint16Array(indices),
      vertices,
      count: indices.length,
    };
  }

  public setTextBuffers(gl: WebGLRenderingContext, textBuffers: TextBufferAttrs) {
    const { indices, vertices, count } = textBuffers;

    const vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices as Float32Array, gl.STATIC_DRAW);

    const indexData = new Uint16Array(indices);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, true, 8, 0);
  }

  public getBufferAttrs(gl: WebGLRenderingContext): BufferAttrs {
    throw new Error('Method not implemented.');
  }
}
