import { BufferInfo, ProgramInfo, createProgramInfo, createBufferInfoFromArrays, setUniforms, drawBufferInfo, setBuffersAndAttributes } from 'twgl.js';
import { GlProgram, GlProgramProps, GlUniforms } from './program';
import { v2 } from '../types';

export interface GlImageProps extends GlProgramProps {
  p: v2;
  width: number;
  height: number;
  image: HTMLImageElement;
}

export class WebGlImage extends GlProgram {
  protected p: v2;
  protected width: number;
  protected height: number;
  image: HTMLImageElement;

  constructor(props: GlImageProps) {
    super(props);

    this.p = props.p;
    this.width = props.width;
    this.height = props.height;
    this.image = props.image;
  }

  public draw(gl: WebGLRenderingContext) {
    const programInfo = this.getProgramInfoInstance(gl);
    const buffer = this.getBufferInfo(gl);
    const uniforms = this.getUniforms(gl);

    setBuffersAndAttributes(gl, programInfo, buffer);

    setUniforms(programInfo, uniforms);

    const { offset, vertexCount, instanceCount } = this.getDrawBufferInfoOptions();
    drawBufferInfo(gl, buffer, this.getPrimitiveType(gl), vertexCount, offset, instanceCount);
  }

  public getBufferAttrs(gl: WebGLRenderingContext): Record<string, any> {
    return {

    };
  }

  public getUniforms(gl: WebGLRenderingContext): GlUniforms {
    return {
      u_width: this.lineWidth,
      u_color: this.color,
      u_resolution: [gl.canvas.width, gl.canvas.height],
      u_matrix: this.getMatrix(),
    };
  }

  // Render basic lines with triangles.
  public static getVertexShaderSource(...args: any[]): string {
    return `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      
      uniform vec2 u_resolution;
      
      varying vec2 v_texCoord;
      
      void main() {
        // convert the rectangle from pixels to 0.0 to 1.0
        vec2 zeroToOne = a_position / u_resolution;
      
        // convert from 0->1 to 0->2
        vec2 zeroToTwo = zeroToOne * 2.0;
      
        // convert from 0->2 to -1->+1 (clipspace)
        vec2 clipSpace = zeroToTwo - 1.0;
      
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      
        // pass the texCoord to the fragment shader
        // The GPU will interpolate this value between points.
        v_texCoord = a_texCoord;
      }
    `;
  }

  public static getFragmentShaderSource(): string {
    return `
      precision mediump float;

      // our texture
      uniform sampler2D u_image;
      uniform vec2 u_textureSize;
      
      // the texCoords passed in from the vertex shader.
      varying vec2 v_texCoord;
      
      void main() {
        vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
        gl_FragColor = (
            texture2D(u_image, v_texCoord) +
            texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.0)) +
            texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0))) / 3.0;
      }
    `;
  }

  setRectangle(gl: WebGLRenderingContext) {
    var x1 = this.p[0];
    var x2 = this.p[0] + this.width;
    var y1 = this.p[1];
    var y2 = this.p[1] + this.height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
       x1, y1,
       x2, y1,
       x1, y2,
       x1, y2,
       x2, y1,
       x2, y2,
    ]), gl.STATIC_DRAW);
  }
}