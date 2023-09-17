import { EventHandler } from './event_handler';
import { Point } from '../geometry/point';

export class ClickEventHandler extends EventHandler {
  eventType = 'click';

  public eventHandler(e: MouseEvent) {
    const point = this.getMapPoint(e);
    const latLng = this.map.getLatLngFromPoint(point, Math.round(this.map.getZoom()));

    this.map.setCenter(latLng);
  }

  private getMapPoint(e: MouseEvent): Point {
    const x = e.clientX - this.el.offsetTop;
    const y = e.clientY - this.el.offsetLeft;

    return new Point(x, y);
  }
}
