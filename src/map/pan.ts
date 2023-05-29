import { Evented } from './events/evented';
import { MapState } from './map_state';

export class Pan extends Evented {
  protected state: MapState;
  protected prevState: MapState;

  init() {
    this.subscribeOnUserEvents();
  }

  onClickEvent(clickEvent: MouseEvent) {
    this.onMapStateChange({
      ...this.state,
      center: [clickEvent.x, clickEvent.y],
    });
  }

  onWheelEvent(wheelEvent: WheelEvent) {
    let newZoom = this.state.zoom;

    if (wheelEvent.deltaY < 0) {
      newZoom = this.state.zoom + Math.abs(wheelEvent.deltaY / 20);
      newZoom = Math.min(newZoom, 24);
      newZoom = Number(newZoom.toFixed(4));
    } else {
      newZoom = this.state.zoom - Math.abs(wheelEvent.deltaY / 20);
      newZoom = Math.max(newZoom, 0);
      newZoom = Number(newZoom.toFixed(4));
    }

    this.onMapStateChange({
      ...this.state,
      zoom: newZoom,
      center: [wheelEvent.x, wheelEvent.y],
    });
  }

  onMouseDownEvent(mouseDownEvent: MouseEvent) {
    this.dragStarted = true;

    this.dragStartX = mouseDownEvent.x;
    this.dragStartY = mouseDownEvent.y;
  }

  onMouseMove(mouseMoveEvent: MouseEvent) {}

  onMouseUpEvent(mouseUpEvent: MouseEvent) {
    if (!this.dragStarted) {
      return;
    }

    this.dragStarted = false;

    let deltaX = mouseUpEvent.x - this.dragStartX;
    let deltaY = mouseUpEvent.y - this.dragStartY;

    this.onMapStateChange({
      ...this.state,
      // inverse the delta
      center: [Math.max(this.state.center[0] - deltaX, 0), Math.max(this.state.center[1] - deltaY, 0)],
    });
  }

  onMapStateChange(newState: MapState) {}
}
