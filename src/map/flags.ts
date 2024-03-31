import { FontFormatType } from './font/font_config';

export interface MapFeatureFlags {
  /** Draw tile bounds. */
  debugLayer?: boolean;

  /** Log all debug events of webgl rendrer. */
  webglRendererDebug?: boolean;

  /** Use new approach with shader lines. */
  webglRendererUseShaderLines?: boolean;

  webglRendererFontFormatType?: FontFormatType;

  // Enables maps object selection behaviour.
  enableObjectSelection?: boolean;

  // Renders textures and attaches it to the html dom.
  fontManagerDebugModeEnabled?: boolean;
}
