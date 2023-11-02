import { BufferBucket } from './buffer/buffer_bucket';
import { WebGl2Object, WebGl2ObjectDrawType } from './objects/object';
import { WebGl2ProgramType, WebGl2Program } from './programs/program';
import { WebGl2ProgramDefault } from './programs/default/default_program';

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

    this.initPrograms();
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    this.clear();
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
    const defaultProgram = new WebGl2ProgramDefault(this.gl);

    this.programsMap[WebGl2ProgramType.default] = defaultProgram;

    defaultProgram.init();
  }

  public draw(objects: WebGl2Object[]): void {
    if (objects.length === 0) {
      return;
    }

    const gl = this.gl;
    // One buffer to rule them all!
    const bucket = new BufferBucket();

    // Compile bucket buffer
    const objWithBuffer = objects.map(obj => ({
      obj,
      ptr: obj.bufferDataToBucket(bucket),
    }));

    let currentProgramType = objects[0].programType;
    let currentProgram = this.programsMap[currentProgramType];
    currentProgram.use();
    currentProgram.setBuffer(bucket.getBuffer());

    for (let objectIndex = 0; objectIndex < objects.length; objectIndex++) {
      const { obj, ptr } = objWithBuffer[objectIndex];

      const program = this.programsMap[obj.programType];
      if (program !== currentProgram) {
        currentProgram = program;
        currentProgram.use();
        currentProgram.setBuffer(bucket.getBuffer());
      }

      const { numElements, instanceCount } = obj.getDrawAttributes();

      const offset = Float32Array.BYTES_PER_ELEMENT * ptr.offset;

      // Set uniforms.
      currentProgram.setUniforms(obj.getUniforms());

      if (obj.drawType === WebGl2ObjectDrawType.ARRAYS) {
        gl.drawArrays(obj.primitiveType, offset, numElements);
      } else if (obj.drawType === WebGl2ObjectDrawType.ELEMENTS) {
        gl.drawElements(obj.primitiveType, numElements, gl.UNSIGNED_SHORT, offset);
      } else if (obj.drawType === WebGl2ObjectDrawType.ARRAYS_INSTANCED) {
        gl.drawArraysInstanced(obj.primitiveType, offset, numElements, instanceCount);
      } else if (obj.drawType === WebGl2ObjectDrawType.ELEMENTS_INSTANCED) {
        gl.drawElementsInstanced(obj.primitiveType, numElements, gl.UNSIGNED_SHORT, offset, instanceCount);
      }
    }

    gl.flush();
  }
}
