import BaseObject, {ObjectTypes, ObjectSVGConfigs } from "./BaseObject.js";
import { __ns, rect, vec } from "./gl.js";
import * as gl from "./gl.js";
import { svgCoordsToGridCoords } from "./lib.js";
import { INTERSECTIONS, PATHS } from "./handlers.js";
import { ID_INTERSECTION_G, STYLE_INTERSECTION } from "./config.js";

const SYMBOL_WIDTH_HEIGHT = 5;
const INTERSECTION_ID = coords => `${ObjectSVGConfigs.INTERSECTION_ID}-${coords.x}-${coords.y}`;


export function getIntersection(point) {
  let id = INTERSECTION_ID(svgCoordsToGridCoords(point));

  // restrict return type (i.e. no 'undefined')
  return INTERSECTIONS.hasOwnProperty(id)
    ? INTERSECTIONS[id]
    : null;
}

export function getPathFromIntersections(to, from) {
  return Object.values(INTERSECTIONS[a.id].connectedPaths)
    .find(p => getIntersection(p))
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
  let isection = getIntersection(point);
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

/**
 * Note: expects PATHS to be fully populated
 *
 * @param json: {
 *  point,
 *  connectedPaths
 * }
 */
export function importIntersection(json) {
  let isection = new Intersection(json.point);
  json.connectedPaths.forEach(pathId => {
    console.assert(PATHS.hasOwnProperty(pathId));
    isection.connectedPaths[pathId] = PATHS[pathId];
  });

  console.assert(!INTERSECTIONS.hasOwnProperty(isection.id));
  INTERSECTIONS[isection.id] = isection;

  return isection; // for convenience
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
      rect(
        gl.SUB(this.point, vec(SYMBOL_WIDTH_HEIGHT/2, SYMBOL_WIDTH_HEIGHT/2)),
        SYMBOL_WIDTH_HEIGHT,
        SYMBOL_WIDTH_HEIGHT, {
        id: this.id,
          ...STYLE_INTERSECTION
        }
      )
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

  json() {
    return {
      point: this.point,
      connectedPaths: Object.values(this.connectedPaths).map(path => path.id)
    };
  }

  undraw() {
    const isectionSVG = document.getElementById(ID_INTERSECTION_G);
    isectionSVG.removeChild(
      document.getElementById(this.id)
    );
  }
}