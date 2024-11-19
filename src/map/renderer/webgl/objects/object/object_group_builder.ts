import { WebGlObjectBufferredGroup } from './object';
import { MapFeature } from '../../../../tile/feature';
import { MapFeatureFlags } from '../../../../flags';
import { FontManager } from '../../../../font/font_manager';
import { GlyphsManager } from '../../../../glyphs/glyphs_manager';

export enum VERTEX_QUAD_POSITION {
  TOP_LEFT = 0,
  TOP_RIGHT = 1,
  BOTTOM_LEFT = 2,
  BOTTOM_RIGHT = 3,
}

export interface ObjectGroupBuilderOptions {
  devicePixelRatio: number;
  featureFlags: MapFeatureFlags;
  glyphsManager?: GlyphsManager;
  fontManager?: FontManager;
}

export type ObjectGroupBuilder<
  InputObjectType extends MapFeature,
  OutputObjectType extends WebGlObjectBufferredGroup,
> = (
  objects: InputObjectType[],
  name: string,
  zIndex: number,
  options: ObjectGroupBuilderOptions,
) => OutputObjectType[];
