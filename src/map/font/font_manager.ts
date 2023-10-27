import { parse, Font } from 'opentype.js';
import * as RobotoRegular from './roboto_regular.ttf';
import * as OpenSansRegular from './opensans_regular.ttf';

export class FontManager {
  private readonly fontsMap: Record<string, Font> = {};

  constructor() {}

  init() {
    this.fontsMap['roboto'] = parse(RobotoRegular);
    this.fontsMap['opensans'] = parse(OpenSansRegular);
  }

  getFont(name: string): Font {
    if (!this.fontsMap[name]) {
      throw new Error(`Font ${name} was not found.`);
    }

    return this.fontsMap[name];
  }
}
