import { EventHandler } from './event_handler';
import { getWheelDelta } from '../utils/dom_utils';
import { Point } from '../geometry/point';

export class ZoomEventHandler extends EventHandler {
  eventType = 'wheel';

  delta: number = 0;

  lastMousePos: Point;

  // Whether the map can be zoomed by using the mouse wheel. If passed `'center'`,
  // it will zoom to the center of the view regardless of where the mouse was.
  scrollWheelZoom: true;

  // Limits the rate at which a wheel can fire (in milliseconds). By default
  // user can't zoom via wheel more often than once per 40 ms.
  wheelDebounceTime = 40; // wheel event debounce time in ms.

  // How many scroll pixels
  // mean a change of one full zoom level. Smaller values will make wheel-zooming
  // faster (and vice versa).
  wheelPxPerZoomLevel = 60;

  wheelStartTime?: number;
  debounceTimer?: ReturnType<typeof setTimeout>;

  public eventHandler(e: WheelEvent) {
    this.delta += getWheelDelta(e);
    this.lastMousePos = new Point(e.clientX, e.clientY);

    if (!this.wheelStartTime) {
      this.wheelStartTime = Date.now();
    }

    const left = Math.max(this.wheelDebounceTime - (Date.now() - this.wheelStartTime), 0);

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(this.performZoom.bind(this), left);
  }

  private performZoom() {
    const zoom = this.map.getZoom();
    const snap = this.map.zoomSnap || 0;

    // this.map._stop(); // stop panning and fly animations if any

    // map the delta with a sigmoid function to -4..4 range leaning on -1..1
    const d2 = this.delta / (this.wheelPxPerZoomLevel * 4);
    const d3 = (4 * Math.log(2 / (1 + Math.exp(-Math.abs(d2))))) / Math.LN2;
    const d4 = snap ? Math.ceil(d3 / snap) * snap : d3;
    const delta = this.map.limitZoom(zoom + (this.delta > 0 ? d4 : -d4)) - zoom;

    this.delta = 0;
    this.wheelStartTime = null;

    if (!delta) {
      return;
    }

    this.map.zoomToPoint(zoom + delta, this.lastMousePos);
  }
}
