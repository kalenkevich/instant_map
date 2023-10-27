import earcut from 'earcut';
import { Font } from 'opentype.js';
import { v2 } from '../../index';

interface Point {
  x: number;
  y: number;
}

function distance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;

  return Math.sqrt(dx * dx + dy * dy);
}

function lerp(p1: Point, p2: Point, t: number): Point {
  return {
    x: (1 - t) * p1.x + t * p2.x,
    y: (1 - t) * p1.y + t * p2.y,
  };
}

function cross(p1: Point, p2: Point): number {
  return p1.x * p2.y - p1.y * p2.x;
}

// bezier discretization
const MAX_BEZIER_STEPS = 10;
const BEZIER_STEP_SIZE = 3.0;
// this is for inside checks - doesn't have to be particularly
// small because glyphs have finite resolution
const EPSILON = 1e-6;

// class for converting path commands into point data
class Polygon {
  points: Point[] = [];
  children: Polygon[] = [];
  area: number = 0.0;

  moveTo(p: Point) {
    this.points.push(p);
  }

  lineTo(p: Point) {
    this.points.push(p);
  }

  close(): void {
    let cur = this.points[this.points.length - 1];
    this.points.forEach(next => {
      this.area += 0.5 * cross(cur, next);
      cur = next;
    });
  }

  conicTo(p: Point, p1: Point): void {
    const p0 = this.points[this.points.length - 1];
    const dist = distance(p0, p1) + distance(p1, p);
    const steps = Math.max(2, Math.min(MAX_BEZIER_STEPS, dist / BEZIER_STEP_SIZE));
    for (let i = 1; i <= steps; ++i) {
      const t = i / steps;
      this.points.push(lerp(lerp(p0, p1, t), lerp(p1, p, t), t));
    }
  }

  cubicTo(p: Point, p1: Point, p2: Point): void {
    const p0 = this.points[this.points.length - 1];
    const dist = distance(p0, p1) + distance(p1, p2) + distance(p2, p);
    const steps = Math.max(2, Math.min(MAX_BEZIER_STEPS, dist / BEZIER_STEP_SIZE));
    for (let i = 1; i <= steps; ++i) {
      const t = i / steps;
      const a = lerp(lerp(p0, p1, t), lerp(p1, p2, t), t);
      const b = lerp(lerp(p1, p2, t), lerp(p2, p, t), t);
      this.points.push(lerp(a, b, t));
    }
  }

  inside(p: Point): boolean {
    let count = 0,
      cur = this.points[this.points.length - 1];
    this.points.forEach(next => {
      const p0 = cur.y < next.y ? cur : next;
      const p1 = cur.y < next.y ? next : cur;
      if (p0.y < p.y + EPSILON && p1.y > p.y + EPSILON) {
        if ((p1.x - p0.x) * (p.y - p0.y) > (p.x - p0.x) * (p1.y - p0.y)) {
          count += 1;
        }
      }
      cur = next;
    });
    return count % 2 !== 0;
  }
}

// TODO: remove this multiplier
const SIZE_MULTIPLIER = 16;

export const getTextRectangleSize = (
  font: Font,
  text: string,
  p: v2,
  fontSize: number
): { width: number; height: number } => {
  const path = font.getPath(text, p[0], p[1], fontSize * SIZE_MULTIPLIER);
  const bbox = path.getBoundingBox();

  return {
    width: bbox.x2 - bbox.x1,
    height: bbox.y2 - bbox.y1,
  };
};

export const getVerticiesFromText = (font: Font, text: string, p: v2, fontSize: number) => {
  const polys: Polygon[] = [];
  const root = [];
  const indices: number[] = [];
  const size = getTextRectangleSize(font, text, p, fontSize);
  const path = font.getPath(text, p[0] - size.width / 2, p[1] + size.height * 2, fontSize * SIZE_MULTIPLIER);

  path.commands.forEach(({ type, x, y, x1, y1, x2, y2 }: any) => {
    switch (type) {
      case 'M':
        polys.push(new Polygon());
        polys[polys.length - 1].moveTo({ x, y });
        break;
      case 'L':
        polys[polys.length - 1].moveTo({ x, y });
        break;
      case 'C':
        polys[polys.length - 1].cubicTo({ x, y }, { x: x1, y: y1 }, { x: x2, y: y2 });
        break;
      case 'Q':
        polys[polys.length - 1].conicTo({ x, y }, { x: x1, y: y1 });
        break;
      case 'Z':
        polys[polys.length - 1].close();
        break;
    }
  });

  // sort contours by descending area
  polys.sort((a, b) => Math.abs(b.area) - Math.abs(a.area));
  // classify contours to find holes and their 'parents'
  for (let i = 0; i < polys.length; ++i) {
    let parent = null;
    for (let j = i - 1; j >= 0; --j) {
      // a contour is a hole if it is inside its parent and has different winding
      if (polys[j].inside(polys[i].points[0]) && polys[i].area * polys[j].area < 0) {
        parent = polys[j];
        break;
      }
    }
    if (parent) {
      parent.children.push(polys[i]);
    } else {
      root.push(polys[i]);
    }
  }

  const totalPoints = polys.reduce((sum, p) => sum + p.points.length, 0);
  const vertexData = new Float32Array(totalPoints * 2);
  let vertexCount = 0;

  function process(poly: Polygon) {
    // construct input for earcut
    const coords: number[] = [];
    const holes: number[] = [];
    poly.points.forEach(({ x, y }) => coords.push(x, y));
    poly.children.forEach(child => {
      // children's children are new, separate shapes
      child.children.forEach(process);

      holes.push(coords.length / 2);
      child.points.forEach(({ x, y }) => coords.push(x, y));
    });

    // add vertex data
    vertexData.set(coords, vertexCount * 2);
    // add index data
    earcut(coords, holes).forEach(i => indices.push(i + vertexCount));
    vertexCount += coords.length / 2;
  }
  root.forEach(process);

  return {
    indices,
    vertices: vertexData,
    count: indices.length,
  };
};
