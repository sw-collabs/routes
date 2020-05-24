import BaseObject, {ObjectTypes, ObjectSVGConfigs } from "./BaseObject.js";
import { __ns, circle } from "./gl.js";
import { svgCoordsToGridCoords } from "./lib.js";
import { INTERSECTIONS } from "./handlers.js";
import { ID_INTERSECTION_G, STYLE_INTERSECTION } from "./config.js";

const CIRCLE_R = 2; // pixels
const INTERSECTION_ID = coords => `${ObjectSVGConfigs.INTERSECTION_ID}-${coords.x}-${coords.y}`;

export function getIntersection(point) {
  let id = INTERSECTION_ID(svgCoordsToGridCoords(point));

  // restrict return type (i.e. no 'undefined')
  return INTERSECTIONS.hasOwnProperty(id)
    ? INTERSECTIONS[id]
    : null;
}

/**
 * If an intersection at 'point' (in svg coordinates) exists,
 * then adds 'path' to its adjacent paths list.
 * If it does not exist, creates the intersection, then adds
 * 'path' to its adjacency paths list.
 *
 * @param point in SVG coordinates
 * @param path  new path to add
 */
export function upsertIntersection(point, path) {
  let isection = getIntersection(svgCoordsToGridCoords(point));
  if (isection === null) {
    isection = new Intersection(point);
    INTERSECTIONS[isection.id] = isection;
  }

  isection.addPaths(path);
}

/**
 * If an intersection at 'point' (in svg coordinates) exists,
 * removes 'path' from intersection - see Intersection.removePath
 * for details on remove.
 * If, after the 'path' is removed from intersection, the
 * intersection is adjacent to no more paths (i.e. dangling),
 * then removes the intersection from the grid.
 *
 * If an intersection at 'point' does not exist, this function
 * does nothing.
 *
 * @param point in SVG coordinates
 * @param path  to remove
 */
export function removeFromIntersection(point, path) {
  let isection = getIntersection(svgCoordsToGridCoords(point));
  if (isection !== null) {
    let isDangling = isection.removePath(path);
    if (isDangling) {
      isection.undraw();
      delete INTERSECTIONS[isection.id];
    }
  }
}

export default class Intersection extends BaseObject {
  constructor(point) {
    let id = INTERSECTION_ID(svgCoordsToGridCoords(point));
    super(id, ObjectTypes.INTERSECTION);
    this.point = point;
    this.connectedPaths = {};

    // Render this on SVG
    const INTERSECTION_G = document.getElementById(ID_INTERSECTION_G);
    __ns(INTERSECTION_G, {},
      circle(this.point, CIRCLE_R, {
        id: this.id,
        ...STYLE_INTERSECTION
      })
    );
  }

  addPaths(...paths) {
    paths.forEach(path => {
      if (!this.connectedPaths.hasOwnProperty(path.id)) {
        this.connectedPaths[path.id] = path;
      }
    });
  }

  /**
   * If exists, removes path from adjacent paths list.
   * After removal, if this intersection has no more adjacent
   * paths, it returns false. If there are adjacent paths
   * remaining, then returns true.
   *
   * @param path
   * @returns true / false
   */
  removePath(path) {
    if (this.connectedPaths.hasOwnProperty(path.id)) {
      delete this.connectedPaths[path.id];
    }

    return Object.keys(this.connectedPaths).length > 0;
  }

  undraw() {
    const isectionSVG = document.getElementById(ID_INTERSECTION_G);
    isectionSVG.removeChild(
      document.getElementById(this.id)
    );
  }
}