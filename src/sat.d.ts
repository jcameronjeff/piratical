declare module 'sat' {
  export class Vector {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
  }
  export class Box {
    constructor(pos?: Vector, w?: number, h?: number);
    pos: Vector;
    w: number;
    h: number;
    toPolygon(): Polygon;
  }
  export class Polygon {
    constructor(pos?: Vector, points?: Vector[]);
    pos: Vector;
    points: Vector[];
    setPoints(points: Vector[]): Polygon;
  }
  export class Response {
    constructor();
    overlap: number;
    overlapV: Vector;
    overlapN: Vector;
    clear(): Response;
  }
  export function testPolygonPolygon(a: Polygon, b: Polygon, response?: Response): boolean;
}
