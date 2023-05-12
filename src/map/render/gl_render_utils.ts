import {
  GlProgram,
  GlLine,
  GL_COLOR_BLACK,
  GL_COLOR_RED,
  GL_COLOR_LIME,
  GL_COLOR_BLUE,
  GlColor,
} from '../../gl';

export const ZoomColorMap: { [prop: string]: GlColor } = {
  '0': GL_COLOR_BLACK,
  '1': GL_COLOR_RED,
  '2': GL_COLOR_BLUE,
  '3': GL_COLOR_LIME,
  '4': GL_COLOR_BLACK,

  '5': GL_COLOR_RED,
  '6': GL_COLOR_BLUE,
  '7': GL_COLOR_LIME,
  '8': GL_COLOR_BLACK,

  '9': GL_COLOR_RED,
  '10': GL_COLOR_BLUE,
  '11': GL_COLOR_LIME,
  '12': GL_COLOR_BLACK,

  '13': GL_COLOR_RED,
  '14': GL_COLOR_BLUE,
  '15': GL_COLOR_LIME,
  '16': GL_COLOR_BLACK,

  17: GL_COLOR_RED,
  18: GL_COLOR_BLUE,
  19: GL_COLOR_LIME,
  20: GL_COLOR_BLACK,

  '21': GL_COLOR_RED,
  '22': GL_COLOR_BLUE,
  '23': GL_COLOR_LIME,
  '24': GL_COLOR_BLACK,
};

/**
 * Return the sample grid (development/debug purpose only).
 * @param gl WebGLRenderingContext
 * @param options zoom and center of the map view. 
 * @returns 
 */
export const getMapSampleGrid = (
  gl: WebGLRenderingContext,
  { zoom, center }: { zoom: number; center: [number, number] },
): GlProgram[] => {
  const grid: GlProgram[] = [];

  const generateCenterLines = (
    startX: number,
    startY: number,
    width: number,
    height: number,
    deepLevel: number,
  ) => {
    if (deepLevel > zoom) {
      return;
    }

    const scale = Math.max((zoom - Math.round(zoom)) * 2, 1);

    const horizontalLine = new GlLine(gl, {
      color: ZoomColorMap[deepLevel.toString()] as GlColor,
      p1: [startX, startY + height / 2],
      p2: [startX + width, startY + height / 2],
      lineWidth: Math.max(25 - (deepLevel * 4), 1),
      translation: center,
      scale: [scale, scale],
      //origin: [-(startX + width), -(startY + height)]
    });
    const verticalLine = new GlLine(gl, {
      color: ZoomColorMap[deepLevel.toString()] as GlColor,
      p1: [startX + width / 2, startY],
      p2: [startX + width / 2, startY + height],
      lineWidth: Math.max(25 - (deepLevel * 5), 1),
      translation: center,
      scale: [scale, scale],
      //origin: [-(startX + width), -(startY + height)]
    });

    grid.push(horizontalLine, verticalLine);

    generateCenterLines(startX, startY, width / 2, height / 2, deepLevel + 1);
    generateCenterLines(startX + width / 2, startY, width / 2, height / 2, deepLevel + 1);
    generateCenterLines(startX, startY + height / 2, width / 2, height / 2, deepLevel + 1);
    generateCenterLines(startX + width / 2, startY + height / 2, width / 2, height / 2, deepLevel + 1);
  };

  generateCenterLines(0, 0, gl.canvas.width, gl.canvas.height, 0);

  return grid;
}
