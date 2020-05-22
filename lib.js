import {vec} from "./gl.js";
import {GRID_SIZE, ID_SVG} from "./config.js";

/*
 * Converts client mouse position to
 * SVG position
 * Takes in a vec object.
 */
export function clientToSVGCoords(client) {
  let SVG = document.getElementById(ID_SVG);
  let {left, top} = SVG.getBoundingClientRect();

  return vec(client.x - left, client.y - top);
}

/*
 * Converts client mouse position to SVG
 * snapped position.
 * Takes in a vec object.
 */
export function clientToSnapCoords(client) {
  const svgPos = clientToSVGCoords(client);
  return snapToGrid(svgPos.x, svgPos.y);
}

/*
 * Snaps the given position to a point
 * on the grid.
 * @returns vector with snapped position
 */
export function snapToGrid(x, y) {
  const {width, height} =
    document.getElementById(ID_SVG).getBoundingClientRect();

  return {
    x: Math.min(GRID_SIZE * Math.round(x / GRID_SIZE), width),
    y: Math.min(GRID_SIZE * Math.round(y / GRID_SIZE), height)
  };
}
