import { FeatureCollection, Feature, LineString, BBox } from "geojson";
import { project } from "equirectangular-projection";
import { mercator } from 'projections';
import getBbox from '@turf/bbox';
import { GlProgram, GlPath, GlRectangle, Painter, v2 } from '../gl';
import { Polygon } from "@turf/helpers";

/** Render GeoJson (exported from OSM) on webgl. */
export const renderGeoJson = (gl: WebGLRenderingContext, geoJson: FeatureCollection) => {
	const bbox = getBbox(geoJson);
	const scale = getScale(gl.drawingBufferWidth, gl.drawingBufferHeight, bbox);
	const { roads, buildings } = getFeatures(geoJson);
	const glObjects: GlProgram[] = [
		...getGlObjectsFromRoadFeatures(gl, roads, bbox, scale),
		...getGlObjectsFromBuildingFeatures(gl, buildings, bbox, scale),
	];

	console.log(glObjects);

	const painter = new Painter(gl, glObjects);
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

export const getGlObjectsFromRoadFeatures = (
	gl: WebGLRenderingContext,
	roads: Feature[],
	bbox: BBox,
	scale: number,
): GlProgram[] => {
	const paths: GlPath[] = [];

	for (const road of roads) {
		const path = new GlPath(gl, {
			color: [0, 0, 0, 1],
			points: (road.geometry as LineString).coordinates.map(coord => getProjectedCoords(coord[0], coord[1], bbox, scale)),
		});

		paths.push(path);
	}

	return paths;
};

export const getGlObjectsFromBuildingFeatures = (
	gl: WebGLRenderingContext,
	buildings: Feature[],
	bbox: BBox,
	scale: number,
): GlProgram[] => {
	const paths: GlPath[] = [];

	for (const building of buildings) {
		const path = new GlPath(gl, {
			color: [0.3, 0.5, 1, 1],
			points: (building.geometry as Polygon).coordinates[0].map(coord => getProjectedCoords(coord[0], coord[1], bbox, scale)),
		});

		paths.push(path);
	}

	return paths;
};

const getScale = (width: number, height: number, bbox: BBox): number => {
	// bbox: longitude, latitude, longitude, latitude
	const lonD = bbox[2] - bbox[0];
	const latD = bbox[3] - bbox[1];

	//return height / latD;
	return width / lonD;
};

const getProjectedCoords = (lon: number, lat: number, bbox: BBox, scale: number): v2 => {
  // x coord: (lon.posA - lon.lowerLeft) * scale;
	// y coord: (lat.posA - lat.lowerLeft) * scale;

	//const {x, y} = mercator({lon, lat});
	// const x = (lon - bbox[0]) * scale;
	// const y = (lat - bbox[1]) * scale;
	const myScale = 10500;
	const x = (lon - bbox[0]) * myScale - 5500;
	const y = (lat - bbox[1]) * myScale - 3400;
 
	return [x, y];
};