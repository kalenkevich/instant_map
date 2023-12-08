import { JSDOM } from 'jsdom';
import { describe, expect, it, jest } from '@jest/globals';
import { GlideMap } from '../../../../src/map/map';
import { ZoomControl } from '../../../../src/map/controls/zoom_control';
import { LngLat } from '../../../../src/map/geo/lng_lat';

describe('ZoomControl', () => {
  let document: Document;
  let fakeMap: GlideMap;
  let rootEl: HTMLElement;
  const mapCenter = new LngLat(0, 0);

  beforeEach(() => {
    document = new JSDOM('<!DOCTYPE html><html><body></body></html>').window.document;
    rootEl = document.body;
    fakeMap = {
      zoom: 0,
      getCenter() {
        return mapCenter;
      },
      zoomToPoint() {},
      setZoom() {},
      getZoom() {
        return Promise.resolve();
      },
    } as unknown as GlideMap;
  });

  it('should be attached to the parent el as a child.', () => {
    const rootElAppendChildSpy = jest.spyOn(rootEl, 'appendChild').mockReturnValue(null);
    const zoomControl = new ZoomControl(fakeMap, document);

    zoomControl.attach(rootEl);

    expect(rootElAppendChildSpy).toBeCalled();
  });

  it('should be removed from the parent el as a child on destroy.', () => {
    jest.spyOn(rootEl, 'appendChild').mockReturnValue(null);
    const rootElRemoveChild = jest.spyOn(rootEl, 'removeChild').mockReturnValue(null);
    const zoomControl = new ZoomControl(fakeMap, document);

    zoomControl.attach(rootEl);
    zoomControl.destroy(rootEl);

    expect(rootElRemoveChild).toBeCalled();
  });

  it('should increase map zoom on +0.5 on "zoom in" button click.', () => {
    const zoomToPointSpy = jest.spyOn(fakeMap, 'zoomToPoint').mockReturnValue(Promise.resolve());
    const getZoomSpy = jest.spyOn(fakeMap, 'getZoom').mockReturnValue(0);
    const zoomControl = new ZoomControl(fakeMap, document);

    zoomControl.init();
    zoomControl.attach(rootEl);

    const plusZoomButton: HTMLButtonElement = document.querySelector('.zoom-plus');
    plusZoomButton.click();

    expect(getZoomSpy).toBeCalled();
    expect(zoomToPointSpy.mock.calls[0][0]).toEqual(0.5);
  });

  it('should decrease map zoom on -0.5 on "zoom out" button click.', () => {
    const zoomToPointSpy = jest.spyOn(fakeMap, 'zoomToPoint').mockReturnValue(Promise.resolve());
    const getZoomSpy = jest.spyOn(fakeMap, 'getZoom').mockReturnValue(2);
    const zoomControl = new ZoomControl(fakeMap, document);

    zoomControl.init();
    zoomControl.attach(rootEl);

    const minusZoomButton: HTMLButtonElement = document.querySelector('.zoom-minus');
    minusZoomButton.click();

    expect(getZoomSpy).toBeCalled();
    expect(zoomToPointSpy.mock.calls[0][0]).toEqual(1.5);
  });
});
