import { parse, Font } from 'opentype.js';
import * as RobotoRegularFontArrayBuffer from './roboto_regular.ttf';

export class FontManager {
  private readonly fontsMap: Record<string, Font> = {};

  constructor() {}

  init() {
    this.fontsMap['roboto'] = parse(RobotoRegularFontArrayBuffer);
  }

  getFont(name: string): Font | undefined {
    return this.fontsMap[name];
  }
}
