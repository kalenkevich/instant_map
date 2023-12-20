export type FontsConfig = Record<string, FontConfig>; // font name -> url map;
export interface FontConfig {
  name: string;
  source: string;
}
