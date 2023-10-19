import { Feature, GeoJsonProperties, Point, MultiLineString, Polygon } from 'geojson';
import { MapState } from '../map_state';
import { FeatureStyle } from '../styles/styles';
import { compileFeatureStyle } from '../styles/styles_utils';
import { compileStatement } from '../styles/style_statement_utils';

export interface TileFeatureProps {
  feature: Feature<Point | MultiLineString | Polygon>;
  styles?: FeatureStyle;
}

export class TileFeature {
  private readonly feature: Feature<Point | MultiLineString | Polygon>;
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

  public getGeometry(): Point | MultiLineString | Polygon {
    return this.feature.geometry;
  }

  public getGeoJsonFeature(): Feature {
    return this.feature;
  }

  public shouldBeRendered(mapState: MapState): boolean {
    if (!this.compiledStyles || !this.inZoomRange(mapState)) {
      return false;
    }

    if (this.styles.show !== undefined) {
      return compileStatement(this.styles.show, {
        ...this.feature,
        mapState,
      });
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
