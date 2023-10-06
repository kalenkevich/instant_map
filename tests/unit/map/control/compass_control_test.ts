import { JSDOM } from 'jsdom';
import {describe, expect, it, jest} from '@jest/globals';
import { GlideMap } from '../../../../src/map/map';
import { CompassControl } from '../../../../src/map/controls/compass_control';

describe('CompassControl', () => {
  const document = new JSDOM('<!DOCTYPE html><html><body></body></html>').window.document;
  let fakeMap: GlideMap;
  let rootEl: HTMLElement;

  beforeEach(() => {
    rootEl = document.createElement('div');
    fakeMap = {
      getRotation() {
        return 0;
      }
    } as unknown as GlideMap;
  });

  it('should be attached to the parent el as a child.', () => {
    const getRotationSpy = jest.spyOn(fakeMap, 'getRotation').mockReturnValue(0);
    const rootElAppedChildSpy = jest.spyOn(rootEl, 'appendChild').mockReturnValue(null);
    const compassControl = new CompassControl(fakeMap, document);

    compassControl.init();
    compassControl.attach(rootEl);

    expect(rootElAppedChildSpy).toBeCalled();
    expect(getRotationSpy).toBeCalled();
  });
});