// import { GlideMapV2 } from '../map';
// import Hammer from 'hammerjs';
// import { vec3, mat3 } from 'gl-matrix';

// export class MapPane {
//   private el: HTMLElement;
//   hammer: any;
//   startX: number;
//   startY: number;

//   eventType?: string;
//   eventHandler?(...args: any[]): void {
//     throw new Error('Method not implemented.');
//   }

//   constructor(private readonly map: GlideMapV2) {
//     this.el = map.getRootElement();
//     this.handleMove = this.handleMove.bind(this);
//     this.handlePan = this.handlePan.bind(this);
//     this.handleZoom = this.handleZoom.bind(this);
//     this.getClipSpacePosition = this.getClipSpacePosition.bind(this);
//     this.eventHandler = this.eventHandler.bind(this);
//   }

//   init() {
//     this.subscribe();
//   }

//   destroy(): void {
//     this.unsubscribe();
//   }

//   subscribe(): void {
//     this.el.addEventListener('mousedown', this.handlePan);
//     // mobile event handlers
//     this.hammer = new Hammer(this.el);
//     this.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
//     this.hammer.on('panstart', this.handlePan);
//     this.hammer.get('pinch').set({ enable: true });
//     this.hammer.on('pinch', this.handleZoom);
//   }

//   unsubscribe(): void {
//     this.hammer.off('panstart', this.handlePan);
//     this.hammer.off('pinch', this.handleZoom);
//     this.el.removeEventListener('mousedown', this.handlePan);
//   }

//   // handle drag changes while mouse is still down
//   // "mousemove" or "pan"
//   handleMove(moveEvent: MouseEvent) {
//     const camera = this.map.getCamera();
//     const cameraPos = camera.getPosition();
//     const [x, y] = this.getClipSpacePosition(moveEvent);

//     // const viewProjectionMat = this.map.getViewMatrix();

//     // compute the previous position in world space
//     // const [preX, preY] = vec3.transformMat3(
//     //   vec3.create(),
//     //   [this.startX, this.startY, 0],
//     //   mat3.invert(mat3.create(), viewProjectionMat)
//     // );

//     // const this.startX, this.startY;

//     // compute the new position in world space
//     // const [postX, postY] = vec3.transformMat3(vec3.create(), [x, y, 0], mat3.invert(mat3.create(), viewProjectionMat));

//     // move that amount, because how much the position changes depends on the zoom level
//     const deltaX = this.startX - x;
//     const deltaY = this.startY - y;
//     if (isNaN(deltaX) || isNaN(deltaY)) {
//       return; // abort
//     }

//     // only update within world limits
//     cameraPos.x += deltaX;
//     cameraPos.y += deltaY;

//     // prevent further pan if at limits
//     if (!camera.inBoundsLimit(cameraPos, camera.getZoom())) {
//       return; // abort
//     }

//     // save current pos for next movement
//     this.startX = x;
//     this.startY = y;

//     camera.setPosition(cameraPos);
//   }

//   // handle dragging the map position (panning)
//   // "mousedown" OR "panstart"
//   private handlePan(startEvent: MouseEvent) {
//     startEvent.preventDefault();

//     // get position of initial drag
//     let [startX, startY] = this.getClipSpacePosition(startEvent);
//     this.startX = startX;
//     this.startY = startY;
//     this.el.style.cursor = 'grabbing';

//     // handle move events once started
//     window.addEventListener('mousemove', this.handleMove);
//     this.hammer.on('pan', this.handleMove);

//     // clear on release
//     const clear = () => {
//       this.el.style.cursor = 'grab';

//       window.removeEventListener('mousemove', this.handleMove);
//       this.hammer.off('pan', this.handleMove);

//       window.removeEventListener('mouseup', clear);
//       this.hammer.off('panend', clear);
//     };
//     window.addEventListener('mouseup', clear);
//     this.hammer.on('panend', clear);
//   }

//   private handleZoom(wheelEvent: WheelEvent) {
//     const camera = this.map.getCamera();
//     const cameraPos = camera.getPosition();

//     wheelEvent.preventDefault();
//     const [x, y] = this.getClipSpacePosition(wheelEvent);

//     // get position before zooming
//     // const [preZoomX, preZoomY] = vec3.transformMat3(
//     //   vec3.create(),
//     //   [x, y, 0],
//     //   mat3.invert(mat3.create(), this.map.getViewMatrix())
//     // );

//     // update current zoom state
//     const zoomDelta = -wheelEvent.deltaY * (1 / 300);
//     let newZoom = camera.getZoom() + zoomDelta;

//     // prevent further zoom if at limits
//     if (!camera.inBoundsLimit(camera.getPosition(), newZoom)) {
//       return; // abort
//     }

//     // get new position after zooming
//     // const [postZoomX, postZoomY] = vec3.transformMat3(
//     //   vec3.create(),
//     //   [x, y, 0],
//     //   mat3.invert(mat3.create(), this.map.getViewMatrix())
//     // );

//     // camera needs to be moved the difference of before and after
//     // cameraPos.x += preZoomX - x;
//     // cameraPos.y += preZoomY - y;

//     // camera.setPosition(cameraPos);
//     camera.setZoom(newZoom);
//   }

//   private getClipSpacePosition(e: MouseEvent) {
//     // get position from mouse or touch event
//     const [x, y] = [e.clientX, e.clientY];

//     // get canvas relative css position
//     const rect = this.el.getBoundingClientRect();
//     const cssX = x - rect.left;
//     const cssY = y - rect.top;

//     // get normalized 0 to 1 position across and down canvas
//     // const normalizedX = cssX / this.el.clientWidth;
//     // const normalizedY = cssY / this.el.clientHeight;

//     // // convert to clip space
//     // const clipX = normalizedX * 2 - 1;
//     // const clipY = normalizedY * -2 + 1;

//     return [cssX, cssY];
//   }
// }
