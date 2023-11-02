import { Feature, Point, MultiLineString, Polygon } from 'geojson';
import { FeatureProperty } from './tile';
import { MapState } from '../map_state';
import { DataLayerStyle } from '../styles/styles';
import { TileFeature } from './tile_feature';
import { compileLayerStyle } from '../styles/styles_utils';

export interface TileLayerProps {
  name: string;
  features: Feature<Point | MultiLineString | Polygon>[];
  properties: Record<string, FeatureProperty>;
  styles: DataLayerStyle;
}

export class TileLayer {
  private readonly name: string;
  private readonly features: TileFeature[];
  private readonly properties: Record<string, FeatureProperty>;
  private readonly styles: DataLayerStyle;
  private compiledStyles: DataLayerStyle;

  constructor(props: TileLayerProps) {
    this.name = props.name;
    this.properties = props.properties;
    this.styles = props.styles;

    if (this.styles.feature) {
      this.features = props.features.map(
        feature =>
          new TileFeature({
            feature,
            styles: this.styles.feature,
          })
      );
    } else {
      this.features = [];
    }

    this.compiledStyles = compileLayerStyle(this.styles, {
      properties: this.properties,
    });
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
    if (!this.compiledStyles || !this.inZoomRange(mapState)) {
      return false;
    }

    if (this.compiledStyles.show !== undefined) {
      return !!this.compiledStyles.show;
    }

    return true;
  }

  public getStyles(): DataLayerStyle {
    return this.styles;
  }

  private inZoomRange(mapState: MapState): boolean {
    let inMinZoom = true;
    if (this.styles.minzoom !== undefined) {
      inMinZoom = this.styles.minzoom <= mapState.zoom;
    }

    let inMaxZoom = true;
    if (this.styles.maxzoom !== undefined) {
      inMaxZoom = this.styles.maxzoom >= mapState.zoom;
    }

    return inMinZoom && inMaxZoom;
  }
}
