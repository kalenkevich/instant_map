import { DataTileStyles, FeatureStyleType } from '../map/styles/styles';

export const VectorStyles: DataTileStyles = {
  water: {
    sourceLayer: 'water',
    styleLayerName: 'waterStyles',
    zIndex: 0,
    feature: {
      type: FeatureStyleType.polygon,
      color: [
        '$switch',
        ['$get', 'properties.class'],
        ['ocean', ['$rgba', 95, 200, 255, 1]],
        ['dock', ['$rgba', 95, 200, 255, 1]],
        ['river', ['$rgba', 95, 200, 255, 1]],
        ['lake', ['$rgba', 95, 200, 255, 1]],
        ['swimming_pool', ['$rgba', 95, 200, 255, 1]],
        ['$default', ['$rgba', 95, 200, 255, 1]],
      ],
    },
    maxzoom: 15,
    minzoom: 0,
  },
  globallandcover: {
    sourceLayer: 'globallandcover',
    styleLayerName: 'globallandcoverStyles',
    zIndex: 1,
    feature: {
      type: FeatureStyleType.polygon,
      color: [
        '$switch',
        ['$get', 'properties.class'],
        ['farmland', ['$rgba', 173, 226, 167, 1]],
        ['sand', ['$rgba', 245, 241, 241, 1]],
        ['ice', ['$rgba', 233, 239, 244, 1]],
        ['rock', ['$rgba', 204, 208, 205, 1]],
        ['wood', ['$rgba', 180, 203, 165, 1]],
        ['grass', ['$rgba', 173, 226, 167, 1]],
        ['wetland', ['$rgba', 188, 232, 181, 1]],
        ['crop', ['$rgba', 173, 226, 167, 1]],
        ['scrub', ['$rgba', 238, 234, 231, 1]],
        ['tree', ['$rgba', 194, 228, 187, 1]],
        ['forest', ['$rgba', 194, 228, 187, 1]],
        ['snow', ['$rgba', 233, 239, 244, 1]],
        ['$default', ['$rgba', 173, 226, 167, 1]],
      ],
      show: [
        '$oneOf',
        ['$get', 'properties.class'],
        'farmland',
        'sand',
        'ice',
        'rock',
        'wood',
        'grass',
        'wetland',
        'crop',
        'scrub',
        'tree',
        'forest',
        'snow',
      ],
    },
    maxzoom: 9,
    minzoom: 0,
  },
  landcover: {
    sourceLayer: 'landcover',
    styleLayerName: 'landcoverStyles',
    zIndex: 1,
    feature: {
      type: FeatureStyleType.polygon,
      color: [
        '$switch',
        ['$get', 'properties.class'],
        ['farmland', ['$rgba', 173, 226, 167, 1]],
        ['sand', ['$rgba', 245, 241, 241, 1]],
        ['ice', ['$rgba', 233, 239, 244, 1]],
        ['rock', ['$rgba', 204, 208, 205, 1]],
        ['wood', ['$rgba', 180, 203, 165, 1]],
        ['grass', ['$rgba', 173, 226, 167, 1]],
        ['wetland', ['$rgba', 188, 232, 181, 1]],
        ['crop', ['$rgba', 173, 226, 167, 1]],
        ['scrub', ['$rgba', 238, 234, 231, 1]],
        ['tree', ['$rgba', 194, 228, 187, 1]],
        ['forest', ['$rgba', 194, 228, 187, 1]],
        ['snow', ['$rgba', 233, 239, 244, 1]],
        ['$default', ['$rgba', 173, 226, 167, 1]],
      ],
      show: [
        '$oneOf',
        ['$get', 'properties.class'],
        'farmland',
        'sand',
        'ice',
        'rock',
        'wood',
        'grass',
        'wetland',
        'crop',
        'scrub',
        'tree',
        'forest',
        'snow',
      ],
    },
    maxzoom: 15,
    minzoom: 0,
  },
  boundary: {
    sourceLayer: 'boundary',
    styleLayerName: 'boundaryStyles',
    show: false,
    zIndex: 3,
    feature: {
      type: FeatureStyleType.line,
      color: ['$rgba', 114, 113, 207, 1],
      show: [
        '$switch',
        ['$get', 'properties.admin_level'],
        [
          2,
          [
            '$if',
            ['$and', ['$gte', ['$get', 'mapState.zoom'], 0], ['$lte', ['$get', 'mapState.zoom'], 2]],
            true,
            false,
          ],
        ],
        [
          3,
          [
            '$if',
            ['$and', ['$gte', ['$get', 'mapState.zoom'], 2], ['$lte', ['$get', 'mapState.zoom'], 3]],
            true,
            false,
          ],
        ],
        [
          4,
          [
            '$if',
            ['$and', ['$gte', ['$get', 'mapState.zoom'], 3], ['$lte', ['$get', 'mapState.zoom'], 4]],
            true,
            false,
          ],
        ],
        [
          5,
          [
            '$if',
            ['$and', ['$gte', ['$get', 'mapState.zoom'], 4], ['$lte', ['$get', 'mapState.zoom'], 5]],
            true,
            false,
          ],
        ],
        [
          6,
          [
            '$if',
            ['$and', ['$gte', ['$get', 'mapState.zoom'], 5], ['$lte', ['$get', 'mapState.zoom'], 6]],
            true,
            false,
          ],
        ],
        [
          7,
          [
            '$if',
            ['$and', ['$gte', ['$get', 'mapState.zoom'], 6], ['$lte', ['$get', 'mapState.zoom'], 7]],
            true,
            false,
          ],
        ],
        [
          8,
          [
            '$if',
            ['$and', ['$gte', ['$get', 'mapState.zoom'], 7], ['$lte', ['$get', 'mapState.zoom'], 8]],
            true,
            false,
          ],
        ],
        [
          9,
          [
            '$if',
            ['$and', ['$gte', ['$get', 'mapState.zoom'], 8], ['$lte', ['$get', 'mapState.zoom'], 9]],
            true,
            false,
          ],
        ],
        [
          10,
          [
            '$if',
            ['$and', ['$gte', ['$get', 'mapState.zoom'], 9], ['$lte', ['$get', 'mapState.zoom'], 20]],
            true,
            false,
          ],
        ],
      ],
    },
    maxzoom: 15,
    minzoom: 0,
  },
  building: {
    sourceLayer: 'building',
    styleLayerName: 'buildingStyles',
    zIndex: 2,
    feature: {
      type: FeatureStyleType.polygon,
      color: ['$rgba', 222, 215, 211, 1],
    },
    minzoom: 15,
  },
  transportation: {
    sourceLayer: 'transportation',
    styleLayerName: 'transportationStyles',
    zIndex: 2,
    show: true,
    feature: {
      type: FeatureStyleType.line,
      color: [
        '$switch',
        ['$get', 'properties.class'],
        ['primary', ['$rgba', 233, 201, 43, 1]],
        ['secondary', ['$rgba', 233, 201, 43, 1]],
        ['motorway', ['$rgba', 233, 201, 43, 1]],
        ['service', ['$rgba', 215, 218, 226, 1]],
        ['path', ['$rgba', 215, 218, 226, 1]],
        ['minor', ['$rgba', 215, 218, 226, 1]],
      ],
      width: [
        '$switch',
        ['$get', 'properties.class'],
        ['primary', 50],
        ['secondary', 30],
        ['motorway', 30],
        ['service', 30],
        ['path', 30],
        ['minor', 30],
      ],
      show: ['$oneOf', ['$get', 'properties.class'], 'primary', 'secondary', 'motorway', 'service', 'path', 'minor'],
    },
    maxzoom: 15,
    minzoom: 4,
  },
  poi: {
    sourceLayer: 'poi',
    styleLayerName: 'poiPoint',
    show: true,
    zIndex: 3,
    feature: {
      type: FeatureStyleType.point,
      radius: 70,
      color: ['$rgba', 250, 185, 57, 1],
      show: ['$and', ['$eq', ['$get', 'properties.rank'], 1], ['$notEmpty', ['$get', 'properties.name']]],
      border: {
        type: FeatureStyleType.line,
        color: ['$rgba', 0, 0, 0, 1],
        width: 5,
      },
    },
    maxzoom: 18,
    minzoom: 14,
  },
  poiLabel: {
    sourceLayer: 'poi',
    styleLayerName: 'poiText',
    zIndex: 4,
    show: ['$notEmpty', ['$get', 'properties.name']],
    feature: {
      type: FeatureStyleType.text,
      color: ['$rgba', 0, 0, 0, 1],
      show: ['$eq', ['$get', 'properties.rank'], 1],
      text: ['$get', 'properties.name'],
      font: 'opensans',
      fontSize: 8,
    },
    maxzoom: 18,
    minzoom: 14,
  },
  place: {
    sourceLayer: 'place',
    styleLayerName: 'placeStyles',
    show: true,
    zIndex: 3,
    feature: {
      type: FeatureStyleType.text,
      color: ['$rgba', 0, 0, 0, 1],
      show: ['$lte', ['$get', 'properties.rank'], 15],
      text: ['$get', 'properties.name'],
      font: 'opensans',
      fontSize: [
        '$switch',
        ['$get', 'properties.class'],
        ['country', 24],
        ['state', 20],
        ['county', 20],
        ['town', 15],
        ['village', 8],
      ],
    },
    maxzoom: 14,
    minzoom: 0,
  },
  aerodrome_label: {
    sourceLayer: 'aerodrome_label',
    styleLayerName: 'aerodromeLabelStyles',
    zIndex: 4,
    show: false,
    maxzoom: 15,
    minzoom: 8,
  },
  aeroway: {
    sourceLayer: 'aeroway',
    styleLayerName: 'aerowayStyles',
    zIndex: 2,
    show: false,
    maxzoom: 15,
    minzoom: 10,
  },
  housenumber: {
    sourceLayer: 'housenumber',
    styleLayerName: 'housenumberStyles',
    zIndex: 3,
    show: false,
    maxzoom: 15,
    minzoom: 14,
  },
  landuse: {
    sourceLayer: 'landuse',
    styleLayerName: 'landuseStyles',
    zIndex: 2,
    show: false,
    maxzoom: 15,
    minzoom: 4,
  },
  mountain_peak: {
    sourceLayer: 'mountain_peak',
    styleLayerName: 'mountain_peakStyles',
    zIndex: 2,
    show: false,
    maxzoom: 15,
    minzoom: 7,
  },
  park: {
    sourceLayer: 'park',
    styleLayerName: 'parkStyles',
    zIndex: 2,
    show: false,
    maxzoom: 15,
    minzoom: 4,
  },
  transportation_name: {
    sourceLayer: 'transportation_name',
    styleLayerName: 'transportation_nameStyles',
    zIndex: 4,
    show: false,
    maxzoom: 15,
    minzoom: 6,
  },
  water_name: {
    sourceLayer: 'water_name',
    styleLayerName: 'water_nameStyles',
    zIndex: 4,
    show: false,
    maxzoom: 15,
    minzoom: 0,
  },
  waterway: {
    sourceLayer: 'waterway',
    styleLayerName: 'waterwayStyles',
    zIndex: 2,
    show: false,
    maxzoom: 15,
    minzoom: 3,
  },
};
