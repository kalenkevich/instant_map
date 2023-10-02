import { WebGLRenderer, Camera, Scene, Color, OrthographicCamera, Object3D } from 'three';

export class ThreeJsPainter {
  private readonly renderer: THREE.WebGLRenderer;
  private camera: Camera;
  private scene: Scene;

  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement, private readonly devicePixelRatio = 1) {
    this.renderer = new WebGLRenderer({ canvas });
    this.scene = new Scene();
    this.width = canvas.offsetWidth;
    this.height = canvas.offsetHeight;
  }

  init() {
    this.scene.background = new Color(255, 255, 255);
    this.camera = new OrthographicCamera(
      0, this.width,
      0, this.height,
      1, 2,
    );
    this.camera.position.set(0, 0, 1);
    this.renderer.setPixelRatio(this.devicePixelRatio);
  }

  setWidth(w: number) {
    this.width = w;
    this.updateDimentions();
  }

  setHeight(h: number) {
    this.height = h;
    this.updateDimentions();
  }

  updateDimentions() {
    this.renderer.setSize(this.width, this.height);
    this.camera = new OrthographicCamera(
      0, this.width,
      0, this.height,
      1, 2,
    );
    this.camera.position.set(0, 0, 1);
  }

  destroy() {}

  draw(objects: Object3D[]) {
    this.scene.clear();
    this.scene.add(...objects);
    this.renderer.render(this.scene, this.camera);
  }
}