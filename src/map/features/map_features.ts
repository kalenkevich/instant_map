/**
 * Enum of all existing Transfortation features.
 * Based on https://api.maptiler.com/tiles/v3-openmaptiles/tiles.json?key=MfT8xhKONCRR9Ut0IKkt
 */
export enum TransportationFeatureType {
  transit = "transit",
  storage_tank = "storage_tank",
  tertiary = "tertiary",
  service = "service",
  primary_construction = "primary_construction",
  path = "path",
  raceway = "raceway",
  motorway = "motorway",
  trunk = "trunk",
  primary = "primary",
  track = "track",
  tertiary_construction = "tertiary_construction",
  ferry = "ferry",
  raceway_construction = "raceway_construction",
  minor_construction = "minor_construction",
  motorway_construction = "motorway_construction",
  secondary_construction = "secondary_construction",
  secondary = "secondary",
  service_construction = "service_construction",
  aerialway = "aerialway",
  bus_guideway = "bus_guideway",
  rail = "rail",
  bridge = "bridge",
  path_construction = "path_construction",
  minor = "minor",
  trunk_construction = "trunk_construction",
  track_construction = "track_construction",
  pier = "pier",
  courtyard= "courtyard",
  busway = "busway"
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
  ADMIN_LEVEL_10 = 10
};