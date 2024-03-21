import { OsmEntityType } from './entity';
import { OsmTag } from './tag';
import { OsmNode } from './node';
import { OsmWay } from './way';

export interface OsmRelation {
  id: string;
  type: OsmEntityType.relation;
  lat: number;
  lng: number;
  members: OsmMember[];
  tags: Record<string, OsmTag>;
}

export interface OsmMember {
  ref: OsmNode | OsmWay | OsmRelation;
  type: OsmEntityType;
  role: string;
}
