import {describe, expect, it} from '@jest/globals';
import {getCrs} from '../../../src/map/map';
import { EarthCoordinateReferenceSystem } from '../../../src/map/geo/crs/earth_crs';
import { MapCrsType } from '../../../src/map/types';

describe('getCrs', () => {
  it('should return default crs.', () => {
    const crs = getCrs();

    expect(crs instanceof EarthCoordinateReferenceSystem).toBeTruthy();
  });

  it('should return earth crs.', () => {
    const crs = getCrs(MapCrsType.earth);

    expect(crs instanceof EarthCoordinateReferenceSystem).toBeTruthy();
  });

  it('should return same crs if it was alredy defined.', () => {
    const crs = new EarthCoordinateReferenceSystem();

    expect(getCrs(crs)).toBe(crs);
  });
});
