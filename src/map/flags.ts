import { FontFormatType } from './font/font_config';

export interface MapFeatureFlags {
  /** Draw tile bounds. */
  debugLayer?: boolean;

  /** Log all debug events of webgl rendrer. */
  webglRendererDebug?: boolean;

  webglRendererFontFormatType?: FontFormatType;

  enableObjectSelection?: boolean;
}
