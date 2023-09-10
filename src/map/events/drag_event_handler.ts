import { EventHandler } from './event_handler';
import { Point } from '../geometry/point';
import {Bounds} from '../geometry/bounds';
import { GlideMap } from '../map';
import { LatLng } from '../geo/lat_lng';

// const START = Browser.touch ? 'touchstart mousedown' : 'mousedown';
const MOUSE_DOWN_EVENT = 'mousedown';

interface Scale {
  x: number;
  y: number;
  boundingClientRect: DOMRect;
}

interface DraggableOptions {
  clickTolerance: number;
}

const DefaultDraggableOptions = {
  clickTolerance: 3,
};

interface EventListener {
  eventType: DragEventType;
  handler: (...eventArgs: any[]) => void;
}

enum DragEventType {
  PRE_DRAG = 'predrag',
  DRAG_START = 'dragstart',
  DRAG_END = 'dragend',
  DOWN = 'down',
  DRAG = 'drag',
}

export class Draggable {
  // @section
  // @aka Draggable options
  // @option clickTolerance: Number = 3
  // The max number of pixels a user can shift the mouse pointer during a click
  // for it to be considered a valid click (as opposed to a mouse drag).
  private options: DraggableOptions;

  private element: HTMLElement;

  private dragStartTarget: HTMLElement;

  private shouldPreventOutline: boolean;

  private enabled: boolean = false;
  private moved: boolean = false;
  private moving: boolean = false;
  private lastEvent: Event;

  private startPos: Point;
  private newPos: Point;
  private absolutePos: Point;
  private lastTarget: EventTarget;
  private parentScale: Scale;

  static dragging: Draggable | null = null;

  static positions = new WeakMap();

  static getPosition(el: HTMLElement): Point {
    return this.positions.get(el) || new Point(0, 0);
  }

  static setPosition(el: HTMLElement, p: Point): void {
    this.positions.set(el, p);
  }

  // Creates a `Draggable` object for moving `el` when you start dragging the `dragHandle` element (equals `el` itself by default).
  constructor(element: HTMLElement, dragStartTarget: HTMLElement, shouldPreventOutline?: boolean, options?: DraggableOptions) {
    this.options = options || DefaultDraggableOptions;
    this.element = element;
    this.dragStartTarget = dragStartTarget || element;
    this.shouldPreventOutline = shouldPreventOutline;

    this.onUp = this.onUp.bind(this);
    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.restoreOutline = this.restoreOutline.bind(this);
  }

  // Enables the dragging ability
  enable() {
    if (this.enabled) {
      return;
    }

    this.dragStartTarget.addEventListener(MOUSE_DOWN_EVENT, this.onDown);

    this.enabled = true;
  }

  // Disables the dragging ability
  disable() {
    if (!this.enabled) {
      return;
    }

    // If we're currently dragging this draggable,
    // disabling it counts as first ending the drag.
    if (Draggable.dragging === this) {
      this.finishDrag(true);
    }

    this.dragStartTarget.removeEventListener(MOUSE_DOWN_EVENT, this.onDown);

    this.enabled = false;
    this.moved = false;
  }

  onDown(e: MouseEvent) {
    // Ignore the event if disabled; this happens in IE11
    // under some circumstances, see #3666.
    if (!this.enabled) {
      return;
    }

    this.moved = false;

    if (this.element.classList.contains('leaflet-zoom-anim')) {
      return;
    }

    // if (e instanceof TouchEvent && e.touches && e.touches.length !== 1) {
    // 	// Finish dragging to avoid conflict with touchZoom
    // 	if (Draggable.dragging === this) {
    // 		this.finishDrag();
    // 	}
    // 	return;
    // }

    if (e instanceof MouseEvent && (Draggable.dragging || e.shiftKey || e.button !== 0)) {
      return;
    }
    Draggable.dragging = this; // Prevent dragging multiple objects at once.

    if (this.shouldPreventOutline) {
      this.preventOutline(this.element);
    }

    this.disableImageDrag();
    this.disableTextSelection();

    if (this.moving) {
      return;
    }

    // @event down: Event
    // Fired when a drag is about to start.
    this.fire(DragEventType.DOWN);

    const first = e;
    const sizedParent = this.getSizedParentNode(this.element);

    this.startPos = new Point(first.clientX, first.clientY);
    this.newPos = Draggable.getPosition(this.element);

    // Cache the scale, so that we can continuously compensate for it during drag (_onMove).
    this.parentScale = this.getScale(sizedParent);

    document.addEventListener('mousemove', this.onMove);
    document.addEventListener('mouseup', this.onUp);
  }

  onMove(e: MouseEvent) {
    // Ignore the event if disabled; this happens in IE11
    // under some circumstances, see #3666.
    if (!this.enabled) {
      return;
    }

    // if (e.touches && e.touches.length > 1) {
    //   this.moved = true;
    //   return;
    // }

    // const first = e.touches && e.touches.length === 1 ? e.touches[0] : e;
    const first = e;
    const offset = new Point(first.clientX, first.clientY).subtract(this.startPos);

    if (!offset.x && !offset.y) {
      return;
    }
    if (Math.abs(offset.x) + Math.abs(offset.y) < this.options.clickTolerance) {
      return;
    }

    // We assume that the parent container's position, border and scale do not change for the duration of the drag.
    // Therefore there is no need to account for the position and border (they are eliminated by the subtraction)
    // and we can use the cached value for the scale.
    offset.x /= this.parentScale.x;
    offset.y /= this.parentScale.y;

    this.preventDefault(e);

    if (!this.moved) {
      // @event dragstart: Event
      // Fired when a drag starts
      this.fire(DragEventType.DRAG_START);

      this.moved = true;

      document.body.classList.add('leaflet-dragging');

      this.lastTarget = e.target || e.srcElement;
      // IE and Edge do not give the <use> element, so fetch it
      // if necessary
      // if (window.SVGElementInstance && this.lastTarget instanceof window.SVGElementInstance) {
      //   this.lastTarget = this.lastTarget.correspondingUseElement;
      // }
      // this.lastTarget.classList.add('leaflet-drag-target');
    }

    this.newPos = this.startPos.add(offset);
    this.moving = true;

    this.lastEvent = e;
    this.updatePosition();
  }

  updatePosition() {
    const e = { originalEvent: this.lastEvent };

    // @event predrag: Event
    // Fired continuously during dragging *before* each corresponding
    // update of the element's position.
    this.fire(DragEventType.PRE_DRAG, e);
    Draggable.setPosition(this.element, this.newPos);

    // @event drag: Event
    // Fired continuously during dragging.
    this.fire(DragEventType.DRAG, e);
  }

  onUp() {
    // Ignore the event if disabled; this happens in IE11
    // under some circumstances, see #3666.
    if (!this.enabled) {
      return;
    }
    this.finishDrag();
  }

  finishDrag(noInertia?: boolean) {
    document.body.classList.remove('leaflet-dragging');

    if (this.lastTarget) {
      // this.lastTarget.classList.remove('leaflet-drag-target');
      this.lastTarget = null;
    }

    document.removeEventListener('mousemove', this.onMove);
    document.removeEventListener('mouseup', this.onUp);

    this.enableImageDrag();
    this.enableTextSelection();

    const fireDragend = this.moved && this.moving;

    this.moving = false;
    Draggable.dragging = null;

    if (fireDragend) {
      // @event dragend: DragEndEvent
      // Fired when the drag ends.
      this.fire(DragEventType.DRAG_END, {
        noInertia,
        distance: this.newPos.distanceTo(this.startPos),
      });
    }
  }

  outlineElement?: HTMLElement;
  outlineStyle?: string;

  preventOutline(element: HTMLElement) {
    while (element.tabIndex === -1) {
      element = element.parentElement;
    }

    if (!element.style) {
      return;
    }

    this.restoreOutline();
    this.outlineElement = element;
    this.outlineStyle = element.style.outlineStyle;
    element.style.outlineStyle = 'none';

    window.addEventListener('keydown', this.restoreOutline);
  }

  restoreOutline() {
    if (!this.outlineElement) {
      return;
    }

    this.outlineElement.style.outlineStyle = this.outlineStyle;
    this.outlineElement = undefined;
    this.outlineStyle = undefined;

    window.removeEventListener('keydown', this.restoreOutline);
  }

  preventDefault(e: Event) {
    e.preventDefault();
  }

  enableTextSelection() {}

  disableTextSelection() {}

  enableImageDrag() {
    window.removeEventListener('dragstart', this.preventDefault);
  }

  disableImageDrag() {
    window.addEventListener('dragstart', this.preventDefault);
  }

  getSizedParentNode(element: HTMLElement): HTMLElement {
    do {
      element = element.parentElement;
    } while ((!element.offsetWidth || !element.offsetHeight) && element !== document.body);

    return element;
  }

  getScale(el: HTMLElement): Scale {
    const rect = el.getBoundingClientRect(); // Read-only in old browsers.

    return {
      x: rect.width / el.offsetWidth || 1,
      y: rect.height / el.offsetHeight || 1,
      boundingClientRect: rect,
    };
  }

  isMoved(): boolean {
    return this.moved;
  }

  isMoving(): boolean {
    return this.moving;
  }

  private eventListeners: EventListener[] = [];
  addEventListener(listener: EventListener): void {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: EventListener) {
    const index = this.eventListeners.findIndex(l => {
      return l.eventType === listener.eventType && l.handler === listener.handler;
    });

    if (index > -1) {
      this.eventListeners.splice(index);
    }
  }

  fire(eventType: DragEventType, ...eventArgs: any[]) {
    for (const listener of this.eventListeners) {
      if (listener.eventType === eventType) {
        listener.handler(...eventArgs);
      }
    }
  }

  getStartPosition() {
    return this.startPos;
  }

  setStartPosition(pos: Point) {
    this.startPos = pos;
  }

  getNewPosition(): Point {
    return this.newPos;
  }

  setNewPosition(pos: Point) {
    this.newPos = pos;
  }

  getAbsolutePos(): Point {
    return this.absolutePos;
  }

  setAbsolutePos(pos: Point) {
    this.absolutePos = pos;
  }
}

export class DragEventHandler extends EventHandler {
  eventType = 'wheel';

  // @option dragging: Boolean = true
  // Whether the map is draggable with mouse/touch or not.
  dragging: boolean = true;

  // @section Panning Inertia Options
  // @option inertia: Boolean = *
  // If enabled, panning of the map will have an inertia effect where
  // the map builds momentum while dragging and continues moving in
  // the same direction for some time. Feels especially nice on touch
  // devices. Enabled by default.
  inertia: boolean = true;

  // @option inertiaDeceleration: Number = 3000
  // The rate with which the inertial movement slows down, in pixels/second².
  inertiaDeceleration: number = 3400; // px/s^2

  // @option inertiaMaxSpeed: Number = Infinity
  // Max speed of the inertial movement, in pixels/second.
  inertiaMaxSpeed: number = Infinity; // px/s

  // @option easeLinearity: Number = 0.2
  easeLinearity: number = 0.2;

  // TODO refactor, move to CRS
  // @option worldCopyJump: Boolean = false
  // With this option enabled, the map tracks when you pan to another "copy"
  // of the world and seamlessly jumps to the original one so that all overlays
  // like markers and vector layers are still visible.
  worldCopyJump: boolean = false;

  // @option maxBoundsViscosity: Number = 0.0
  // If `maxBounds` is set, this option will control how solid the bounds
  // are when dragging the map around. The default value of `0.0` allows the
  // user to drag outside the bounds at normal speed, higher values will
  // slow down map dragging outside bounds, and `1.0` makes the bounds fully
  // solid, preventing the user from dragging outside the bounds.
  maxBoundsViscosity: number = 0.0;

  viscosity: number = 0;

  wheelStartTime?: number;
  debounceTimer?: ReturnType<typeof setTimeout>;

  draggable: Draggable;

  positions: Point[] = [];
  times: number[] = [];

  lastTime: number;
  lastPos: Point;

  offsetLimit: Bounds;

  initialWorldOffset: number;
  worldWidth: number;

  eventHandler(...args: any[]): void {
    throw new Error('Method not implemented.');
  }

  constructor(map: GlideMap, viscosity: number = 0) {
    super(map);

    this.onDragStart = this.onDragStart.bind(this);
    this.onDrag = this.onDrag.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.onPreDragLimit = this.onPreDragLimit.bind(this);
    this.viscosity = viscosity;
  }

  subscribe() {
    if (!this.draggable) {
      this.draggable = new Draggable(this.map.el, this.map.el);
      this.draggable.addEventListener({
        eventType: DragEventType.DRAG_START,
        handler: this.onDragStart,
      });
      this.draggable.addEventListener({
        eventType: DragEventType.DRAG,
        handler: this.onDrag,
      });
      this.draggable.addEventListener({
        eventType: DragEventType.DRAG_END,
        handler: this.onDragEnd,
      });
      this.draggable.addEventListener({
        eventType: DragEventType.PRE_DRAG,
        handler: this.onPreDragLimit,
      });
    }
    this.draggable.enable();
    this.positions = [];
    this.times = [];
  }

  removeHooks() {
    this.draggable.disable();
  }

  moved() {
    return this.draggable && this.draggable.isMoved();
  }

  moving() {
    return this.draggable && this.draggable.isMoving();
  }

  onDragStart() {
    const map = this.map;

    map.stopRender();

    if (this.map.getBounds() && this.maxBoundsViscosity) {
      const bounds = this.map.getBounds().clone();

      this.offsetLimit = new Bounds(
        this.map.getPointFromLatLng(bounds.getNorthWest()).multiplyBy(-1),
        this.map.getPointFromLatLng(bounds.getSouthEast()).multiplyBy(-1).add(this.map.getSize()),
      );

      this.viscosity = Math.min(1.0, Math.max(0.0, this.maxBoundsViscosity));
    } else {
      this.offsetLimit = null;
    }

    // map
    //   .fire('movestart')
    //   .fire('dragstart');

    if (this.inertia) {
      this.positions = [];
      this.times = [];
    }
  }

  onDrag(e: Event) {
    if (this.inertia) {
      const time = (this.lastTime = +new Date());
      this.lastPos = this.draggable.getAbsolutePos() || this.draggable.getNewPosition();
      const pos = this.lastPos;

      this.positions.push(pos);
      this.times.push(time);

      this.prunePositions(time);
    }

    // this.map
    //   .fire('move', e)
    //   .fire('drag', e);
  }

  prunePositions(time: number) {
    while (this.positions.length > 1 && time - this.times[0] > 50) {
      this.positions.shift();
      this.times.shift();
    }
  }

  onZoomEnd() {
    const pxCenter = this.map.getSize().divideBy(2);
    const pxWorldCenter = this.map.getPointFromLatLng(new LatLng(0, 0));

    this.initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
    this.worldWidth = this.map.getPixelWorldBounds().getSize().x;
  }

  viscousLimit(value: number, threshold: number) {
    return value - (value - threshold) * this.viscosity;
  }

  onPreDragLimit() {
    if (!this.viscosity || !this.offsetLimit) {
      return;
    }

    const offset = this.draggable.getAbsolutePos().subtract(this.draggable.getStartPosition());

    const limit = this.offsetLimit;
    if (offset.x < limit.min.x) {
      offset.x = this.viscousLimit(offset.x, limit.min.x);
    }
    if (offset.y < limit.min.y) {
      offset.y = this.viscousLimit(offset.y, limit.min.y);
    }
    if (offset.x > limit.max.x) {
      offset.x = this.viscousLimit(offset.x, limit.max.x);
    }
    if (offset.y > limit.max.y) {
      offset.y = this.viscousLimit(offset.y, limit.max.y);
    }

    this.draggable.setNewPosition(this.draggable.getStartPosition().add(offset));
  }

  onPreDragWrap() {
    // TODO refactor to be able to adjust map pane position after zoom
    const worldWidth = this.worldWidth,
      halfWidth = Math.round(worldWidth / 2),
      dx = this.initialWorldOffset,
      x = this.draggable.getNewPosition().x,
      newX1 = ((x - halfWidth + dx) % worldWidth) + halfWidth - dx,
      newX2 = ((x + halfWidth + dx) % worldWidth) - halfWidth - dx,
      newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;

    this.draggable.setAbsolutePos(this.draggable.getNewPosition().clone());
    this.draggable.getNewPosition().x = newX;
  }

  onDragEnd(e: MouseEvent) {
    const noInertia = !this.inertia || this.times.length < 2;

    // this.map.fire('dragend', e);

    if (noInertia) {
      // this.map.fire('moveend');
    } else {
      this.prunePositions(+new Date());

      const direction = this.lastPos.subtract(this.positions[0]);
      const duration = (this.lastTime - this.times[0]) / 1000;
      const ease = this.easeLinearity;
      const speedVector = direction.multiplyBy(ease / duration);
      const speed = speedVector.distanceTo(new Point(0, 0));
      const limitedSpeed = Math.min(this.inertiaMaxSpeed, speed);
      const limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed);
      const decelerationDuration = limitedSpeed / (this.inertiaDeceleration * ease);
      let offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2);
      // .round()

      if (!offset.x && !offset.y) {
        // this.map.fire('moveend');
      } else {
        offset = this.map.limitOffset(offset, this.map.bounds);

        this.map.panBy(offset, {
          duration: decelerationDuration,
          easeLinearity: ease,
          noMoveStart: true,
          animate: true,
        });
      }
    }
  }
}
