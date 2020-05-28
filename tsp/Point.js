import dijkstra from "../dijkstra.js";
import { PATH_ID } from "../Path.js";
import { svgCoordsToGridCoords } from "../lib.js";
import {ObjectSVGConfigs} from "../BaseObject.js";
import * as gl from "../gl.js";

const POINT_ID = v => `${ObjectSVGConfigs.POINT_ID}-${gl.VEC_STR(v)}`;

export default class Point {
  /**
   * @param isection an Intersection object
   * @param otherStoreShelves other store shelves
   */
  constructor(isection, otherStoreShelves) {
    this.id = POINT_ID(svgCoordsToGridCoords(isection.point));
    this.intersection = isection;
    /*
     * {
     *    paths: Path,
     *    distance: Float
     * }
     */
    this.routes = {};

    for (const otherShelf of otherStoreShelves) {
      for (const vId in otherShelf.intersections) {
        let v = otherShelf.intersections[vId];
        let id = PATH_ID(
          svgCoordsToGridCoords(this.intersection.point),
          svgCoordsToGridCoords(v.point)
        );

        if (!this.routes.hasOwnProperty(id)) {
          let paths = dijkstra(this.intersection, [v]);
          this.routes[id] = {
            paths,
            distance: paths.reduce((acc, path) => acc + path.weight, 0)
          };
        }
      }
    }
  }

  /**
   * Computes shortest path distance from 'src' intersection to
   * this point.
   *
   * Optionally returns the paths along with distance.
   *
   * Note:
   * This function will first try and look for a pre-computed
   * route from 'src' to this point. If it is able to find one,
   * it returns the 'paths' and 'distance' associated with that
   * route.
   *
   * If it is unable to find a route, simply compute Dijkstra,
   * and add 'src' as a new route.
   *
   * @param src Intersection object
   * @param isReturnPaths
   */
  distanceFrom(src) {
    let id1, id2;
    id1 = PATH_ID(
      svgCoordsToGridCoords(this.intersection.point),
      svgCoordsToGridCoords(src.point)
    );
    id2 = PATH_ID(
      svgCoordsToGridCoords(src.point),
      svgCoordsToGridCoords(this.intersection.point)
    );

    let route = null;
    if (this.routes.hasOwnProperty(id1)) {
      route = this.routes[id1];
    } else if (this.routes.hasOwnProperty(id2)) {
      route = this.routes[id2];
    }

    if (route === null) {
      // trivially pick 'id1'
      let paths = dijkstra(src, [this.intersection]);
      route = {
        paths,
        distance: paths.reduce((acc, path) => acc + path.weight, 0)
      };
      this.routes[id1] = route;
    }

    return {
      distance: route.distance,
      paths: route.paths
    };
  }

  equals(point) {
    return this.intersection.equals(point.intersection);
  }
}