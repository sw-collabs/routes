import {GRID_SIZE, ID_SVG} from "./config.js";

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
