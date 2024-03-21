import { OsmTag } from './tag';
import { OsmEntityType } from './entity';

export interface OsmNode {
  id: string;
  type: OsmEntityType.node;
  lat: number;
  lng: number;
  tags: Record<string, OsmTag>;
}
