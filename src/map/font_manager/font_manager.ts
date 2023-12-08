import { Font, parse as parseFont } from 'opentype.js';

export type FontManagerConfig = Record<string, string>; // font name -> url map;
export type FontManagerState = Record<string, ArrayBuffer>;

const FONT_NAME_URL_MAP: FontManagerConfig = {
  arial: './fonts/arial_regular.ttf',
  roboto: './fonts/roboto_regular.ttf',
  opensans: './fonts/opensans_regular.ttf',
  opensansBold: './fonts/opensans_bold.ttf',
};

const fetchFont = async function (fontUrl: string): Promise<ArrayBuffer> {
  return fetch(fontUrl).then(res => res.arrayBuffer());
};

export class FontManager {
  private fontSourceMap: FontManagerState = {};
  private fontMap: Record<string, Font> = {};

  constructor(private readonly fontNameMap: FontManagerConfig = FONT_NAME_URL_MAP) {}

  static fromState(state: FontManagerState) {
    const fontManager = new FontManager();

    for (const fontName of Object.keys(state)) {
      fontManager.initFont(fontName, state[fontName]);
    }

    return fontManager;
  }

  async init() {
    const promises = [];

    for (const fontName of Object.keys(this.fontNameMap)) {
      const fontUrl = this.fontNameMap[fontName];

      if (fontUrl) {
        promises.push(
          fetchFont(fontUrl).then(fontSource => {
            this.initFont(fontName, fontSource);
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
