import { JSDOM } from 'jsdom';
import { describe, expect, it, jest } from '@jest/globals';
import { GlideMap } from '../../../../src/map/map';
import { ZoomControl } from '../../../../src/map/controls/zoom_control';

describe('ZoomControl', () => {
  let document: Document;
  let fakeMap: GlideMap;
  let rootEl: HTMLElement;

  beforeEach(() => {
    document = new JSDOM('<!DOCTYPE html><html><body></body></html>').window.document;
    rootEl = document.body;
    fakeMap = {
      zoom: 0,
      setZoom() {},
      getZoom() {
        return Promise.resolve();
      }
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

  it('should increase map zoom on +0.2 on "zoom in" button click.', () => {
    const setZoomSpy = jest.spyOn(fakeMap, 'setZoom').mockReturnValue(Promise.resolve());
    const getZoomSpy = jest.spyOn(fakeMap, 'getZoom').mockReturnValue(0);
    const zoomControl = new ZoomControl(fakeMap, document);

    zoomControl.init();
    zoomControl.attach(rootEl);

    const plusZoomButton: HTMLButtonElement = document.querySelector('.zoom-plus');
    plusZoomButton.click();

    expect(getZoomSpy).toBeCalled();
    expect(setZoomSpy).toBeCalledWith(0.2);
  });

  it('should decrease map zoom on -0.2 on "zoom out" button click.', () => {
    const setZoomSpy = jest.spyOn(fakeMap, 'setZoom').mockReturnValue(Promise.resolve());
    const getZoomSpy = jest.spyOn(fakeMap, 'getZoom').mockReturnValue(1);
    const zoomControl = new ZoomControl(fakeMap, document);

    zoomControl.init();
    zoomControl.attach(rootEl);

    const munusZoomButton: HTMLButtonElement = document.querySelector('.zoom-minus');
    munusZoomButton.click();

    expect(getZoomSpy).toBeCalled();
    expect(setZoomSpy).toBeCalledWith(0.8);
  });
});
