import { GlPainter, GlCircle, GlRectangle, GlTriangle, GlPath, GlPathGroup, GlProgram, GlLine, v2, GL_COLOR_BLACK, GL_COLOR_RED, GlColor } from "./gl";

/**
 * Interface for GridOptions.
 */
export interface RenderGridOptions {
  cellWidth: number;
  cellHeight: number;
  lineWidth?: number;
  lineColor?: GlColor;
}

/**
 * Interface for GridOptions.
 */
export interface RenderLineOptions {
  lineWidth?: number;
  lineColor?: GlColor;
}

/**
 * Render the demo scene with all available objects.
 */
export const renderObjectsDemo = (gl: WebGLRenderingContext) => {
  const cellWidth = 500;
  const cellHeight = 500;
  const grid = getGrid(gl, { cellWidth, cellHeight });

  // cell 1
  const nativeLines = [
    new GlLine(gl, {
      color: GL_COLOR_RED,
      p1: [(cellWidth * 0) + 50, (cellHeight * 0) + 50],
      p2: [(cellWidth * 0) + 450, (cellHeight * 0) + 450],
      lineWidth: 1,
    }),
    new GlLine(gl, {
      color: [0, 1, 0.5, 1],
      p1: [(cellWidth * 0) + 450, (cellHeight * 0) + 50],
      p2: [(cellWidth * 0) + 50, (cellHeight * 0) + 450],
      lineWidth: 1,
    }),
  ];

  // cell 2
  const triangleLines = [
    new GlLine(gl, {
      color: GL_COLOR_RED,
      p1: [(cellWidth * 1) + 50, (cellHeight * 0) + 50],
      p2: [(cellWidth * 1) + 450, (cellHeight * 0) + 450],
      lineWidth: 5,
    }),
    new GlLine(gl, {
      color: [0, 1, 0.5, 1],
      p1: [(cellWidth * 1) + 450, (cellHeight * 0) + 50],
      p2: [(cellWidth * 1) + 50, (cellHeight * 0) + 450],
      lineWidth: 5,
    }),
  ];

  // cell 3
  const rectangle = new GlRectangle(gl, {
    color: [0.3, 0.5, 1, 1],
    p: [(cellWidth * 2) + 50, (cellHeight * 0) + 100],
    width: 400,
    height: 300,
  });

  // cell 4
  const triangle = new GlTriangle(gl, {
    color: [0.7, 1, 0.2, 1],
    p1: [(cellWidth * 3) + 50, (cellHeight * 0) + 50],
    p3: [(cellWidth * 3) + 50, (cellHeight * 0) + 450],
    p2: [(cellWidth * 3) + 450, (cellHeight * 0) + 50],
  });

  // cell 5
  const circle = new GlCircle(gl,{
    color: GL_COLOR_RED,
    p: [(cellWidth * 4) + 250, (cellHeight * 0) + 250],
    radius: 200,
  });
  
  // cell 6
  const path = new GlPath(gl, {
    color: GL_COLOR_BLACK,
    lineWidth: 10,
    points: [
      [(cellWidth * 0) + 50,  (cellHeight * 1) + 50],
      [(cellWidth * 0) + 250, (cellHeight * 1) + 200],
      [(cellWidth * 0) + 330, (cellHeight * 1) + 430],
      [(cellWidth * 0) + 470, (cellHeight * 1) + 250],
      [(cellWidth * 0) + 420, (cellHeight * 1) + 250],
      [(cellWidth * 0) + 50, (cellHeight * 1) + 50],
    ],
  });

  // cell 7
  const rotatedPath = new GlPath(gl, {
    color: GL_COLOR_BLACK,
    lineWidth: 10,
    points: [
      [(cellWidth * 1) + 50,  (cellHeight * 1) + 50],
      [(cellWidth * 1) + 250, (cellHeight * 1) + 200],
      [(cellWidth * 1) + 330, (cellHeight * 1) + 430],
      [(cellWidth * 1) + 470, (cellHeight * 1) + 250],
      [(cellWidth * 1) + 420, (cellHeight * 1) + 250],
      [(cellWidth * 1) + 50, (cellHeight * 1) + 50],
    ],
    translation: [230, -155],
    rotationInRadians: Math.PI / 2,
  });

  // cell 8
  const pathGroup = new GlPathGroup(gl, {
		color: [0.3, 0.5, 1, 1],
		paths: [
      [
        [(cellWidth * 2) + 50,  (cellHeight * 1) + 50],
        [(cellWidth * 2) + 250, (cellHeight * 1) + 200],
        [(cellWidth * 2) + 330, (cellHeight * 1) + 430],
        [(cellWidth * 2) + 470, (cellHeight * 1) + 250],
        [(cellWidth * 2) + 420, (cellHeight * 1) + 250],
        [(cellWidth * 2) + 50, (cellHeight * 1) + 50],
      ],
      [
        [(cellWidth * 2) + 100,  (cellHeight * 1) + 50],
        [(cellWidth * 2) + 320, (cellHeight * 1) + 250],
        [(cellWidth * 2) + 370, (cellHeight * 1) + 250],
        [(cellWidth * 2) + 230, (cellHeight * 1) + 430],
        [(cellWidth * 2) + 150, (cellHeight * 1) + 200],
        [(cellWidth * 2) + 100, (cellHeight * 1) + 50],
      ]
    ],
		lineWidth: 5,
  });

  const painter = new GlPainter(gl, [
    ...grid,
    ...nativeLines,
    ...triangleLines,
    triangle,
    rectangle,
    // circle,
    path,
    rotatedPath,
    pathGroup,
  ]);

  painter.init();
  painter.draw();
};

/**
 * Returns the list of lines to be rendered as a grid.
 */
export const getGrid = (gl: WebGLRenderingContext, options: RenderGridOptions): GlProgram[] => {
  const grid: GlProgram[] = [];
  const canvasWidth = gl.canvas.width;
  const canvasHeight = gl.canvas.height;
  const w = Math.floor(canvasWidth / options.cellWidth);
  const h = Math.floor(canvasHeight / options.cellHeight);

  for (let i = 0; i <= w; i++) {
    const x = options.cellWidth * i;

    grid.push(new GlLine(gl, {
      p1: [x, 0] as v2,
      p2: [x, canvasHeight] as v2,
      color: options.lineColor ?? GL_COLOR_BLACK,
      lineWidth: options.lineWidth ?? 1,
    }));
  }

  for (let i = 0; i <= h; i++) {
    const y = options.cellHeight * i;

    grid.push(new GlLine(gl, {
      p1: [0, y] as v2,
      p2: [canvasWidth, y] as v2,
      color: options.lineColor ?? GL_COLOR_BLACK,
      lineWidth: options.lineWidth ?? 1,
    }));
  }

  return grid;
};