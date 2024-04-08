export interface MapFeatureFlags {
  /** Draw tile bounds. */
  debugLayer?: boolean;

  /** Log all debug events of webgl rendrer. */
  webglRendererDebug?: boolean;

  // Enables maps object selection behaviour.
  enableObjectSelection?: boolean;

  // Renders textures and attaches it to the html dom.
  fontManagerDebugModeEnabled?: boolean;
}
