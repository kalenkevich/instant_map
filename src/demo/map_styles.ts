import { LineJoinStyle } from '../map/renderer/webgl/objects/line/line';
import { DataTileSourceType, DataTileStyles } from '../map/styles/styles';
import { MapTileFeatureType } from '../map/tile/tile';
import { FontFormatType } from '../map/font/font_config';
import { GlyphsTextrureAtlasType } from '../map/glyphs/glyphs_config';

export const MapTilerVectorTileStyles: DataTileStyles = {
  tileSize: 512,
  minzoom: 1,
  maxzoom: 15,
  sources: {
    dataSource: {
      type: DataTileSourceType.pbf,
      name: 'dataSource',
      url: 'https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=MfT8xhKONCRR9Ut0IKkt',
    },
  },
  layers: {
    water: {
      source: 'dataSource',
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
      source: 'dataSource',
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
      source: 'dataSource',
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
      source: 'dataSource',
      sourceLayer: 'boundary',
      styleLayerName: 'boundaryStyles',
      show: true,
      zIndex: 3,
      feature: {
        type: MapTileFeatureType.line,
        show: ['$lte', ['$get', 'properties.admin_level'], 7],
        color: ['$rgba', 120, 123, 140, 1],
        width: 2,
      },
      maxzoom: 15,
      minzoom: 0,
    },
    building: {
      source: 'dataSource',
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
      source: 'dataSource',
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
        width: ['$switch', ['$get', 'properties.class'], ['primary', 4], ['$default', 2]],
        joinStyle: LineJoinStyle.round,
      },
      minzoom: 6,
    },
    transportation_name: {
      source: 'dataSource',
      sourceLayer: 'transportation_name',
      styleLayerName: 'transportation_nameStyles',
      zIndex: 4,
      show: true,
      feature: {
        type: MapTileFeatureType.text,
        color: ['$rgba', 255, 255, 255, 1],
        borderColor: ['$rgba', 0, 0, 0, 1],
        text: ['$get', 'properties.class'],
        font: 'opensans',
        fontSize: 10,
      },
      minzoom: 12,
    },
    poi: {
      source: 'dataSource',
      sourceLayer: 'poi',
      styleLayerName: 'poiPoint',
      show: false,
      zIndex: 4,
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
      source: 'dataSource',
      sourceLayer: 'poi',
      styleLayerName: 'poiIcon',
      show: true,
      zIndex: 3,
      feature: {
        type: MapTileFeatureType.glyph,
        // show: ['$and', ['$lte', ['$get', 'properties.rank'], 10], ['$notEmpty', ['$get', 'properties.class']]],
        name: ['$get', 'properties.class'],
        atlas: 'iconsAtlas',
      },
      maxzoom: 18,
      minzoom: 12,
    },
    poiLabel: {
      source: 'dataSource',
      sourceLayer: 'poi',
      styleLayerName: 'poiText',
      zIndex: 4,
      show: true,
      feature: {
        type: MapTileFeatureType.text,
        color: ['$rgba', 255, 255, 255, 1],
        borderColor: ['$rgba', 0, 0, 0, 1],
        show: ['$and', ['$lte', ['$get', 'properties.rank'], 5], ['$notEmpty', ['$get', 'properties.name']]],
        text: ['$get', 'properties.name'],
        font: 'fontAtlas',
        fontSize: 24,
      },
      maxzoom: 18,
      minzoom: 12,
    },
    place: {
      source: 'dataSource',
      sourceLayer: 'place',
      styleLayerName: 'placeStyles',
      zIndex: 4,
      show: true,
      feature: {
        type: MapTileFeatureType.text,
        color: ['$rgba', 255, 255, 255, 1],
        borderColor: ['$rgba', 0, 0, 0, 1],
        show: ['$lte', ['$get', 'properties.rank'], 15],
        text: ['$get', 'properties.name'],
        font: 'opensans',
        fontSize: [
          '$switch',
          ['$get', 'properties.class'],
          ['continent', 36],
          ['country', 14], // 34
          ['state', 32],
          ['province', 32],
          ['county', 30],
          ['island', 30],
          ['city', 28],
          ['town', 28],
          ['village', 24],
          ['suburb', 18],
          ['neighbourhood', 18],
        ],
      },
      maxzoom: 14,
      minzoom: 0,
    },
    park: {
      source: 'dataSource',
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
      source: 'dataSource',
      sourceLayer: 'housenumber',
      styleLayerName: 'housenumberStyles',
      zIndex: 4,
      show: true,
      feature: {
        type: MapTileFeatureType.text,
        color: ['$rgba', 255, 255, 255, 1],
        borderColor: ['$rgba', 0, 0, 0, 1],
        text: ['$get', 'properties.housenumber'],
        font: 'opensans',
        fontSize: 8,
      },
      minzoom: 16,
    },
    aerodrome_label: {
      source: 'dataSource',
      sourceLayer: 'aerodrome_label',
      styleLayerName: 'aerodromeLabelStyles',
      zIndex: 4,
      show: false,
      maxzoom: 15,
      minzoom: 8,
    },
    aeroway: {
      source: 'dataSource',
      sourceLayer: 'aeroway',
      styleLayerName: 'aerowayStyles',
      zIndex: 2,
      show: false,
      maxzoom: 15,
      minzoom: 10,
    },
    landuse: {
      source: 'dataSource',
      sourceLayer: 'landuse',
      styleLayerName: 'landuseStyles',
      zIndex: 2,
      show: false,
      maxzoom: 15,
      minzoom: 4,
    },
    mountain_peak: {
      source: 'dataSource',
      sourceLayer: 'mountain_peak',
      styleLayerName: 'mountain_peakStyles',
      zIndex: 2,
      show: false,
      maxzoom: 15,
      minzoom: 7,
    },
    water_name: {
      source: 'dataSource',
      sourceLayer: 'water_name',
      styleLayerName: 'water_nameStyles',
      zIndex: 4,
      show: false,
      maxzoom: 15,
      minzoom: 0,
    },
    waterway: {
      source: 'dataSource',
      sourceLayer: 'waterway',
      styleLayerName: 'waterwayStyles',
      zIndex: 2,
      show: false,
      maxzoom: 15,
      minzoom: 3,
    },
  },
  fonts: {
    arial: {
      type: FontFormatType.vector,
      name: 'arial',
      sourceUrl: './fonts/arial_regular.ttf',
    },
    roboto: {
      type: FontFormatType.vector,
      name: 'roboto',
      sourceUrl: './fonts/roboto_regular.ttf',
    },
    opensans: {
      type: FontFormatType.vector,
      name: 'opensans',
      sourceUrl: './fonts/opensans_regular.ttf',
    },
    opensansBold: {
      type: FontFormatType.vector,
      name: 'opensansBold',
      sourceUrl: './fonts/opensans_bold.ttf',
    },
  },
  glyphs: {
    iconsAtlas: {
      type: GlyphsTextrureAtlasType.png,
      name: 'iconsAtlas',
      width: 1024,
      height: 936,
      sourceUrl: './icons/sprite@2x.png',
      mappingUrl: './icons/sprite@2x.json',
    },
    fontAtlas: {
      type: GlyphsTextrureAtlasType.png,
      name: 'fontAtlas',
      width: 512,
      height: 512,
      sourceUrl: './icons/font_sprite.png',
      mappingUrl: 'font_default_mapping_32_32_256_2',
    },
  },
};

export const MapboxVectorTileStyles: DataTileStyles = {
  tileSize: 512,
  minzoom: 0,
  maxzoom: 16,
  sources: {
    dataSource: {
      type: DataTileSourceType.pbf,
      name: 'dataSource',
      url: 'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2,mapbox.mapbox-bathymetry-v2/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1Ijoia2FsZW5rZXZpY2giLCJhIjoiY2xuYXc2eXY0MDl3ZjJ3bzdjN2JwYTBocCJ9.UMtCm4-d9CQj8QbDouCkpA',
    },
  },
  layers: {
    water: {
      source: 'dataSource',
      sourceLayer: 'water',
      styleLayerName: 'waterStyles',
      zIndex: 0,
      show: true,
      feature: {
        type: MapTileFeatureType.polygon,
        color: ['$rgba', 95, 200, 255, 1],
      },
      maxzoom: 16,
      minzoom: 0,
    },
    landcover: {
      source: 'dataSource',
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
          ['$default', ['$rgba', 255, 255, 255, 1]],
        ],
      },
    },
    landuse: {
      source: 'dataSource',
      sourceLayer: 'landuse',
      styleLayerName: 'landuseStyles',
      zIndex: 1,
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
          ['$default', ['$rgba', 255, 255, 255, 1]],
        ],
      },
      maxzoom: 16,
      minzoom: 0,
    },
    natural_label: {
      source: 'dataSource',
      sourceLayer: 'natural_label',
      styleLayerName: 'natural_labelStyles',
      zIndex: 4,
      show: true,
      feature: {
        type: MapTileFeatureType.text,
        color: ['$rgba', 255, 255, 255, 1],
        borderColor: ['$rgba', 0, 0, 0, 1],
        text: ['$get', 'properties.name_en'],
        font: 'opensansBold',
        fontSize: 32,
      },
    },
    admin: {
      source: 'dataSource',
      sourceLayer: 'admin',
      styleLayerName: 'adminStyles',
      show: true,
      zIndex: 3,
      feature: {
        type: MapTileFeatureType.line,
        show: ['$lte', ['$get', 'properties.admin_level'], 7],
        color: ['$rgba', 120, 123, 140, 1],
        width: 2,
      },
      maxzoom: 16,
      minzoom: 0,
    },
    road: {
      source: 'dataSource',
      sourceLayer: 'road',
      styleLayerName: 'roadStyles',
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
        width: ['$switch', ['$get', 'properties.class'], ['primary', 4], ['$default', 2]],
        joinStyle: LineJoinStyle.round,
      },
      minzoom: 6,
    },
    // roadShield: {
    //   source: 'dataSource',
    //   sourceLayer: 'road',
    //   styleLayerName: 'roadShieldStyles',
    //   zIndex: 2,
    //   show: true,
    //   feature: {
    //     type: MapTileFeatureType.glyph,
    //     name: ['$concat', ['$get', 'properties.shield_beta'], '-', ['$get', 'properties.ref']],
    //     atlas: 'iconsAtlas',
    //   },
    // },
    poiLabel: {
      source: 'dataSource',
      sourceLayer: 'poi_label',
      styleLayerName: 'poiLabel',
      show: true,
      zIndex: 3,
      feature: {
        type: MapTileFeatureType.text,
        color: ['$rgba', 255, 255, 255, 1],
        borderColor: ['$rgba', 0, 0, 0, 1],
        text: ['$get', 'properties.name'],
        font: 'opensansBold',
        fontSize: 14,
      },
      maxzoom: 18,
      minzoom: 12,
    },
    poiIcon: {
      source: 'dataSource',
      sourceLayer: 'poi_label',
      styleLayerName: 'poiIcon',
      show: true,
      zIndex: 3,
      feature: {
        type: MapTileFeatureType.glyph,
        name: ['$get', 'properties.maki'],
        atlas: 'iconsAtlas',
      },
      maxzoom: 18,
      minzoom: 12,
    },
    place: {
      source: 'dataSource',
      sourceLayer: 'place_label',
      styleLayerName: 'place_labelStyles',
      zIndex: 4,
      show: true,
      feature: {
        type: MapTileFeatureType.text,
        color: ['$rgba', 255, 255, 255, 1],
        borderColor: ['$rgba', 0, 0, 0, 1],
        text: ['$get', 'properties.name'],
        show: ['$lte', ['$get', 'properties.filterrank'], 3],
        font: 'opensansBold',
        fontSize: [
          '$switch',
          ['$get', 'properties.class'],
          ['country', 32],
          ['settlement', 28],
          ['settlement_subdivision', 24],
        ],
        margin: {
          top: -25,
        },
      },
      maxzoom: 16,
      minzoom: 0,
    },
    settelmentIcon: {
      source: 'dataSource',
      sourceLayer: 'place_label',
      styleLayerName: 'settelmentIconStyle',
      zIndex: 5,
      show: true,
      feature: {
        type: MapTileFeatureType.glyph,
        name: ['$switch', ['$get', 'properties.class'], ['settlement', 'dot-11'], ['settlement_subdivision', 'dot-10']],
        show: ['$and', ['$notEmpty', ['$get', 'properties.name']], ['$eq', ['$get', 'properties.class'], 'settlement']],
        atlas: 'iconsAtlas',
      },
      maxzoom: 16,
      minzoom: 0,
    },
    building: {
      source: 'dataSource',
      sourceLayer: 'building',
      styleLayerName: 'buildingStyles',
      zIndex: 2,
      show: true,
      feature: {
        type: MapTileFeatureType.polygon,
        color: ['$rgba', 222, 215, 211, 1],
      },
      minzoom: 12,
    },
    housenum_label: {
      source: 'dataSource',
      sourceLayer: 'housenum_label',
      styleLayerName: 'housenum_labelStyles',
      zIndex: 4,
      show: true,
      feature: {
        type: MapTileFeatureType.text,
        color: ['$rgba', 255, 255, 255, 1],
        borderColor: ['$rgba', 0, 0, 0, 1],
        text: ['$get', 'properties.house_num'],
        font: 'opensansBold',
        fontSize: 14,
      },
    },
    structureIcon: {
      source: 'dataSource',
      sourceLayer: 'structure',
      styleLayerName: 'structureIcon',
      show: true,
      zIndex: 3,
      feature: {
        type: MapTileFeatureType.glyph,
        name: ['$get', 'properties.type'],
        atlas: 'iconsAtlas',
      },
      maxzoom: 18,
      minzoom: 12,
    },
  },
  glyphs: {
    iconsAtlas: {
      type: GlyphsTextrureAtlasType.png,
      name: 'iconsAtlas',
      width: 1024,
      height: 936,
      sourceUrl: './icons/sprite@2x.png',
      mappingUrl: './icons/sprite@2x.json',
    },
    fontAtlas: {
      type: GlyphsTextrureAtlasType.png,
      name: 'fontAtlas',
      width: 512,
      height: 512,
      sourceUrl: './icons/font_sprite.png',
      mappingUrl: 'font_default_mapping_32_32_256_2',
    },
  },
  fonts: {
    arial: {
      type: FontFormatType.vector,
      name: 'arial',
      sourceUrl: './fonts/arial_regular.ttf',
    },
    roboto: {
      type: FontFormatType.vector,
      name: 'roboto',
      sourceUrl: './fonts/roboto_regular.ttf',
    },
    opensans: {
      type: FontFormatType.vector,
      name: 'opensans',
      sourceUrl: './fonts/opensans_regular.ttf',
    },
    opensansBold: {
      type: FontFormatType.vector,
      name: 'opensansBold',
      sourceUrl: './fonts/opensans_bold.ttf',
    },
  },
};

export const SateliteTilesStyles: DataTileStyles = {
  tileSize: 256,
  minzoom: 0,
  maxzoom: 16,
  sources: {
    imageSource: {
      type: DataTileSourceType.image,
      name: 'imageSource',
      url: 'https://api.maptiler.com/maps/satellite/256/{z}/{x}/{y}@2x.jpg?key=MfT8xhKONCRR9Ut0IKkt',
      pixelRatio: 2,
    },
    dataSource: {
      type: DataTileSourceType.pbf,
      name: 'dataSource',
      url: 'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2,mapbox.mapbox-bathymetry-v2/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1Ijoia2FsZW5rZXZpY2giLCJhIjoiY2xuYXc2eXY0MDl3ZjJ3bzdjN2JwYTBocCJ9.UMtCm4-d9CQj8QbDouCkpA',
    },
  },
  layers: {
    image: {
      source: 'imageSource',
      sourceLayer: 'image',
      styleLayerName: 'imageStyles',
      zIndex: 0,
      show: false,
      feature: {
        type: MapTileFeatureType.image,
      },
      maxzoom: 16,
      minzoom: 0,
    },
    road: {
      source: 'dataSource',
      sourceLayer: 'road',
      styleLayerName: 'roadStyles',
      zIndex: 2,
      show: true,
      feature: {
        type: MapTileFeatureType.line,
        color: [
          '$switch',
          ['$get', 'properties.class'],
          ['primary', ['$rgba', 233, 201, 43, 0.3]],
          ['secondary', ['$rgba', 233, 201, 43, 0.3]],
          ['motorway', ['$rgba', 233, 201, 43, 0.3]],
          ['$default', ['$rgba', 215, 218, 226, 0.3]],
        ],
        width: ['$switch', ['$get', 'properties.class'], ['primary', 4], ['$default', 2]],
        joinStyle: LineJoinStyle.round,
      },
      minzoom: 6,
    },
    poiIcon: {
      source: 'dataSource',
      sourceLayer: 'poi_label',
      styleLayerName: 'poiIcon',
      show: true,
      zIndex: 3,
      feature: {
        type: MapTileFeatureType.glyph,
        name: ['$get', 'properties.maki'],
        atlas: 'iconsAtlas',
      },
      maxzoom: 18,
      minzoom: 12,
    },
    admin: {
      source: 'dataSource',
      sourceLayer: 'admin',
      styleLayerName: 'adminStyles',
      show: true,
      zIndex: 3,
      feature: {
        type: MapTileFeatureType.line,
        show: ['$lte', ['$get', 'properties.admin_level'], 7],
        color: ['$rgba', 0, 0, 0, 0.7],
        width: 2,
      },
      maxzoom: 16,
      minzoom: 0,
    },
    poiLabel: {
      source: 'dataSource',
      sourceLayer: 'poi_label',
      styleLayerName: 'poiLabel',
      show: true,
      zIndex: 3,
      feature: {
        type: MapTileFeatureType.text,
        color: ['$rgba', 255, 255, 255, 1],
        borderColor: ['$rgba', 0, 0, 0, 1],
        text: ['$get', 'properties.name'],
        font: 'opensansBold',
        fontSize: 28,
      },
      maxzoom: 18,
      minzoom: 12,
    },
    place: {
      source: 'dataSource',
      sourceLayer: 'place_label',
      styleLayerName: 'place_labelStyles',
      zIndex: 4,
      show: true,
      feature: {
        type: MapTileFeatureType.text,
        color: ['$rgba', 255, 255, 255, 1],
        borderColor: ['$rgba', 0, 0, 0, 1],
        text: ['$get', 'properties.name'],
        show: ['$lte', ['$get', 'properties.filterrank'], 3],
        font: 'opensansBold',
        fontSize: [
          '$switch',
          ['$get', 'properties.class'],
          ['country', 32],
          ['settlement', 28],
          ['settlement_subdivision', 24],
        ],
        margin: {
          top: -25,
        },
      },
      maxzoom: 16,
      minzoom: 0,
    },
  },
  glyphs: {
    iconsAtlas: {
      type: GlyphsTextrureAtlasType.png,
      name: 'iconsAtlas',
      width: 1024,
      height: 936,
      sourceUrl: './icons/sprite@2x.png',
      mappingUrl: './icons/sprite@2x.json',
    },
    // fontAtlas: {
    //   type: GlyphsTextrureAtlasType.pbf,
    //   name: 'fontAtlas',
    //   sourceUrl:
    //     'https://api.mapbox.com/fonts/v1/mapbox/DIN%20Pro%20Bold,Arial%20Unicode%20MS%20Bold/{range}.pbf?access_token=pk.eyJ1Ijoia2FsZW5rZXZpY2giLCJhIjoiY2xuYXc2eXY0MDl3ZjJ3bzdjN2JwYTBocCJ9.UMtCm4-d9CQj8QbDouCkpA',
    // },
  },
  fonts: {
    opensansBold: {
      type: FontFormatType.vector,
      name: 'opensansBold',
      sourceUrl: './fonts/opensans_bold.ttf',
    },
  },
};
