import { vec4, vec2 } from 'gl-matrix';
import { MapTileFeatureType } from '../../../../tile/tile';
import { WebGlObject } from '../object/object';
import { PointMargin } from '../point/point';

export interface WebGlText extends WebGlObject {
  id: number;
  type: MapTileFeatureType.text;
  color: vec4;
  font: string;
  fontSize: number;
  text: string;
  center: vec2 | [number, number];
  margin?: PointMargin;

  // TODO: support this
  borderWidth: number;
  borderColor: vec4;
}
