import { MapFeatureFlags } from '../map/flags';
import { FontFormatType } from '../map/font/font_config';

export const ENABLED_FEATURE_FLAGS: MapFeatureFlags = {
  debugLayer: false,
  webglRendererDebug: false,
  webglRendererUseShaderLines: true,
  webglRendererFontFormatType: FontFormatType.texture,
  enableObjectSelection: false,
};
