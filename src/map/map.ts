import {
  GlProgram,
  GlPainter,
  GlLine,
  GL_COLOR_BLACK,
  GL_COLOR_RED,
  GL_COLOR_LIME,
  GL_COLOR_BLUE,
  GlColor,
} from '../gl';
import { throttle } from './utils';

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

export interface MapOptions {
  zoom?: number;
  center?: [number, number];
  tilesUrl?: string;
}

export class GlideMap {
  gl: WebGLRenderingContext;
  
  zoom: number;

  center: [number, number];

  get state() {
    return {
      zoom: this.zoom,
      center: this.center,
    }
  }

  constructor(gl: WebGLRenderingContext, options: MapOptions = {}) {
    this.gl = gl;
    this.zoom = options.zoom || 0;
    this.center = options.center || [0, 0] as [number, number];

    this.init();
  }

  init() {
    this.subscribeOnGlEvents();
    this.rerenderMap();
  }

  subscribeOnGlEvents() {
    this.gl.canvas.addEventListener('click', throttle((clickEvent: MouseEvent) => this.onClickEvent(clickEvent), 50));
    this.gl.canvas.addEventListener('wheel', throttle((wheelEvent: WheelEvent) => this.onWheelEvent(wheelEvent), 200));

    // drag events
    this.gl.canvas.addEventListener('mousedown', throttle((mouseDownEvent: MouseEvent) => this.onMouseDownEvent(mouseDownEvent), 50));
    this.gl.canvas.addEventListener('mousemove', throttle((mouseMoveEvent: MouseEvent) => this.onMouseMove(mouseMoveEvent), 0));
    this.gl.canvas.addEventListener('mouseup', throttle((mouseUpEvent: MouseEvent) => this.onMouseUpEvent(mouseUpEvent), 50));
  }

  onClickEvent(clickEvent: MouseEvent) {
    console.log('clickEvent', clickEvent, this.state);
  }
  
  onWheelEvent(wheelEvent: WheelEvent) {
    console.log('wheelEvent', wheelEvent, this.state);

    if (wheelEvent.deltaY < 0) {
      this.zoom += Math.abs(wheelEvent.deltaY / 25);
      this.zoom = Math.min(this.zoom, 24);
      this.zoom = Number(this.zoom.toFixed(4));
    } else {
      this.zoom -= Math.abs(wheelEvent.deltaY / 25);
      this.zoom = Math.max(this.zoom, 0);
      this.zoom = Number(this.zoom.toFixed(4));
    }

    this.rerenderMap();
  }

  dragStarted = false;
  dragStartX = 0;
  dragStartY = 0;

  onMouseDownEvent(mouseDownEvent: MouseEvent) {
    console.log('mouseDownEvent', mouseDownEvent, this.state);
    this.dragStarted = true;

    this.dragStartX = mouseDownEvent.x;
    this.dragStartY = mouseDownEvent.y;
  }

  onMouseMove(mouseMoveEvent: MouseEvent) {
    if (this.dragStarted) {
      console.log('mouseMoveEvent', mouseMoveEvent, this.state);

      this.center = [
        this.center[0] + (mouseMoveEvent.x - this.dragStartX) / 40,
        this.center[1] + (mouseMoveEvent.y - this.dragStartY) / 40,
      ];
      this.rerenderMap();
    }
  }

  onMouseUpEvent(mouseUpEvent: MouseEvent) {
    console.log('mouseUpEvent', mouseUpEvent, this.state);
    this.dragStarted = false;
  }

  rerenderMap() {
    const painter = new GlPainter(this.gl, []);

    const renderScene = () => {
      const grid: GlProgram[] = [];

      const generateCenterLines = (
        startX: number,
        startY: number,
        width: number,
        height: number,
        deepLevel: number,
      ) => {
        if (deepLevel > this.zoom) {
          return;
        }

        const horizontalLine = new GlLine(this.gl, {
          color: ZoomColorMap[deepLevel.toString()] as GlColor,
          p1: [startX, startY + height / 2],
          p2: [startX + width, startY + height / 2],
          lineWidth: Math.max(25 - (deepLevel * 4), 1),
          translation: this.center,
        });
        const verticalLine = new GlLine(this.gl, {
          color: ZoomColorMap[deepLevel.toString()] as GlColor,
          p1: [startX + width / 2, startY],
          p2: [startX + width / 2, startY + height],
          lineWidth: Math.max(25 - (deepLevel * 5), 1),
          translation: this.center,
        });

        grid.push(horizontalLine, verticalLine);

        generateCenterLines(startX, startY, width / 2, height / 2, deepLevel + 1);
        generateCenterLines(startX + width / 2, startY, width / 2, height / 2, deepLevel + 1);
        generateCenterLines(startX, startY + height / 2, width / 2, height / 2, deepLevel + 1);
        generateCenterLines(startX + width / 2, startY + height / 2, width / 2, height / 2, deepLevel + 1);
      };

      generateCenterLines(0, 0, this.gl.canvas.width, this.gl.canvas.height, 0);

      painter.setPrograms(grid);

      painter.clear();
      painter.draw();
    };

    painter.init();

    requestAnimationFrame(() => {
      renderScene();
    });
  }
}
