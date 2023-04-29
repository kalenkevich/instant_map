export interface MapOptions {
  zoom: number;
  center: [number, number];
}

export class Map {
  gl: WebGLRenderingContext;
  
  zoom: number;

  center: [number, number];

  constructor(gl: WebGLRenderingContext, options: MapOptions) {
    this.gl = gl;
    this.zoom = options.zoom;
    this.center = options.center;
  }

  renderMap() {

  }
}