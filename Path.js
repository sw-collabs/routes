import * as gl from "./gl.js";
import { __ns, g, line, circle } from "./gl.js";
import BaseObject from "./BaseObject.js";
import { ID_PATH_G, STYLE_PATH, GRID_SIZE } from "./config.js";
import { ObjectTypes, ObjectSVGConfigs } from "./BaseObject.js";
import {lineLineIntersection, rayBoxIntersection, snapToGrid, svgCoordsToGridCoords} from "./lib.js";
import {cross3, vec, vec3} from "./gl.js";
import { STORE_SHELVES, PATHS } from "./handlers.js";
import { getIntersection } from "./Intersection.js"

const PATH_ID = (fromGrids, toGrids) => `${ObjectSVGConfigs.PATH_ID}-${gl.VEC_STR(fromGrids)}-${gl.VEC_STR(toGrids)}`;


/**
 * Note: expects STORE_SHELVES to be fully populated.
 * @param json: {
 *   from,
 *   to,
 *   adjStoreShelves
 * }
 */
export function importPath(json) {
  let path = new Path(json.from, json.to);
  json.adjStoreShelves.forEach(shelfId => {
    console.assert(STORE_SHELVES.hasOwnProperty(shelfId));
    path.adjStoreShelves[shelfId] = STORE_SHELVES[shelfId];
  });

  PATHS[path.id] = path;
  return path; // for convenience
}

export default class Path extends BaseObject {
  constructor(from, to) {
    let id = PATH_ID(svgCoordsToGridCoords(from), svgCoordsToGridCoords(to));

    super(id, ObjectTypes.PATH);
    this.from = from;
    this.to = to;
    this.unitVec = gl.NORMALIZE(gl.SUB(to, from));
    this.adjStoreShelves = {};

    this.idLine = `${id}-line`;

    // Render element on SVG
    const PATH_G = document.getElementById(ID_PATH_G);
    __ns(PATH_G, {},
      g(id,
        line(from, to, {
          ...STYLE_PATH,
          id: this.idLine
        })
      )
    );
  }

  lineIntersection(path) {
    return lineLineIntersection(
      this.from,
      this.to,
      path.from,
      path.to
    );
  }

  /*
   * Gets all stores which are adjacent to the current
   * path, stores it in 'adjStoreShelves'.
   *
   * (1) Use 'unitVec' to traverse along this path. until hits
   *     a new grid point.
   * (2) From the new grid point, generate a ray perpendicular
   *     to 'unitVec'. Find the first STORE_SHELF box to intersect
   *     with this ray and store it in 'adjStoreShelves'
   * (3) Do this starting from 'this.from' until reaches
   *     'this.to'
   */
  updateAdjacency() {
    const T_MAX = 2 * GRID_SIZE;
    this.adjStoreShelves = {};

    /*
     * - Transform 'unitVec' into 3D vector by adding 0 as
     *   the z value.
     * - Compute perpendicular vector to 'unitVec' by taking
     *   cross product with z-axis. Since 'unitVec' is on
     *   x-y plane, a cross product with the z-axis is
     *   guaranteed to be on the x-y plane, and orthogonal
     *   to both 'unitVec' and the z-axis.
     * - Set this as 'front'
     * - 'back' is simply the reverse direction of 'front'
     */
    let front, back;
    {
      let _u3 = vec3(this.unitVec.x, this.unitVec.y, 0);
      let _front = cross3(_u3, vec3(0,0,1));
      front = gl.NORMALIZE(vec(_front.x, _front.y));
      back = gl.SUB(vec(0,0), front);
    }

    // Lambda
    const intersect = (ray, box) => {
      let intersects, t;

      ({intersects, t} =
          rayBoxIntersection(currGrid,
            ray,
            box.topLeft,
            box.botRight)
      );

      if (intersects &&
          t <= T_MAX &&
          !this.adjStoreShelves.hasOwnProperty(box.id)
      ) {
        return t;
      }

      return null;
    };

    let currGrid = this.from;
    while (!gl.EQUALS(currGrid, this.to)) {
      let tminFront = Infinity;
      let tminBack = Infinity;
      let minFront = null
      let minBack = null;
      Object.values(STORE_SHELVES).forEach(box => {
        if (!this.adjStoreShelves.hasOwnProperty(box.id)) {
          let tFront = intersect(front, box);
          let tBack = intersect(back, box);

          if (tFront !== null && tFront < tminFront) {
            tminFront = tFront;
            minFront = box;
          } else if (tBack !== null && tBack < tminBack) {
            tminBack = tBack;
            minBack = box;
          }
        }
      });

      if (minFront !== null) {
        this.adjStoreShelves[minFront.id] = minFront;
        minFront.addIntersections(
          getIntersection(this.to)
        );
        minFront.addIntersections(
          getIntersection(this.from)
        );
      }
      if (minBack !== null) {
        this.adjStoreShelves[minBack.id] = minBack;
        minBack.addIntersections(
          getIntersection(this.to)
        );
        minBack.addIntersections(
          getIntersection(this.from)
        );
      }

      let newGrid, p = currGrid;
      do {
        // p = p + 0.3*u
        p = gl.ADD(p, gl.SCALAR_MULT(0.3, this.unitVec));
        newGrid = snapToGrid(p.x, p.y);
      } while (gl.EQUALS(newGrid, currGrid));

      currGrid = newGrid;
    }
  }

  /*
   * Cuts a path into 2 paths based on the given point
   * which is guaranteed to be a point on this Path
   *
   * Note: after this function, Path should no longer
   * be used.
   * Note: Edge case where atPoint is either 'this.from' or
   * 'this.to' - in this case, do nothing.
   */
  cut(atPoint) {
    let segments = [];
    if (!gl.EQUALS(atPoint, this.from) && !gl.EQUALS(atPoint, this.to)) {
      segments.push({
        from: this.from,
        to: atPoint
      });

      segments.push({
        from: atPoint,
        to: this.to
      });
    }

    return segments;
  }

  update(from, to) {
    if (gl.EQUALS(this.from, from) && gl.EQUALS(this.to, to)) {
      return;
    }

    this.from = from;
    this.to = to;

    let lineSVG = document.getElementById(this.idLine);
    __ns(lineSVG, {
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y
    });
  }

  json() {
    return {
      from: this.from,
      to: this.to,
      adjStoreShelves: Object.values(this.adjStoreShelves).map(shelf => shelf.id)
    };
  }

  undraw() {
    let lineSVG = document.getElementById(ID_PATH_G);
    lineSVG.removeChild(
      document.getElementById(this.id)
    );
  }
}
