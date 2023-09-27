import { ProgramInfo, createProgramInfo, createTexture, setUniforms, drawBufferInfo, setBuffersAndAttributes, FullArraySpec } from 'twgl.js';
import { GlProgram, GlProgramProps } from './program';

export interface GlImageProps extends GlProgramProps {
  width: number;
  height: number;
  image: HTMLImageElement;
}

export class WebGlImage extends GlProgram {
  protected width: number;
  protected height: number;
  image: HTMLImageElement;

  constructor(props: GlImageProps) {
    super(props);

    this.width = props.width;
    this.height = props.height;
    this.image = props.image;
  }

  public draw(gl: WebGLRenderingContext) {
    const programInfo = this.getProgramInfoInstance(gl);
    const uniforms = this.getUniforms(gl);
    const buffers = this.getBufferInfo(gl);

    // Create a texture.
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);

    gl.useProgram(programInfo.program);

    setBuffersAndAttributes(gl, programInfo, buffers);
    setUniforms(programInfo, uniforms);

    drawBufferInfo(gl, buffers, this.getPrimitiveType(gl), 6, 0);
  }

  public getBufferAttrs(gl: WebGLRenderingContext): Record<string, FullArraySpec> {
    return {
      a_position: {
        numComponents: 2,
        normalize: false,
        stride: 0,
        offset: 0,
        drawType: gl.STATIC_DRAW,
        data: new Float32Array([
          0, 0,
          this.width, 0,
          0, this.height,
          0, this.height,
          this.width, 0,
          this.width, this.height,
        ]),
      },
      a_texCoord: {
        numComponents: 2,
        normalize: false,
        stride: 0,
        offset: 0,
        drawType: gl.STATIC_DRAW,
        data: new Float32Array([
          0.0,  0.0,
          1.0,  0.0,
          0.0,  1.0,
          0.0,  1.0,
          1.0,  0.0,
          1.0,  1.0,
      ]),
      }
    };
  }

  public getProgramInfoInstance(gl: WebGLRenderingContext): ProgramInfo {
    return WebGlImage.compile(gl);
  }

  public static programInfo: ProgramInfo;

  public static compile(gl: WebGLRenderingContext): ProgramInfo {
    if (this.programInfo) {
      return this.programInfo;
    }

    this.programInfo = createProgramInfo(gl, [this.getVertexShaderSource(), this.getFragmentShaderSource()]);

    return this.programInfo;
  }

  public static getVertexShaderSource(): string {
    return `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      
      uniform mat3 u_matrix;
      uniform vec2 u_resolution;
      
      varying vec2 v_texCoord;
      
      void main() {
        // Apply tranlation, rotation and scale.
        vec2 position = (u_matrix * vec3(a_position, 1)).xy;

        // Apply resolution.
        vec2 zeroToOne = position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;

        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
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
}
