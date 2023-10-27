import { Font } from 'opentype.js';

import { Arrays, setUniforms } from 'twgl.js';
import { GlProgram, GlProgramProps, GlProgramType, ProgramCache } from '../program';
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

  constructor(props: WebGlTextProps) {
    super(props);

    this.p = props.p;
    this.vector = props.vector;
    this.text = props.text;
    this.font = props.font;
    this.fontSize = props.fontSize;
  }

  public preheat(gl: WebGLRenderingContext) {}

  public draw(gl: WebGLRenderingContext, cache: ProgramCache) {
    const programInfo = this.getProgramInfo(gl, cache);

    if (this.type !== cache.currentProgramType) {
      gl.useProgram(programInfo.program);
      cache.currentProgramType = this.type;
    }

    this.setUniforms(gl, programInfo.program);

    const { indices, vertices, count } = this.getTextBufferAttrs(gl);
    const vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices as Float32Array, gl.STATIC_DRAW);

    const indexData = new Uint16Array(indices);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, true, 8, 0);

    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
    gl.flush();
  }

  public getBufferAttrs(gl: WebGLRenderingContext): Arrays {
    return {};
  }

  private getTextBufferAttrsCache?: TextBufferAttrs;
  public getTextBufferAttrs(gl: WebGLRenderingContext): TextBufferAttrs {
    if (this.getTextBufferAttrsCache) {
      return this.getTextBufferAttrsCache;
    }

    const { indices, vertices } = getVerticiesFromText(this.font, this.text, this.p, this.fontSize);

    return (this.getTextBufferAttrsCache = {
      indices: new Uint16Array(indices),
      vertices,
      count: indices.length,
    });
  }
}