import getBbox from '@turf/bbox';
import { Polygon } from '@turf/helpers';
import { BBox, Feature, FeatureCollection, LineString } from 'geojson';
import { GlProgram, WebGlPainter, v2, WebGlPathGroup, GL_COLOR_BLACK, GL_COLOR_BLUE_200 } from '../webgl';

// set 1
const translation: v2 = [0, 0];
const rotationInRadians = 0;
const scale: v2 = [1, 1];

// set 2
// const translation: v2 = [0, 2138];
// const rotationInRadians = Math.PI / 2;
// const scale: v2 = [1, 1];

// set 3
// const translation: v2 = [2138, 1938];
// const rotationInRadians = Math.PI;
// const scale: v2 = [1, 1];

// set 4
// const translation: v2 = [2138, 0];
// const rotationInRadians = Math.PI * 1.5;
// const scale: v2 = [1, 1];

/** Render GeoJson (exported from OSM) on webgl. */
export const renderGeoJson = (gl: WebGLRenderingContext, geoJson: FeatureCollection) => {
  const bbox = getBbox(geoJson);
  const projectionScale = getProjectionScale(gl.canvas.width, gl.canvas.height, bbox);
  const { roads, buildings } = getFeatures(geoJson);
  const glObjects: GlProgram[] = [
    ...getGlObjectsFromRoadFeatures(gl, roads, bbox, projectionScale),
    ...getGlObjectsFromBuildingFeatures(gl, buildings, bbox, projectionScale),
  ];

  const painter = new WebGlPainter(gl, glObjects);
  painter.init();
  painter.draw();
};

/** Extract roads, building, etc features from OSM GeoJson. */
export const getFeatures = (geoJson: FeatureCollection) => {
  const roads: Feature[] = [];
  const buildings: Feature[] = [];

  for (const feature of geoJson.features) {
    if (!!feature.properties['highway']) {
      roads.push(feature);
      continue;
    }

    if (!!feature.properties['building']) {
      buildings.push(feature);
      continue;
    }
  }

  return {
    roads,
    buildings,
  };
};

export const getGlObjectsFromRoadFeatures = (gl: WebGLRenderingContext, roads: Feature[], bbox: BBox, projectionScale: v2): GlProgram[] => {
  const paths = [];

  for (const road of roads) {
    paths.push((road.geometry as LineString).coordinates.map(coord => getProjectedCoords(coord[0], coord[1], bbox, projectionScale)));
  }

  const pathGroup = new WebGlPathGroup({
    color: GL_COLOR_BLACK,
    paths,
    scale,
    translation,
    rotationInRadians,
  });

  return [pathGroup];
};

export const getGlObjectsFromBuildingFeatures = (gl: WebGLRenderingContext, buildings: Feature[], bbox: BBox, projectionScale: v2): GlProgram[] => {
  const paths = [];

  for (const building of buildings) {
    paths.push((building.geometry as Polygon).coordinates[0].map(coord => getProjectedCoords(coord[0], coord[1], bbox, projectionScale)));
  }

  const pathGroup = new WebGlPathGroup({
    color: GL_COLOR_BLUE_200,
    paths,
    scale,
    translation,
    rotationInRadians,
  });

  return [pathGroup];
};

const getProjectionScale = (width: number, height: number, bbox: BBox): v2 => {
  // bbox: longitude, latitude, longitude, latitude
  const lonD = bbox[2] - bbox[0];
  const latD = bbox[3] - bbox[1];

  return [width / lonD, height / latD];
};

const getProjectedCoords = (lon: number, lat: number, bbox: BBox, projectionScale: v2): v2 => {
  const x = (lon - bbox[0]) * projectionScale[0];
  const y = (lat - bbox[1]) * projectionScale[1];

  return [x, y];
};
