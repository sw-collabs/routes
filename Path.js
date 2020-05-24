import * as gl from "./gl.js";
import BaseObject from "./BaseObject.js";
import { ObjectTypes} from "./BaseObject.js";
import {lineLineIntersection, rayBoxIntersection, snapToGrid} from "./lib.js";
import {cross3, vec, vec3} from "./gl.js";
import { STORE_SHELVES } from "./handlers.js";


export default class Path extends BaseObject {
  constructor(id, from, to) {
    super(id, ObjectTypes.PATH);
    this.from = from;
    this.to = to;
    this.unitVec = gl.NORMALIZE(gl.SUB(to, from));
    this.adjStoreShelves = [];
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
    const T_MAX = 5.0;
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
        this.adjStoreShelves[box.id] = box;
      }
    };

    let currGrid = this.from;
    while (gl.LEQUALS(currGrid, this.to)) {
      Object.values(STORE_SHELVES).forEach(box => {
        intersect(front, box);
        intersect(back, box);
      });

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
   */
  cut(atPoint) {
    return {
      first: new Path(this.from, atPoint),
      second: new Path(atPoint, this.to)
    };
  }
}
