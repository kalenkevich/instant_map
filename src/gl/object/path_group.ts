import { GlProgramProps } from "./program";
import { GlMultiProgram } from './multi_program';
import { GlPath } from './path';
import { v2 } from './types';

export interface GlPathGroupProps extends GlProgramProps {
  paths: v2[][];
}

export class GlPathGroup extends GlMultiProgram {
  constructor(gl: WebGLRenderingContext, props: GlPathGroupProps) {
    super(gl, props);

    // const points: v2[] = [];
    // for (const path of props.paths) {
    //   points.push(...path);
    // }

    this.subPrograms = props.paths.map(path => new GlPath(gl, {
      color: props.color,
      lineWidth: props.lineWidth,
      rotationInRadians: props.rotationInRadians,
      translation: props.translation,
      scale: props.scale,
      points: path,
    }));

    // this.subPrograms = [
    //   new GlPath(gl, {
    //     color: props.color,
    //     lineWidth: props.lineWidth,
    //     rotationInRadians: props.rotationInRadians,
    //     translation: props.translation,
    //     scale: props.scale,
    //     points,
    //   }),
    // ];
  }
}
