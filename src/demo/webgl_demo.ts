import turf from 'turf';
import {
  WebGlArea,
  WebGlPainter,
  WebGlCircle,
  WebGlRectangle,
  WebGlTriangle,
  GlProgram,
  WebGlLine,
  v2,
  GL_COLOR_BLACK,
  GL_COLOR_RED,
  GlColor,
} from '../webgl';

/**
 * Interface for GridOptions.
 */
export interface RenderGridOptions {
  width: number;
  height: number;
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

const ANTARCTIDA_POINTS: v2[] = [
  [1390, 2985],
  [1397, 2991],
  [1393, 3000],
  [1376, 3013],
  [1358, 3012],
  [1342, 3025],
  [1335, 3043],
  [1341, 3063],
  [1323, 3072],
  [1301, 3114],
  [1311, 3137],
  [1329, 3154],
  [1348, 3217],
  [1357, 3294],
  [1350, 3332],
  [1343, 3346],
  [1328, 3351],
  [1316, 3381],
  [1254, 3426],
  [1245, 3446],
  [1169, 3450],
  [1173, 3469],
  [1203, 3493],
  [1210, 3512],
  [1197, 3529],
  [1178, 3523],
  [1161, 3538],
  [1160, 3585],
  [1191, 3653],
  [1215, 3664],
  [1272, 3729],
  [1300, 3741],
  [1328, 3762],
  [1369, 3814],
  [1386, 3890],
  [1399, 3857],
  [1438, 3804],
  [1482, 3760],
  [1510, 3759],
  [1538, 3770],
  [1561, 3789],
  [1568, 3754],
  [1584, 3732],
  [1613, 3730],
  [1657, 3698],
  [1706, 3676],
  [1723, 3659],
  [1710, 3613],
  [1710, 3589],
  [1642, 3601],
  [1641, 3535],
  [1646, 3523],
  [1681, 3498],
  [1719, 3448],
  [1758, 3429],
  [1792, 3420],
  [1849, 3375],
  [1869, 3348],
  [1873, 3332],
  [1861, 3322],
  [1865, 3305],
  [1908, 3264],
  [1931, 3223],
  [1944, 3225],
  [1950, 3237],
  [1964, 3238],
  [1970, 3211],
  [1982, 3214],
  [1985, 3228],
  [1999, 3230],
  [2028, 3219],
  [2040, 3221],
  [2045, 3236],
  [2058, 3224],
  [2119, 3195],
  [2136, 3176],
  [2145, 3184],
  [2156, 3180],
  [2171, 3208],
  [2184, 3201],
  [2201, 3178],
  [2216, 3180],
  [2220, 3193],
  [2229, 3180],
  [2242, 3176],
  [2292, 3182],
  [2305, 3203],
  [2317, 3197],
  [2356, 3195],
  [2412, 3168],
  [2433, 3131],
  [2445, 3136],
  [2459, 3155],
  [2471, 3152],
  [2488, 3172],
  [2499, 3164],
  [2503, 3150],
  [2525, 3134],
  [2577, 3104],
  [2588, 3107],
  [2605, 3089],
  [2625, 3082],
  [2637, 3064],
  [2668, 3052],
  [2689, 3057],
  [2716, 3094],
  [2730, 3098],
  [2747, 3114],
  [2758, 3116],
  [2777, 3098],
  [2832, 3114],
  [2841, 3154],
  [2839, 3169],
  [2820, 3190],
  [2821, 3203],
  [2834, 3202],
  [2821, 3244],
  [2830, 3255],
  [2843, 3259],
  [2856, 3253],
  [2888, 3175],
  [2931, 3162],
  [2948, 3126],
  [2982, 3097],
  [3035, 3090],
  [3049, 3063],
  [3059, 3085],
  [3068, 3090],
  [3120, 3089],
  [3138, 3097],
  [3171, 3089],
  [3183, 3093],
  [3218, 3045],
  [3256, 3084],
  [3302, 3077],
  [3319, 3061],
  [3341, 3054],
  [3363, 3077],
  [3376, 3076],
  [3411, 3094],
  [3423, 3092],
  [3440, 3073],
  [3450, 3071],
  [3513, 3079],
  [3536, 3069],
  [3581, 3063],
  [3585, 3038],
  [3602, 3080],
  [3612, 3085],
  [3703, 3084],
  [3717, 3113],
  [3741, 3128],
  [3783, 3143],
  [3796, 3143],
  [3803, 3133],
  [3832, 3159],
  [3859, 3166],
  [3886, 3199],
  [3952, 3208],
  [3988, 3228],
  [3996, 3238],
  [3974, 3313],
  [3959, 3320],
  [3952, 3334],
  [3938, 3343],
  [3917, 3390],
  [3909, 3427],
  [3908, 3467],
  [3922, 3527],
  [3944, 3534],
  [3948, 3559],
  [3910, 3581],
  [3889, 3583],
  [3866, 3701],
  [3881, 3726],
  [3897, 3787],
  [3911, 3815],
  [3944, 3872],
  [3970, 3902],
  [3975, 3952],
  [4008, 3975],
  [4019, 4017],
  [4050, 3988],
  [4096, 4053],
  [4096, 4096],
  [419, 4096],
  [422, 4035],
  [377, 4031],
  [341, 4003],
  [331, 3960],
  [301, 3937],
  [311, 3820],
  [309, 3786],
  [290, 3764],
  [281, 3736],
  [264, 3713],
  [291, 3717],
  [317, 3705],
  [334, 3730],
  [373, 3682],
  [382, 3659],
  [378, 3631],
  [347, 3595],
  [281, 3578],
  [250, 3518],
  [246, 3458],
  [262, 3479],
  [299, 3467],
  [308, 3490],
  [326, 3484],
  [368, 3443],
  [386, 3438],
  [385, 3387],
  [399, 3379],
  [406, 3394],
  [436, 3374],
  [468, 3368],
  [510, 3340],
  [526, 3346],
  [543, 3340],
  [558, 3347],
  [574, 3346],
  [589, 3341],
  [621, 3349],
  [670, 3349],
  [686, 3347],
  [711, 3328],
  [726, 3337],
  [752, 3316],
  [770, 3357],
  [782, 3345],
  [796, 3361],
  [824, 3378],
  [855, 3368],
  [903, 3383],
  [909, 3364],
  [896, 3335],
  [881, 3332],
  [868, 3272],
  [920, 3284],
  [937, 3309],
  [952, 3312],
  [996, 3294],
  [1008, 3303],
  [1023, 3300],
  [1033, 3270],
  [1042, 3287],
  [1055, 3294],
  [1069, 3291],
  [1079, 3306],
  [1121, 3321],
  [1134, 3292],
  [1146, 3308],
  [1161, 3304],
  [1181, 3326],
  [1196, 3322],
  [1219, 3303],
  [1275, 3279],
  [1284, 3251],
  [1268, 3170],
  [1281, 3120],
  [1277, 3096],
  [1324, 3027],
  [1390, 2985],
];
const polygon = turf.polygon([ANTARCTIDA_POINTS]);
const centroid = turf.centroid(polygon);
ANTARCTIDA_POINTS.unshift(centroid.geometry.coordinates as v2);

/**
 * Render the demo scene with all available objects.
 */
export const renderObjectsDemo = (canvas: HTMLCanvasElement) => {
  const cellWidth = 500;
  const cellHeight = 500;
  const grid = getGrid({
    width: canvas.width,
    height: canvas.height,
    cellWidth,
    cellHeight,
  });

  const nativeLines = [
    new WebGlLine({
      color: GL_COLOR_RED,
      p1: [0, 0],
      p2: [400, 400],
      lineWidth: 1,
      translation: [cellWidth * 0 + 250, cellHeight * 0 + 250],
      origin: [-200, -200],
    }),
    new WebGlLine({
      color: [0, 1, 0.5, 1],
      p1: [400, 0],
      p2: [0, 400],
      translation: [cellWidth * 0 + 250, cellHeight * 0 + 250],
      origin: [-200, -200],
      lineWidth: 1,
    }),
  ];

  const triangleLines = [
    new WebGlLine({
      color: GL_COLOR_RED,
      p1: [0, 0],
      p2: [400, 400],
      translation: [cellWidth * 1 + 250, cellHeight * 0 + 250],
      origin: [-200, -200],
      lineWidth: 5,
    }),
    new WebGlLine({
      color: [0, 1, 0.5, 1],
      p1: [400, 0],
      p2: [0, 400],
      translation: [cellWidth * 1 + 250, cellHeight * 0 + 250],
      origin: [-200, -200],
      lineWidth: 5,
    }),
  ];

  const rectangle = new WebGlRectangle({
    color: [0.3, 0.5, 1, 1],
    p: [0, 0],
    translation: [cellWidth * 2 + 250, cellHeight * 0 + 200],
    origin: [-200, -150],
    width: 400,
    height: 300,
  });
  const rotatedRectangle = new WebGlRectangle({
    color: [0.3, 0.5, 1, 1],
    p: [0, 0],
    translation: [cellWidth * 3 + 250, cellHeight * 0 + 200],
    origin: [-200, -150],
    width: 400,
    height: 300,
  });

  const triangle = new WebGlTriangle({
    color: [0.7, 1, 0.2, 1],
    p1: [50, 50],
    p3: [50, 450],
    p2: [450, 50],
    translation: [cellWidth * 4 + 200, cellHeight * 0 + 200],
    origin: [-200, -200],
    scale: [1, 1],
  });

  const rotatedTriangle = new WebGlTriangle({
    color: [0.7, 1, 0.2, 1],
    p1: [50, 50],
    p3: [50, 450],
    p2: [450, 50],
    translation: [cellWidth * 5 + 200, cellHeight * 0 + 200],
    origin: [-200, -200],
    scale: [1, 1],
  });

  const circle = new WebGlCircle({
    color: GL_COLOR_RED,
    p: [250, 250],
    radius: 200,
    translation: [cellWidth * 0 + 200, cellHeight * 1 + 200],
    origin: [-200, -200],
    components: 36,
  });

  const rotatedCircle = new WebGlCircle({
    color: GL_COLOR_RED,
    p: [250, 250],
    radius: 10,
    translation: [cellWidth * 1 + 20, cellHeight * 1 + 20],
    origin: [-20, -20],
    components: 24,
  });

  const area = new WebGlArea({
    points: ANTARCTIDA_POINTS,
    translation: [cellWidth * 0, cellHeight * 0],
    color: GL_COLOR_RED,
    scale: [1 / (window.devicePixelRatio * 2), 1 / (window.devicePixelRatio * 2)],
  });

  const renderScene = () => {
    // for (const line of triangleLines) {
    //   line.setRotationInRadians(line.getRotationInRadians() + 0.1);
    // }
    // rotatedRectangle.setRotationInRadians(rotatedRectangle.getRotationInRadians() + 0.1);
    // rotatedRectangle.setRotationInRadians(rotatedRectangle.getRotationInRadians() + 0.1);
    // rotatedTriangle.setRotationInRadians(rotatedTriangle.getRotationInRadians() + 0.1);
    // rotatedPath.setRotationInRadians(rotatedPath.getRotationInRadians() + 0.1);

    //painter.clear();

    painter.draw([
      // ...grid,
      // ...nativeLines,
      // ...triangleLines,
      // rectangle,
      // rotatedRectangle,
      // triangle,
      // rotatedTriangle,
      // circle,
      // rotatedCircle,
      // path,
      // rotatedPath,
      // pathGroup,
      area,
    ]);

    requestAnimationFrame(renderScene);
  };

  const painter = new WebGlPainter(canvas, window.devicePixelRatio);

  painter.init();

  renderScene();
};

/**
 * Returns the list of lines to be rendered as a grid.
 */
export const getGrid = (options: RenderGridOptions): GlProgram[] => {
  const grid: GlProgram[] = [];
  const canvasWidth = options.width;
  const canvasHeight = options.height;
  const w = Math.floor(canvasWidth / options.cellWidth);
  const h = Math.floor(canvasHeight / options.cellHeight);

  for (let i = 0; i <= w; i++) {
    const x = options.cellWidth * i;

    grid.push(
      new WebGlLine({
        p1: [x, 0] as v2,
        p2: [x, canvasHeight] as v2,
        color: options.lineColor ?? GL_COLOR_BLACK,
        lineWidth: options.lineWidth ?? 1,
      })
    );
  }

  for (let i = 0; i <= h; i++) {
    const y = options.cellHeight * i;

    grid.push(
      new WebGlLine({
        p1: [0, y] as v2,
        p2: [canvasWidth, y] as v2,
        color: options.lineColor ?? GL_COLOR_BLACK,
        lineWidth: options.lineWidth ?? 1,
      })
    );
  }

  return grid;
};
