import { Feature, GeoJsonProperties, MultiLineString } from 'geojson';
import { MapState } from '../map_state';
import { FeatureStyle } from '../styles/styles';
import { compileFeatureStyle } from '../styles/styles_utils';

export interface TileFeatureProps {
  feature: Feature;
  styles?: FeatureStyle;
}

export class TileFeature {
  private readonly feature: Feature;
  private readonly styles?: FeatureStyle;
  private compiledStyles?: FeatureStyle;

  constructor(props: TileFeatureProps) {
    this.feature = props.feature;
    this.styles = props.styles;

    if (this.styles) {
      this.compiledStyles = compileFeatureStyle(this.styles, this.feature);
    }
  }

  public getProperties(): GeoJsonProperties {
    return this.feature.properties;
  }

  public getGeometry(): MultiLineString {
    return this.feature.geometry as MultiLineString;
  }

  public getGeoJsonFeature(): Feature {
    return this.feature;
  }

  public shouldBeRendered(mapState: MapState): boolean {
    if (!this.compiledStyles || !this.inZoomRange(mapState)) {
      return false;
    }

    if (this.compiledStyles.show === false) {
      return false;
    }

    return true;
  }

  public getStyles(): FeatureStyle {
    return this.styles;
  }

  private inZoomRange(mapState: MapState): boolean {
    if (this.styles.minzoom !== undefined) {
      return this.styles.minzoom <= mapState.zoom;
    }

    if (this.styles.maxzoom !== undefined) {
      return this.styles.maxzoom >= mapState.zoom;
    }

    return true;
  }
}
