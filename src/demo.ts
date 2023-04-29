import {
  GlArea,
  GlPainter,
  GlCircle,
  GlRectangle,
  GlTriangle,
  GlPath,
  GlPathGroup,
  GlProgram,
  GlLine,
  v2,
  GL_COLOR_BLACK,
  GL_COLOR_RED,
  GlColor,
} from "./gl";

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

  const nativeLines = [
    new GlLine(gl, {
      color: GL_COLOR_RED,
      p1: [0, 0],
      p2: [400, 400],
      lineWidth: 1,
      translation: [(cellWidth * 0) + 250, (cellHeight * 0) + 250],
      origin: [-200, -200],
    }),
    new GlLine(gl, {
      color: [0, 1, 0.5, 1],
      p1: [400, 0],
      p2: [0, 400],
      translation: [(cellWidth * 0) + 250, (cellHeight * 0) + 250],
      origin: [-200, -200],
      lineWidth: 1,
    }),
  ];

  const triangleLines = [
    new GlLine(gl, {
      color: GL_COLOR_RED,
      p1: [0, 0],
      p2: [400, 400],
      translation: [(cellWidth * 1) + 250, (cellHeight * 0) + 250],
      origin: [-200, -200],
      lineWidth: 5,
    }),
    new GlLine(gl, {
      color: [0, 1, 0.5, 1],
      p1: [400, 0],
      p2: [0, 400],
      translation: [(cellWidth * 1) + 250, (cellHeight * 0) + 250],
      origin: [-200, -200],
      lineWidth: 5,
    }),
  ];

  const rectangle = new GlRectangle(gl, {
    color: [0.3, 0.5, 1, 1],
    p: [0, 0],
    translation: [(cellWidth * 2) + 250, (cellHeight * 0) + 200],
    origin: [-200, -150],
    width: 400,
    height: 300,
  });
  const rotatedRectangle = new GlRectangle(gl, {
    color: [0.3, 0.5, 1, 1],
    p: [0, 0],
    translation: [(cellWidth * 3) + 250, (cellHeight * 0) + 200],
    origin: [-200, -150],
    width: 400,
    height: 300,
  });

  const triangle = new GlTriangle(gl, {
    color: [0.7, 1, 0.2, 1],
    p1: [50, 50],
    p3: [50, 450],
    p2: [450, 50],
    translation: [(cellWidth * 4) + 200, (cellHeight * 0) + 200],
    origin: [-200, -200],
    scale: [1, 1],
  });

  const rotatedTriangle = new GlTriangle(gl, {
    color: [0.7, 1, 0.2, 1],
    p1: [50, 50],
    p3: [50, 450],
    p2: [450, 50],
    translation: [(cellWidth * 5) + 200, (cellHeight * 0) + 200],
    origin: [-200, -200],
    scale: [1, 1],
  });

  const circle = new GlCircle(gl,{
    color: GL_COLOR_RED,
    p: [250, 250],
    radius: 200,
    translation: [(cellWidth * 0) + 400, (cellHeight * 1) + 400],
    origin: [-200, -200],
    components: 36,
  });

  const rotatedCircle = new GlCircle(gl,{
    color: GL_COLOR_RED,
    p: [250, 250],
    radius: 10,
    translation: [(cellWidth * 1) + 40, (cellHeight * 1) + 40],
    origin: [-20, -20],
    components: 24,
  });

  const path = new GlPath(gl, {
    color: GL_COLOR_BLACK,
    lineWidth: 10,
    points: [
      [50,  50],
      [250, 200],
      [330, 430],
      [470, 250],
      [420, 250],
      [50, 50],
    ],
    origin: [-210, -140],
    translation: [(cellWidth * 2) + 210, (cellHeight * 1) + 140],
  });

  const rotatedPath = new GlPath(gl, {
    color: GL_COLOR_BLACK,
    lineWidth: 10,
    points: [
      [50,  50],
      [250, 200],
      [330, 430],
      [470, 250],
      [420, 250],
      [50, 50],
    ],
    origin: [-210, -140],
    translation: [(cellWidth * 3) + 210, (cellHeight * 1) + 140],
  });

  const pathGroup = new GlPathGroup(gl, {
		color: [0.3, 0.5, 1, 1],
		paths: [
      [
        [50, 50],
        [250, 200],
        [330, 430],
        [470, 250],
        [420, 250],
        [50, 50],
      ],
      [
        [100, 50],
        [320, 250],
        [370, 250],
        [230, 430],
        [150, 200],
        [100, 50],
      ]
    ],
    origin: [-210, -140],
    translation: [(cellWidth * 4), (cellHeight * 1)],
		lineWidth: 5,
  });

  const area = new GlArea(gl, {
    points: [
      [50, 150],
      [150, 50],
      [350, 100],
      [450, 250],
      [350, 320],
      [200, 350],
      [100 ,360],
      [50, 250],
    ],
    translation: [(cellWidth * 5), (cellHeight * 1)],
    color: GL_COLOR_RED,
  });

  const renderScene = () => {
    // for (const line of triangleLines) {
    //   line.setRotationInRadians(line.getRotationInRadians() + 0.1);
    // }
    // rotatedRectangle.setRotationInRadians(rotatedRectangle.getRotationInRadians() + 0.1);
    // rotatedRectangle.setRotationInRadians(rotatedRectangle.getRotationInRadians() + 0.1);
    // rotatedTriangle.setRotationInRadians(rotatedTriangle.getRotationInRadians() + 0.1);
    // rotatedPath.setRotationInRadians(rotatedPath.getRotationInRadians() + 0.1);

    painter.clear();
    painter.draw();

    // requestAnimationFrame(renderScene);
  };

  const painter = new GlPainter(gl, [
    ...grid,
    ...nativeLines,
    ...triangleLines,
    rectangle,
    rotatedRectangle,
    triangle,
    rotatedTriangle,
    circle,
    rotatedCircle,
    path,
    rotatedPath,
    pathGroup,
    area,
  ]);

  painter.init();

  renderScene();
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