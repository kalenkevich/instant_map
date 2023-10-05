import { JSDOM } from 'jsdom';
import {describe, expect, it, jest} from '@jest/globals';
import { GlideMap } from '../../../../src/map/map';
import { ZoomControl } from '../../../../src/map/controls/zoom_control';

describe('ZoomControl', () => {
  const document = new JSDOM('<!DOCTYPE html><html><body></body></html>').window.document;
  let fakeMap: GlideMap;
  let rootEl: HTMLElement;

  beforeEach(() => {
    rootEl = document.createElement('div');
    fakeMap = {
      zoom: 0,
      setZoom() {},
      getZoom() {
        return Promise.resolve();
      }
    } as unknown as GlideMap;
  });

  it('should be attached to the parent el as a child.', () => {
    const rootElAppedChildSpy = jest.spyOn(rootEl, 'appendChild').mockReturnValue(null);
    const zoomControl = new ZoomControl(fakeMap);

    zoomControl.attach(rootEl);

    expect(rootElAppedChildSpy).toBeCalled();
  });

  it.skip('should increase zoom to map to +0.2 on plus button click', () => {
    const setZoomSpy = jest.spyOn(fakeMap, 'setZoom').mockReturnValue(Promise.resolve());
    const getZoomSpy = jest.spyOn(fakeMap, 'getZoom').mockReturnValue(0);
    const zoomControl = new ZoomControl(fakeMap, document);

    zoomControl.init();
    zoomControl.attach(rootEl);

    const plusZoomButton: HTMLButtonElement = document.querySelector('.zoom-plus');
    plusZoomButton.click();

    expect(getZoomSpy).toBeCalled();
    expect(setZoomSpy).toBeCalledWith(0.2);

    plusZoomButton.click();

    expect(setZoomSpy).toBeCalledWith(0.4);
  });

  it.skip('should decrease zoom to map to -0.2 on minus button click', () => {
    const setZoomSpy = jest.spyOn(fakeMap, 'setZoom').mockReturnValue(Promise.resolve());
    const getZoomSpy = jest.spyOn(fakeMap, 'getZoom').mockReturnValue(1);
    const zoomControl = new ZoomControl(fakeMap, document);

    zoomControl.init();
    zoomControl.attach(rootEl);

    const munusZoomButton: HTMLButtonElement = document.querySelector('.zoom-minus');
    munusZoomButton.click();

    expect(getZoomSpy).toBeCalled();
    expect(setZoomSpy).toBeCalledWith(0.8);

    munusZoomButton.click();

    expect(setZoomSpy).toBeCalledWith(0.6);
  });
});
