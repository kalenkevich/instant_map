/**
 * Enum of all existing Transfortation features.
 * Based on https://api.maptiler.com/tiles/v3-openmaptiles/tiles.json?key=MfT8xhKONCRR9Ut0IKkt
 */
export enum TransportationFeatureType {
  transit = 'transit',
  storage_tank = 'storage_tank',
  tertiary = 'tertiary',
  service = 'service',
  primary_construction = 'primary_construction',
  path = 'path',
  raceway = 'raceway',
  motorway = 'motorway',
  trunk = 'trunk',
  primary = 'primary',
  track = 'track',
  tertiary_construction = 'tertiary_construction',
  ferry = 'ferry',
  raceway_construction = 'raceway_construction',
  minor_construction = 'minor_construction',
  motorway_construction = 'motorway_construction',
  secondary_construction = 'secondary_construction',
  secondary = 'secondary',
  service_construction = 'service_construction',
  aerialway = 'aerialway',
  bus_guideway = 'bus_guideway',
  rail = 'rail',
  bridge = 'bridge',
  path_construction = 'path_construction',
  minor = 'minor',
  trunk_construction = 'trunk_construction',
  track_construction = 'track_construction',
  pier = 'pier',
  courtyard = 'courtyard',
  busway = 'busway',
}

export enum BoudaryAdminLevel {
  ADMIN_LEVEL_2 = 2,
  ADMIN_LEVEL_3 = 3,
  ADMIN_LEVEL_4 = 4,
  ADMIN_LEVEL_5 = 5,
  ADMIN_LEVEL_6 = 6,
  ADMIN_LEVEL_7 = 7,
  ADMIN_LEVEL_8 = 8,
  ADMIN_LEVEL_9 = 9,
  ADMIN_LEVEL_10 = 10,
}

export enum WaterFeatureClass {
  dock = 'dock',
  river = 'river',
  lake = 'lake',
  ocean = 'ocean',
  swimming_pool = 'swimming_pool',
}

export enum LandCoverFeatureClass {
  farmland = 'farmland',
  ice = 'ice',
  wood = 'wood',
  rock = 'rock',
  grass = 'grass',
  wetland = 'wetland',
  sand = 'sand',
  crop = 'crop',
  scrub = 'scrub',
  tree = 'tree',
  forest = 'forest',
  snow = 'snow',
}

/**
 * List of the supported transportation features.
 * TODO: Support more features.
 */
export const SUPPORTED_TRANSPORTATION_FEATURES = [
  TransportationFeatureType.primary,
  TransportationFeatureType.secondary,
  TransportationFeatureType.motorway,
  TransportationFeatureType.service,
  TransportationFeatureType.path,
  TransportationFeatureType.minor,
];

export const SUPPORTED_BOUNDARY_FEATURES = [
  BoudaryAdminLevel.ADMIN_LEVEL_2,
  BoudaryAdminLevel.ADMIN_LEVEL_3,
  BoudaryAdminLevel.ADMIN_LEVEL_4,
  BoudaryAdminLevel.ADMIN_LEVEL_5,
  BoudaryAdminLevel.ADMIN_LEVEL_6,
  BoudaryAdminLevel.ADMIN_LEVEL_7,
  BoudaryAdminLevel.ADMIN_LEVEL_8,
  BoudaryAdminLevel.ADMIN_LEVEL_9,
  BoudaryAdminLevel.ADMIN_LEVEL_10,
];

export const SUPPORTED_WATER_FEATURES = [
  WaterFeatureClass.ocean,
  WaterFeatureClass.dock,
  WaterFeatureClass.river,
  WaterFeatureClass.lake,
  WaterFeatureClass.swimming_pool,
];

export const SUPPORTED_LAND_COVER_FEATURES = [
  LandCoverFeatureClass.farmland,
  LandCoverFeatureClass.ice,
  LandCoverFeatureClass.wood,
  LandCoverFeatureClass.rock,
  LandCoverFeatureClass.grass,
  LandCoverFeatureClass.wetland,
  LandCoverFeatureClass.sand,
  LandCoverFeatureClass.crop,
  LandCoverFeatureClass.scrub,
  LandCoverFeatureClass.tree,
  LandCoverFeatureClass.forest,
  LandCoverFeatureClass.snow,
];