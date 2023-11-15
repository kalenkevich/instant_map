import { BufferAttrs, GlProgram, GlProgramProps, GlProgramType, ProgramCache } from './program';

export interface GlImageProps extends GlProgramProps {
  width: number;
  height: number;
  image: HTMLImageElement;
}

export class WebGlImage extends GlProgram {
  type = GlProgramType.IMAGE;

  protected width: number;
  protected height: number;
  image: HTMLImageElement;

  constructor(props: GlImageProps) {
    super(props);

    this.width = props.width;
    this.height = props.height;
    this.image = props.image;
  }

  public vertexShaderSource = `
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

  public fragmentShaderSource = `
    precision mediump float;

    // our texture
    uniform vec4 u_color;
    uniform sampler2D u_image;
    
    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;
    
    void main() {
      gl_FragColor = texture2D(u_image, v_texCoord);
    }
  `;

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

    // Create a texture.
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);

    gl.drawArrays(gl.TRIANGLES, bufferAttrs.offset || 0, bufferAttrs.numElements);
    gl.flush();
  }

  public getBufferAttrs(gl: WebGLRenderingContext): BufferAttrs {
    return {
      type: 'elements',
      a_position: {
        numComponents: 2,
        data: new Float32Array([
          0,
          0,
          this.width,
          0,
          0,
          this.height,
          0,
          this.height,
          this.width,
          0,
          this.width,
          this.height,
        ]),
      },
      a_texCoord: {
        numComponents: 2,
        data: new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
      },
      numElements: 6,
    };
  }

  protected a_positionLocation = 0;
  protected texCoordLocation = 1;
  protected setBuffers(gl: WebGLRenderingContext, buffers: BufferAttrs) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffers.a_position.data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.a_positionLocation);
    gl.vertexAttribPointer(
      this.a_positionLocation,
      buffers.a_position.numComponents,
      gl.FLOAT,
      true,
      0,
      buffers.a_position.offset || 0
    );

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, buffers.a_texCoord.data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.texCoordLocation);
    gl.vertexAttribPointer(
      this.texCoordLocation,
      buffers.a_texCoord.numComponents,
      gl.FLOAT,
      true,
      0,
      buffers.a_texCoord.offset || 0
    );
  }
}
