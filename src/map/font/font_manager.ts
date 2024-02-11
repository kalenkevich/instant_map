import { Font, parse as parseFont } from 'opentype.js';
import { FontsConfig } from './font_config';
import { MapFeatureFlags } from '../flags';
export type FontManagerState = Record<string, ArrayBuffer>;

const fetchFont = async function (fontUrl: string): Promise<ArrayBuffer> {
  return fetch(fontUrl).then(res => res.arrayBuffer());
};

export class FontManager {
  private fontSourceMap: FontManagerState = {};
  private fontMap: Record<string, Font> = {};

  constructor(private readonly featureFlags: MapFeatureFlags, private readonly fontsConfig: FontsConfig = {}) {}

  static fromState(featureFlags: MapFeatureFlags, state: FontManagerState) {
    const fontManager = new FontManager(featureFlags);

    for (const fontName of Object.keys(state)) {
      fontManager.initFont(fontName, state[fontName]);
    }

    return fontManager;
  }

  async init() {
    const promises = [];

    for (const fontConfig of Object.values(this.fontsConfig)) {
      if (fontConfig.source) {
        promises.push(
          fetchFont(fontConfig.source).then(fontSource => {
            this.initFont(fontConfig.name, fontSource);
          })
        );
      }
    }

    return Promise.all(promises).then(() => {});
  }

  destroy() {}

  initFont(fontName: string, fontSource: ArrayBuffer) {
    this.fontSourceMap[fontName] = fontSource;
    this.fontMap[fontName] = parseFont(fontSource);
  }

  getFont(fontName: string): Font | undefined {
    return this.fontMap[fontName];
  }

  dumpState(): FontManagerState {
    return this.fontSourceMap;
  }
}
