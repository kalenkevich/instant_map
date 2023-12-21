import { DataTileStyles } from '../map/styles/styles';
import { MapTileFeatureType } from '../map/tile/tile';

const showText = false;

export const VectorTileStyles: DataTileStyles = {
  tileSize: 512,
  minzoom: 1,
  maxzoom: 15,
  layers: {
    water: {
      sourceLayer: 'water',
      styleLayerName: 'waterStyles',
      zIndex: 0,
      show: true,
      feature: {
        type: MapTileFeatureType.polygon,
        color: ['$rgba', 95, 200, 255, 1],
      },
      maxzoom: 15,
      minzoom: 0,
    },
    globallandcover: {
      sourceLayer: 'globallandcover',
      styleLayerName: 'globallandcoverStyles',
      zIndex: 0,
      show: true,
      feature: {
        type: MapTileFeatureType.polygon,
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
      zIndex: 0,
      show: true,
      feature: {
        type: MapTileFeatureType.polygon,
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
      show: true,
      zIndex: 3,
      feature: {
        type: MapTileFeatureType.line,
        show: ['$lte', ['$get', 'properties.admin_level'], 7],
        color: ['$rgba', 120, 123, 140, 1],
        width: 10,
      },
      maxzoom: 15,
      minzoom: 0,
    },
    building: {
      sourceLayer: 'building',
      styleLayerName: 'buildingStyles',
      zIndex: 2,
      feature: {
        type: MapTileFeatureType.polygon,
        color: ['$rgba', 222, 215, 211, 1],
      },
      minzoom: 12,
    },
    transportation: {
      sourceLayer: 'transportation',
      styleLayerName: 'transportationStyles',
      zIndex: 2,
      show: true,
      feature: {
        type: MapTileFeatureType.line,
        color: [
          '$switch',
          ['$get', 'properties.class'],
          ['primary', ['$rgba', 233, 201, 43, 1]],
          ['secondary', ['$rgba', 233, 201, 43, 1]],
          ['motorway', ['$rgba', 233, 201, 43, 1]],
          ['$default', ['$rgba', 215, 218, 226, 1]],
        ],
        width: ['$switch', ['$get', 'properties.class'], ['primary', 24], ['$default', 8]],
      },
      minzoom: 6,
    },
    transportation_name: {
      sourceLayer: 'transportation_name',
      styleLayerName: 'transportation_nameStyles',
      zIndex: 4,
      show: showText,
      feature: {
        type: MapTileFeatureType.text,
        color: ['$rgba', 0, 0, 0, 1],
        text: ['$get', 'properties.class'],
        font: 'opensans',
        fontSize: 10,
      },
      minzoom: 12,
    },
    poi: {
      sourceLayer: 'poi',
      styleLayerName: 'poiPoint',
      show: false,
      zIndex: 3,
      feature: {
        type: MapTileFeatureType.point,
        radius: 30,
        color: ['$rgba', 250, 185, 57, 1],
        show: ['$and', ['$lte', ['$get', 'properties.rank'], 5], ['$notEmpty', ['$get', 'properties.name']]],
        border: {
          type: MapTileFeatureType.line,
          color: ['$rgba', 0, 0, 0, 1],
          width: 1,
        },
      },
      maxzoom: 18,
      minzoom: 12,
    },
    poiIcon: {
      sourceLayer: 'poi',
      styleLayerName: 'poiIcon',
      show: true,
      zIndex: 3,
      feature: {
        type: MapTileFeatureType.icon,
        // show: ['$and', ['$lte', ['$get', 'properties.rank'], 10], ['$notEmpty', ['$get', 'properties.class']]],
        name: ['$get', 'properties.class'],
        atlas: 'iconsAtlas',
      },
      maxzoom: 18,
      minzoom: 12,
    },
    poiLabel: {
      sourceLayer: 'poi',
      styleLayerName: 'poiText',
      zIndex: 4,
      show: showText,
      feature: {
        type: MapTileFeatureType.text,
        color: ['$rgba', 0, 0, 0, 1],
        show: ['$and', ['$lte', ['$get', 'properties.rank'], 5], ['$notEmpty', ['$get', 'properties.name']]],
        text: ['$get', 'properties.name'],
        font: 'opensans',
        fontSize: 24,
      },
      maxzoom: 18,
      minzoom: 12,
    },
    place: {
      sourceLayer: 'place',
      styleLayerName: 'placeStyles',
      zIndex: 3,
      show: showText,
      feature: {
        type: MapTileFeatureType.text,
        color: ['$rgba', 0, 0, 0, 1],
        // show: ['$lte', ['$get', 'properties.rank'], 15],
        text: ['$get', 'properties.name'],
        font: 'opensans',
        fontSize: [
          '$switch',
          ['$get', 'properties.class'],
          ['country', 72],
          ['state', 60],
          ['county', 60],
          ['town', 45],
          ['village', 24],
        ],
      },
      maxzoom: 14,
      minzoom: 0,
    },
    park: {
      sourceLayer: 'park',
      styleLayerName: 'parkStyles',
      zIndex: 1,
      feature: {
        type: MapTileFeatureType.polygon,
        color: ['$rgba', 173, 226, 167, 1],
      },
      show: true,
      maxzoom: 15,
      minzoom: 4,
    },
    housenumber: {
      sourceLayer: 'housenumber',
      styleLayerName: 'housenumberStyles',
      zIndex: 3,
      show: showText,
      feature: {
        type: MapTileFeatureType.text,
        color: ['$rgba', 0, 0, 0, 1],
        text: ['$get', 'properties.housenumber'],
        font: 'opensans',
        fontSize: 10,
      },
      minzoom: 16,
    },
    // aerodrome_label: {
    //   sourceLayer: 'aerodrome_label',
    //   styleLayerName: 'aerodromeLabelStyles',
    //   zIndex: 4,
    //   show: false,
    //   maxzoom: 15,
    //   minzoom: 8,
    // },
    // aeroway: {
    //   sourceLayer: 'aeroway',
    //   styleLayerName: 'aerowayStyles',
    //   zIndex: 2,
    //   show: false,
    //   maxzoom: 15,
    //   minzoom: 10,
    // },
    // landuse: {
    //   sourceLayer: 'landuse',
    //   styleLayerName: 'landuseStyles',
    //   zIndex: 2,
    //   show: false,
    //   maxzoom: 15,
    //   minzoom: 4,
    // },
    // mountain_peak: {
    //   sourceLayer: 'mountain_peak',
    //   styleLayerName: 'mountain_peakStyles',
    //   zIndex: 2,
    //   show: false,
    //   maxzoom: 15,
    //   minzoom: 7,
    // },
    // water_name: {
    //   sourceLayer: 'water_name',
    //   styleLayerName: 'water_nameStyles',
    //   zIndex: 4,
    //   show: false,
    //   maxzoom: 15,
    //   minzoom: 0,
    // },
    // waterway: {
    //   sourceLayer: 'waterway',
    //   styleLayerName: 'waterwayStyles',
    //   zIndex: 2,
    //   show: false,
    //   maxzoom: 15,
    //   minzoom: 3,
    // },
  },
  fonts: {
    arial: {
      name: 'arial',
      source: './fonts/arial_regular.ttf',
    },
    roboto: {
      name: 'roboto',
      source: './fonts/roboto_regular.ttf',
    },
    opensans: {
      name: 'opensans',
      source: './fonts/opensans_regular.ttf',
    },
    opensansBold: {
      name: 'opensansBold',
      source: './fonts/opensans_bold.ttf',
    },
  },
  atlas: {
    iconsAtlas: {
      name: 'iconsAtlas',
      width: 1024,
      height: 936,
      source: './icons/sprite@2x.png',
      mapping: './icons/sprite@2x.json',
    },
  },
};
