import { Feature } from 'geojson';
import { MapState } from '../map_state';
import { DataLayerStyle } from '../styles/styles';
import { compileStyle } from '../styles/styles_utils';

type BasicFeatureProperty = string | number | boolean | undefined;
export type FeatureProperty = BasicFeatureProperty | Array<BasicFeatureProperty> | Record<string, BasicFeatureProperty>;

export interface TileLayerProps {
  name: string;
  features: Feature[];
  properties: Record<string, FeatureProperty>;
  styles?: DataLayerStyle;
}

export class TileLayer {
  private readonly name: string;
  private readonly features: Feature[];
  private readonly properties: Record<string, FeatureProperty>;
  private readonly styles?: DataLayerStyle;
  private compiledStyles?: DataLayerStyle;

  constructor(props: TileLayerProps) {
    this.name = props.name;
    this.features = props.features;
    this.properties = props.properties;
    this.styles = props.styles;

    if (this.styles) {
      this.compiledStyles = compileStyle(this.styles, {
        properties: this.properties,
      });
    }
  }

  public isEmpty(): boolean {
    return this.features.length === 0;
  }

  public getFeatures(): Feature[] {
    return this.features;
  }

  public shouldBeRendered(mapState: MapState): boolean {
    if (!this.compiledStyles) {
      return false;
    }

    return !this.compiledStyles.hide;
  }
}
