import { OsmNode } from './node';
import { OsmWay } from './way';
import { OsmRelation } from './relation';

export class OsmGraph {
  private nodes: Record<string, OsmNode> = {};
  private ways: Record<string, OsmWay> = {};
  private relations: Record<string, OsmRelation> = {};

  constructor() {}

  addNode(node: OsmNode) {
    this.nodes[node.id] = node;
  }

  addWay(way: OsmWay) {
    this.ways[way.id] = way;
  }

  addRelation(relation: OsmRelation) {
    this.relations[relation.id] = relation;
  }
}
