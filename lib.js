import {vec, det, mat2, NORMALIZE} from "./gl.js";
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

export function svgCoordsToGridCoords(svgCoords) {
  return vec(
    Math.floor(svgCoords.x / GRID_SIZE),
    Math.floor(svgCoords.y / GRID_SIZE)
  );
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

export function lineLineIntersection(line1PFrom,
                                     line1PTo,
                                     line2PFrom,
                                     line2PTo) {
  let x1, x2, x3, x4;
  let y1, y2, y3, y4;

  x1 = line1PFrom.x;
  x2 = line1PTo.x;
  x3 = line2PFrom.x;
  x4 = line2PTo.x;
  y1 = line1PFrom.y;
  y2 = line1PTo.y;
  y3 = line2PFrom.y;
  y4 = line2PTo.y;

  let t, u;
  let denom = det(mat2(x1-x2, x3-x4, y1-y2, y3-y4));
  t = det(mat2(x1-x3, x3-x4, y1-y3, y3-y4)) / denom;
  u = det(mat2(x1-x2, x1-x3, y1-y2, y1-y3)) / denom;

  if ((t >= 0.0 && t <= 1.0) || (u >= 0.0 && u <= 1.0)) {
    return vec(
      x1 + t * (x2 - x1),
      y1 + t * (y2-y1)
    );
  }

  return null;
}

/*
 * A ray is different from a line in that it shoots off
 * to infinity whereas a line ends.
 */
export function rayBoxIntersection(linePFrom,
                                   lineDirVec,
                                   rectPTopLeft,
                                   rectPBotRight) {
  let xmin, xmax, ymin, ymax;

  xmin = rectPTopLeft.x;
  xmax = rectPBotRight.x;
  ymin = rectPBotRight.y;
  ymax = rectPTopLeft.y;

  let xd, yd;
  let d = NORMALIZE(lineDirVec);
  xd = d.x;
  yd = d.y;

  let txmin, txmax, tymin, tymax;
  let xa = 1/xd;
  if (xa >= 0) {
    txmin = xa * (xmin-linePFrom.x);
    txmax = xa * (xmax-linePFrom.x);
  } else {
    txmin = xa * (xmax-linePFrom.x);
    txmax = xa * (xmin-linePFrom.x);
  }

  let ya = 1/yd;
  if (ya >= 0) {
    tymin = ya * (ymin-linePFrom.y);
    tymax = ya * (ymax-linePFrom.y);
  } else {
    tymin = ya * (ymax-linePFrom.y);
    tymax = ya * (ymin-linePFrom.y);
  }

  /*
   * This ray is not infinite on both ends - meaning
   * if the ray only intersects with the box in the
   * opposite direction to its heading, then return
   * false.
   */
  if ((txmin < 0.0 && txmax < 0.0) ||
      (tymin < 0.0 && tymax < 0.0)) {
    return false;
  }

  return {
    intersects: !(txmin > tymax || tymin > txmax),
    t: Math.min(txmin, tymin)
  };
}

/*
 * Returns the top left and bottom right
 * corners of the <rect> element
 */
export function getRectCorners(rect) {

  let topLeft = vec(
    parseFloat(rect.getAttribute('x')),
    parseFloat(rect.getAttribute('y'))
  );

  let botRight = vec(
    topLeft.x + parseFloat(rect.getAttribute('width')) - 1,
    topLeft.y + parseFloat(rect.getAttribute('height')) - 1
  );

  return { topLeft, botRight };
}

export function getRectCenter(rect) {
  const { topLeft } = getRectCorners(rect);

  return vec(
    topLeft.x + parseFloat(rect.getAttribute('width')) / 2,
    topLeft.y + parseFloat(rect.getAttribute('height')) / 2
  )
}

