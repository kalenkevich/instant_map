import { isLinux, isChrome, isMac } from '../utils/browser_utils';
import { Point } from '../geometry/point';

// Gets the wheel pixel factor based on the devicePixelRatio
// We need double the scroll pixels (see https://github.com/Leaflet/Leaflet/issues/7403 and https://github.com/Leaflet/Leaflet/issues/4538) for all Browsers
// except OSX (Mac) -> 3x, Chrome running on Linux 1x
export function getWheelPxFactor() {
  return isLinux && isChrome ? window.devicePixelRatio : isMac ? window.devicePixelRatio * 3 : window.devicePixelRatio > 0 ? 2 * window.devicePixelRatio : 1;
}

export function getWheelDelta(e: WheelEvent) {
  if (e.deltaY && e.deltaMode === 0) {
    return -e.deltaY / getWheelPxFactor();
  }

  if (e.deltaY && e.deltaMode === 1) {
    return -e.deltaY * 20;
  }

  if (e.deltaY && e.deltaMode === 2) {
    return -e.deltaY * 60;
  }

  if (e.deltaX || e.deltaZ) {
    return 0;
  }

  if (e.detail && Math.abs(e.detail) < 32765) {
    return -e.detail * 20; // Legacy Moz lines
  }

  if (e.detail) {
    return (e.detail / -32765) * 60; // Legacy Moz pages
  }

  return 0;
}

// Gets normalized mouse position from a DOM event relative to the
// `container` (border excluded) or to the whole page if not specified.
export function getMousePosition(e: MouseEvent, container: HTMLElement) {
  if (!container) {
    return new Point(e.clientX, e.clientY);
  }

  const scale = getScale(container),
    offset = scale.boundingClientRect; // left and top  values are in page scale (like the event clientX/Y)

  return new Point(
    // offset.left/top values are in page scale (like clientX/Y),
    // whereas clientLeft/Top (border width) values are the original values (before CSS scale applies).
    (e.clientX - offset.left) / scale.x - container.clientLeft,
    (e.clientY - offset.top) / scale.y - container.clientTop
  );
}

// Computes the CSS scale currently applied on the element.
// Returns an object with `x` and `y` members as horizontal and vertical scales respectively,
// and `boundingClientRect` as the result of [`getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
export function getScale(element: HTMLElement) {
  const rect = element.getBoundingClientRect(); // Read-only in old browsers.

  return {
    x: rect.width / element.offsetWidth || 1,
    y: rect.height / element.offsetHeight || 1,
    boundingClientRect: rect,
  };
}
