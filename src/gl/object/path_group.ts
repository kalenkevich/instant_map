import { GlProgram, GlObjectProps, v2 } from "./program";

export interface GlPathGroupProps extends GlObjectProps {
  paths: v2[][];
}

export class GlPathGroup extends GlProgram {
  protected paths: v2[][];

  constructor(gl: WebGLRenderingContext, props: GlPathGroupProps) {
    super(gl, props);

    this.paths = props.paths;
  }

  public get primitiveType(): GLenum {
    return this.gl.LINES;
  }

  public getBufferAttrs(): Record<string, any> {
    const points = [];

    for (const path of this.paths) {
      for (let i = 1; i < path.length; i++) {
        points.push(path[i - 1]);
        points.push(path[i]);
      }
    }

    return {
      a_position: {
        numComponents: 2,
        data: points.flatMap(p => p),
      },
    };
  }
}
