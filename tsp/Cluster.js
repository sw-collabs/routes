import Point from "./Point.js";
import * as gl from "../gl.js";
import { ObjectSVGConfigs } from "../BaseObject.js";
import { svgCoordsToGridCoords } from "../lib.js";

const CLUSTER_ID = v => `${ObjectSVGConfigs.CLUSTER_ID}-${gl.VEC_STR(v)}`;


export default class Cluster {
  /**
   * @param storeShelf
   * @param allStoreShelves:  []
   */
  constructor(storeShelf, allStoreShelves=[]) {
    this.id = CLUSTER_ID(svgCoordsToGridCoords(storeShelf.center()));
    this.points = {};

    let otherShelves = allStoreShelves.filter(
      shelf => shelf.id !== this.id);

    for (let id in storeShelf.intersections) {
      let isection = storeShelf.intersections[id];
      let point = new Point(isection, otherShelves);
      this.points[point.id] = point;
    }
  }

  /**
   * Computes the shortest distance path from 'src' to
   * reach any points in this Cluster.
   *
   * @param src
   */
  minFrom(src) {
    let min = Infinity;
    let minPoint = null;
    Object.values(this.points).forEach(point => {
      let dist = point.distanceFrom(src).distance;
      if (dist < min) {
        min = dist;
        minPoint = point;
      }
    });

    return {
      distance: min,
      point: minPoint
    };
  }
}