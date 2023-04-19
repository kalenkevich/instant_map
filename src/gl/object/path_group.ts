import { GlProgramProps } from "./program";
import { GlMultiProgram } from './multi_program';
import { LineStripProgram } from './line';
import { MiterLineCapProgram } from './path';
import { v2 } from '../types';

export interface GlPathGroupProps extends GlProgramProps {
  paths: v2[][];
}

/**
 * Class to group all path objects together and render it faster.
 * Check the draw method desription for more info.
 */
export class GlPathGroup extends GlMultiProgram {
  paths: v2[][];
  subPrograms: [LineStripProgram, MiterLineCapProgram];

  constructor(gl: WebGLRenderingContext, props: GlPathGroupProps) {
    super(gl, props);

    this.paths = props.paths;

    const subProgramProps = {
      color: props.color,
      lineWidth: props.lineWidth,
      rotationInRadians: props.rotationInRadians,
      translation: props.translation,
      scale: props.scale,
      points: [] as v2[],
    };

    this.subPrograms = [
      new LineStripProgram(gl, subProgramProps),
      new MiterLineCapProgram(gl, subProgramProps),
    ];
  }

  /**
   * Optimization to render big list of programs.
   * Idea: Instead of setting new program info each time we set it only once per object type.
   * Then only change buffer/data while each render which is much faster!
   * 
   * We need to loop through the list of paths twice as we need to render all line strips first, 
   * change the program and render all line caps.
   */
  public draw(gl: WebGLRenderingContext) {
    const [lineStripProgram, lineCapProgram] = this.subPrograms;

    // Draw all line strips
    for (const path of this.paths) {
      lineStripProgram.setPoints(path);
      lineStripProgram.draw(gl);
    }

    // Draw all line caps
    for (const path of this.paths) {
      lineCapProgram.setPoints(path);
      lineCapProgram.draw(gl);
    }
  }
}
