import { BufferBucket } from './buffer/buffer_bucket';
import { WebGl2Object, WebGl2ObjectDrawType } from './objects/object';
import { WebGl2ProgramType, WebGl2Program } from './programs/program';
import { WebGl2DefaultProgram } from './programs/default/default_program';
import { WebGl2LineProgram } from './programs/line/line_program';
import { WebGl2PolygonProgram } from './programs/polygon/polygon_program';

export class WebGl2Painter {
  private readonly gl: WebGL2RenderingContext;
  private readonly programsMap: { [key: number]: WebGl2Program } = {};

  constructor(private readonly canvas: HTMLCanvasElement, private readonly devicePixelRatio: number) {
    this.gl = canvas.getContext('webgl2', {
      antialias: true,
      powerPreference: 'high-performance',
    });
  }

  public init() {
    const gl = this.gl;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    this.clear();
    this.initPrograms();
  }

  public destroy() {}
  public preheat() {}

  public resize(w: number, h: number) {
    const gl = this.gl;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }

  public clear() {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  private initPrograms() {
    const defaultProgram = new WebGl2DefaultProgram(this.gl);
    const lineProgram = new WebGl2LineProgram(this.gl);
    const polygonProgram = new WebGl2PolygonProgram(this.gl);

    this.programsMap[WebGl2ProgramType.default] = defaultProgram;
    this.programsMap[WebGl2ProgramType.line] = lineProgram;
    this.programsMap[WebGl2ProgramType.polygon] = polygonProgram;

    defaultProgram.init();
    lineProgram.init();
    polygonProgram.init();
  }

  public draw(objects: WebGl2Object[]): void {
    if (objects.length === 0) {
      return;
    }

    const gl = this.gl;
    const pointers = [];
    const wasBufferSet: { [prop: string]: boolean } = {};

    // Compile bucket buffer for all objects once!
    const bufferBucket = new BufferBucket();
    for (const object of objects) {
      const buffer = object.getDataBuffer();
      pointers.push(bufferBucket.write(buffer));
    }
    const dataBuffer = bufferBucket.release();

    let currentProgram = null;
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i];
      const pointer = pointers[i];
      const program = this.programsMap[object.programType];
      if (program !== currentProgram) {
        currentProgram = program;
        currentProgram.use();

        if (!wasBufferSet[object.programType]) {
          currentProgram.setDataBuffer(dataBuffer);
          wasBufferSet[object.programType] = true;
        }
      }

      // Set uniforms and buffers.
      currentProgram.setUniforms(object.getUniforms());
      currentProgram.setIndexBuffer(object.getIndexBuffer());
      currentProgram.setPointerOffset(pointer.offset * Float32Array.BYTES_PER_ELEMENT);

      const { primitiveType, drawType, numElements, instanceCount } = object.getDrawAttributes();

      if (drawType === WebGl2ObjectDrawType.ARRAYS) {
        gl.drawArrays(primitiveType, 0, numElements);
      } else if (drawType === WebGl2ObjectDrawType.ELEMENTS) {
        gl.drawElements(primitiveType, numElements, gl.UNSIGNED_SHORT, 0);
      } else if (drawType === WebGl2ObjectDrawType.ARRAYS_INSTANCED) {
        gl.drawArraysInstanced(primitiveType, 0, numElements, instanceCount);
      } else if (drawType === WebGl2ObjectDrawType.ELEMENTS_INSTANCED) {
        gl.drawElementsInstanced(primitiveType, numElements, gl.UNSIGNED_SHORT, 0, instanceCount);
      }
    }

    gl.flush();
  }
}
