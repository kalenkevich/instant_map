import 'hammerjs';
import { transformVector3Matrix4, invertMatrix4 } from '../math/matrix_utils';
import { InstantMap } from '../map';
import { Evented } from '../evented';

export enum MapPanEvents {
  click = 'click',
}

type HammerMouseEvent = (MouseEvent | WheelEvent) & HammerInput;

export class MapPan extends Evented<MapPanEvents> {
  private hammer: HammerManager;
  private startX: number;
  private startY: number;

  constructor(
    private readonly map: InstantMap,
    private readonly el: HTMLElement,
  ) {
    super();
  }

  init() {
    this.handleMove = this.handleMove.bind(this);
    this.handlePan = this.handlePan.bind(this);
    this.handleZoom = this.handleZoom.bind(this);
    this.handleMouseClick = this.handleMouseClick.bind(this);

    this.subscribeOnEvents();
  }

  destroy() {
    this.unsubscribeFromEvents();
  }

  private subscribeOnEvents() {
    // setup event handlers
    this.el.addEventListener('mousedown', this.handlePan);
    this.el.addEventListener('wheel', this.handleZoom);
    this.el.addEventListener('click', this.handleMouseClick);

    // mobile event handlers
    this.hammer = new Hammer(this.el);
    this.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    this.hammer.on('panstart', this.handlePan);
    this.hammer.get('pinch').set({ enable: true });
    this.hammer.on('pinch', this.handleZoom);
  }

  private unsubscribeFromEvents() {
    this.el.removeEventListener('mousedown', this.handlePan);
    this.el.removeEventListener('wheel', this.handleZoom);
    this.el.removeEventListener('click', this.handleMouseClick);

    this.hammer.off('panstart', this.handlePan);
    this.hammer.off('pinch', this.handleZoom);
  }

  private handleMouseClick(clickEvent: HammerMouseEvent) {
    this.fire(MapPanEvents.click, clickEvent, this.getClipSpacePosition(clickEvent));
  }

  private handleMove(moveEvent: HammerMouseEvent) {
    const [x, y] = this.getClipSpacePosition(moveEvent);
    const viewModelMatrix = this.map.getProjectionViewMatrix();

    // compute the previous position in world space
    const [preX, preY] = transformVector3Matrix4([this.startX, this.startY, 0], invertMatrix4([...viewModelMatrix]));

    // compute the new position in world space
    const [postX, postY] = transformVector3Matrix4([x, y, 0], invertMatrix4([...viewModelMatrix]));

    // move that amount, because how much the position changes depends on the zoom level
    const deltaX = preX - postX;
    const deltaY = preY - postY;
    if (isNaN(deltaX) || isNaN(deltaY)) {
      return; // abort
    }

    const cameraPos = this.map.getCenterXYZ();
    const newX = cameraPos[0] + deltaX;
    const newY = cameraPos[1] + deltaY;

    if (!this.map.inBoundLimits([newX, newY, cameraPos[2]])) {
      return;
    }

    // save current pos for next movement
    this.startX = x;
    this.startY = y;

    this.map.setCenter([newX, newY, cameraPos[2]]);
  }

  // handle dragging the map position (panning)
  // "mousedown" OR "panstart"
  private handlePan(startEvent: HammerMouseEvent) {
    startEvent.preventDefault();

    // get position of initial drag
    const [startX, startY] = this.getClipSpacePosition(startEvent);
    this.startX = startX;
    this.startY = startY;
    this.el.style.cursor = 'grabbing';

    // handle move events once started
    window.addEventListener('mousemove', this.handleMove);
    this.hammer.on('pan', this.handleMove);

    // clear on release
    const clear = () => {
      this.el.style.cursor = 'grab';

      window.removeEventListener('mousemove', this.handleMove);
      this.hammer.off('pan', this.handleMove);

      window.removeEventListener('mouseup', clear);
      this.hammer.off('panend', clear);
    };
    window.addEventListener('mouseup', clear);
    this.hammer.on('panend', clear);
  }

  // handle zooming
  private handleZoom(wheelEvent: HammerMouseEvent) {
    wheelEvent.preventDefault();

    const [x, y] = this.getClipSpacePosition(wheelEvent);

    // get position before zooming
    const [preZoomX, preZoomY] = transformVector3Matrix4(
      [x, y, 0],
      invertMatrix4([...this.map.getProjectionViewMatrix()]),
    );

    // update current zoom state
    const prevZoom = this.map.getZoom();
    const zoomDelta = -(wheelEvent as WheelEvent).deltaY * (1 / 300);
    let newZoom = prevZoom + zoomDelta;
    newZoom = Math.max(this.map.getMinZoom(), Math.min(newZoom, this.map.getMaxZoom()));

    if (!this.map.inBoundLimits(this.map.getCenterXYZ(), newZoom)) {
      return;
    }

    this.map.setZoom(newZoom);

    // get new position after zooming
    const [postZoomX, postZoomY] = transformVector3Matrix4(
      [x, y, 0],
      invertMatrix4([...this.map.getProjectionViewMatrix()]),
    );

    // camera needs to be moved the difference of before and after
    const [cameraX, cameraY, cameraZ] = this.map.getCenterXYZ();
    const newX = cameraX + preZoomX - postZoomX;
    const newY = cameraY + preZoomY - postZoomY;

    if (!this.map.inBoundLimits([newX, newY, cameraZ], newZoom)) {
      return;
    }

    this.map.setCenter([newX, newY, cameraZ], newZoom);
  }

  // from a given mouse position on the canvas, return the xy value in clip space
  private getClipSpacePosition(e: HammerMouseEvent): [number, number] {
    // get position from mouse or touch event
    const [x, y] = [e.center?.x || e.clientX, e.center?.y || e.clientY];

    // get canvas relative css position
    const rect = this.el.getBoundingClientRect();

    const cssX = x - rect.left;
    const cssY = y - rect.top;

    // get normalized 0 to 1 position across and down canvas
    const normalizedX = cssX / this.el.clientWidth;
    const normalizedY = cssY / this.el.clientHeight;

    // convert to clip space
    const clipX = normalizedX * 2 - 1;
    const clipY = normalizedY * -2 + 1;

    return [clipX, clipY];
  }
}
