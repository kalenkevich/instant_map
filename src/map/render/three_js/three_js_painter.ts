import * as THREE from 'three';

export class ThreeJsPainter {
  private readonly renderer: THREE.WebGLRenderer;
  private camera: THREE.Camera;
  private scene: THREE.Scene;

  private width: number;
  private height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.scene = new THREE.Scene();
    this.width = canvas.offsetWidth;
    this.height = canvas.offsetHeight;
  }

  init() {
    this.scene.background = new THREE.Color(255, 255, 255);
    this.camera = new THREE.OrthographicCamera(
      0, this.width,
      0, this.height,
      1, 2,
    );
    this.camera.position.set(0, 0, 1);
    this.renderer.setPixelRatio(window.devicePixelRatio);
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
    this.camera = new THREE.OrthographicCamera(
      0, this.width,
      0, this.height,
      1, 2,
    );
    this.camera.position.set(0, 0, 1);
  }

  destroy() {}

  draw(objects: THREE.Object3D[]) {
    this.scene.clear();
    this.scene.add(...objects);
    this.renderer.render(this.scene, this.camera);
  }

  private getGoldenLine() {
    const material = new THREE.LineBasicMaterial( { color: 0x0000ff, linewidth: 10 } );
    const points = [];
    points.push( new THREE.Vector3( - 10, 0, 0 ) );
    points.push( new THREE.Vector3( 0, 10, 0 ) );
    points.push( new THREE.Vector3( 10, 0, 0 ) );

    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    
    return new THREE.Line(geometry, material);
  }

  private getGoldenShape(): THREE.Object3D {
    const realShape = [
      [1782, 2724],
      [1842, 2725],
      [1926, 2745],
      [1952, 2756],
      [1982, 2783],
      [1991, 2812],
      [2016, 2845],
      [2037, 2871],
      [2041, 2879],
      [2031, 2886],
      [2018, 2886],
      [1985, 2871],
      [1961, 2858],
      [1909, 2834],
      [1852, 2793],
      [1819, 2760],
      [1782, 2740],
      [1768, 2733],
      [1782, 2724],
    ];

    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(173 / 256, 226 / 256, 167 / 256),
    });

    const shape = new THREE.Shape();

    shape.moveTo(realShape[0][0], realShape[0][0]);
    for (let i = 1; i < realShape.length; i++) {
      shape.lineTo(realShape[i][0], realShape[i][1]);
    }

    const geometry = new THREE.ShapeGeometry(shape, 12);
    geometry.center();

    const group = new THREE.Group();
    group.add(new THREE.Mesh(geometry, material));

    // group.translateX(959.9147667183095);
    // group.translateX(639.9431778122063);
    // group.scale.set(0.6286278760434246, 0.7330391498421607, 1);

    return group;
  }
}
