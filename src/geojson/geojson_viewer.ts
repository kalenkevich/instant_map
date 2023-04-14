import getBbox from '@turf/bbox';
import { Polygon } from "@turf/helpers";
import { BBox, Feature, FeatureCollection, LineString } from "geojson";
import { GlPath, GlProgram, Painter, v2, GlPathGroup } from '../gl';

// set 1
const translation: v2 = [0, 0];
const rotationInRadians = 0;

// set 2
// const translation: v2 = [0, 2138];
// const rotationInRadians = Math.PI / 2;

// set 3
// const translation: v2 = [2138, 1938];
// const rotationInRadians = Math.PI;

// set 4
// const translation: v2 = [2138, 0];
// const rotationInRadians = Math.PI * 1.5;

/** Render GeoJson (exported from OSM) on webgl. */
export const renderGeoJson = (gl: WebGLRenderingContext, geoJson: FeatureCollection) => {
	const bbox = getBbox(geoJson);
	const scale = getScale(gl.canvas.width, gl.canvas.height, bbox);
	const { roads, buildings } = getFeatures(geoJson);
	const glObjects: GlProgram[] = [
		...getGlObjectsFromRoadFeatures(gl, roads, bbox, scale),
		...getGlObjectsFromBuildingFeatures(gl, buildings, bbox, scale),
	];

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
	scale: v2,
): GlProgram[] => {
	const paths = [];
	
	for (const road of roads) {
		paths.push((road.geometry as LineString).coordinates.map(coord => getProjectedCoords(coord[0], coord[1], bbox, scale)));
	}

	const pathGroup = new GlPathGroup(gl, {
		color: [0, 0, 0, 1],
		paths,
		translation,
		rotationInRadians,
	});

	return [pathGroup];
};

export const getGlObjectsFromBuildingFeatures = (
	gl: WebGLRenderingContext,
	buildings: Feature[],
	bbox: BBox,
	scale: v2,
): GlProgram[] => {
	const paths = [];
	
	for (const building of buildings) {
		paths.push((building.geometry as Polygon).coordinates[0].map(coord => getProjectedCoords(coord[0], coord[1], bbox, scale)));
	}

	const pathGroup = new GlPathGroup(gl, {
		color: [0.3, 0.5, 1, 1],
		paths,
		lineWidth: 10,
		translation,
		rotationInRadians,
	});

	return [pathGroup];
};

const getScale = (width: number, height: number, bbox: BBox): v2 => {
	// bbox: longitude, latitude, longitude, latitude
	const lonD = bbox[2] - bbox[0];
	const latD = bbox[3] - bbox[1];

	return [width / lonD, height / latD];
};

const getProjectedCoords = (lon: number, lat: number, bbox: BBox, scale: v2): v2 => {
	const x = (lon - bbox[0]) * scale[0];
	const y = (lat - bbox[1]) * scale[1];

	return [x, y];
};