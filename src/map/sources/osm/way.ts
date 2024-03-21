import { OsmTag } from './tag';
import { OsmNode } from './node';
import { OsmEntityType } from './entity';

export interface OsmWay {
  id: string;
  type: OsmEntityType.way;
  lat: number;
  lng: number;
  nodes: OsmNode[];
  tags: Record<string, OsmTag>;
}
