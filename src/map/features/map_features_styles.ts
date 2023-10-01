import { RGBColor } from '../../webgl';

import {WaterFeatureClass, LandCoverFeatureClass,  } from './map_features';

export const WaterFeatureClassColorMap = {
  [WaterFeatureClass.ocean]: new RGBColor(95, 200, 255),
  [WaterFeatureClass.dock]: new RGBColor(95, 200, 255),
  [WaterFeatureClass.river]: new RGBColor(95, 200, 255),
  [WaterFeatureClass.lake]: new RGBColor(95, 200, 255),
  [WaterFeatureClass.swimming_pool]: new RGBColor(95, 200, 255),
};

export const LandCoverClassColorMap = {
  [LandCoverFeatureClass.farmland]: new RGBColor(173, 226, 167),
  [LandCoverFeatureClass.sand]: new RGBColor(245, 241, 241),
  [LandCoverFeatureClass.ice]: new RGBColor(233, 239, 244),
  [LandCoverFeatureClass.rock]: new RGBColor(204, 208, 205),
  [LandCoverFeatureClass.wood]: new RGBColor(180, 203, 165),
  [LandCoverFeatureClass.grass]: new RGBColor(173, 226, 167),
  [LandCoverFeatureClass.wetland]: new RGBColor(188, 232, 181),

  [LandCoverFeatureClass.crop]: new RGBColor(173, 226, 167),
  [LandCoverFeatureClass.scrub]: new RGBColor(238, 234, 231),
  [LandCoverFeatureClass.tree]: new RGBColor(194, 228, 187),
  [LandCoverFeatureClass.forest]: new RGBColor(194, 228, 187),
  [LandCoverFeatureClass.snow]: new RGBColor(233, 239, 244),
};

export const BOUNDARY_COLOR = new RGBColor(114, 113, 207);

export const BUILDING_COLOR = new RGBColor(222, 215, 211);

export const TRANSPORTATION_COLOR = new RGBColor(0, 0, 0, 1);