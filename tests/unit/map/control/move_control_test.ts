import { JSDOM } from 'jsdom';
import { describe, expect, it, jest } from '@jest/globals';
import { GlideMap } from '../../../../src/map/map';
import { MoveControl } from '../../../../src/map/controls/move_control';

describe('MoveControl', () => {
  let document: Document;
  let fakeMap: GlideMap;
  let rootEl: HTMLElement;

  beforeEach(() => {
    document = new JSDOM('<!DOCTYPE html><html><body></body></html>').window.document;
    rootEl = document.body;
    fakeMap = {
      async panBy() {},
    } as unknown as GlideMap;
  });

  it('should be attached to the parent el as a child.', () => {
    const rootElAppendChildSpy = jest.spyOn(rootEl, 'appendChild').mockReturnValue(null);
    const zoomControl = new MoveControl(fakeMap, document);

    zoomControl.attach(rootEl);

    expect(rootElAppendChildSpy).toBeCalled();
  });

  it('should be removed from the parent el as a child on destroy.', () => {
    jest.spyOn(rootEl, 'appendChild').mockReturnValue(null);
    const rootElRemoveChild = jest.spyOn(rootEl, 'removeChild').mockReturnValue(null);
    const zoomControl = new MoveControl(fakeMap, document);

    zoomControl.attach(rootEl);
    zoomControl.destroy(rootEl);

    expect(rootElRemoveChild).toBeCalled();
  });

  it('should move map up on the "up button" click.', () => {
    const panBySpy = jest.spyOn(fakeMap, 'panBy').mockReturnValue(Promise.resolve());
    const moveControl = new MoveControl(fakeMap, document);

    moveControl.init();
    moveControl.attach(rootEl);

    const upMoveButton: HTMLButtonElement = document.querySelector('.move-up');
    upMoveButton.click();

    expect(panBySpy).toBeCalledWith(
      expect.objectContaining({
        x: 0,
        y: -512,
      }),
      { animate: false }
    );
  });

  it('should move map down on the "down button" click.', () => {
    const panBySpy = jest.spyOn(fakeMap, 'panBy').mockReturnValue(Promise.resolve());
    const moveControl = new MoveControl(fakeMap, document);

    moveControl.init();
    moveControl.attach(rootEl);

    const upMoveButton: HTMLButtonElement = document.querySelector('.move-down');
    upMoveButton.click();

    expect(panBySpy).toBeCalledWith(
      expect.objectContaining({
        x: 0,
        y: 512,
      }),
      { animate: false }
    );
  });

  it('should move map left on the "left button" click.', () => {
    const panBySpy = jest.spyOn(fakeMap, 'panBy').mockReturnValue(Promise.resolve());
    const moveControl = new MoveControl(fakeMap, document);

    moveControl.init();
    moveControl.attach(rootEl);

    const upMoveButton: HTMLButtonElement = document.querySelector('.move-left');
    upMoveButton.click();

    expect(panBySpy).toBeCalledWith(
      expect.objectContaining({
        x: -512,
        y: 0,
      }),
      { animate: false }
    );
  });

  it('should move map right on the "right button" click.', () => {
    const panBySpy = jest.spyOn(fakeMap, 'panBy').mockReturnValue(Promise.resolve());
    const moveControl = new MoveControl(fakeMap, document);

    moveControl.init();
    moveControl.attach(rootEl);

    const upMoveButton: HTMLButtonElement = document.querySelector('.move-right');
    upMoveButton.click();

    expect(panBySpy).toBeCalledWith(
      expect.objectContaining({
        x: 512,
        y: 0,
      }),
      { animate: false }
    );
  });
});
