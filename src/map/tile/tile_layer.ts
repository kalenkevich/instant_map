import { Feature } from 'geojson';
import { FeatureProperty } from './tile';
import { MapState } from '../map_state';
import { DataLayerStyle } from '../styles/styles';
import { compileLayerStyle } from '../styles/styles_utils';
import { TileFeature } from './tile_feature';

export interface TileLayerProps {
  name: string;
  features: Feature[];
  properties: Record<string, FeatureProperty>;
  styles?: DataLayerStyle;
}

export class TileLayer {
  private readonly name: string;
  private readonly features: TileFeature[];
  private readonly properties: Record<string, FeatureProperty>;
  private readonly styles?: DataLayerStyle;
  private compiledStyles?: DataLayerStyle;

  constructor(props: TileLayerProps) {
    this.name = props.name;
    this.properties = props.properties;
    this.styles = props.styles;

    this.features = props.features.map(
      feature =>
        new TileFeature({
          feature,
          styles: this.styles.feature,
        })
    );

    if (this.styles) {
      this.compiledStyles = compileLayerStyle(this.styles, {
        properties: this.properties,
      });
    }
  }

  public getName(): string {
    return this.name;
  }

  public isEmpty(): boolean {
    return this.features.length === 0;
  }

  public getFeatures(): TileFeature[] {
    return this.features;
  }

  public shouldBeRendered(mapState: MapState): boolean {
    return !this.compiledStyles.hide;
  }

  public getStyles(): DataLayerStyle {
    return this.styles;
  }
}
