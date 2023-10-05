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
    fakeMap = {} as unknown as GlideMap;
  });

  it('should be attached to the parent el as a child.', () => {
    const rootElAppedChildSpy = jest.spyOn(rootEl, 'appendChild').mockReturnValue(null);
    const compassControl = new CompassControl(fakeMap, document);

    compassControl.init();
    compassControl.attach(rootEl);

    expect(rootElAppedChildSpy).toBeCalled();
  });
});