import StoreShelf from "./StoreShelf.js";
import BaseObject from "./BaseObject.js";
import Path from "./BaseObject.js";
import { ObjectTypes, ObjectSVGConfigs } from "./BaseObject.js";

import {
  clientToSnapCoords,
  lineLineIntersection,
  rayBoxIntersection,
  snapToGrid
} from './lib.js';
import {
  ID_SVG,
  STYLE_SECTION,
  STYLE_STORE_SHELF,
  STYLE_PATH
} from './config.js';
import {__ns, vec, vec3, cross3, rect, line, update, ASSERT_VEC} from './gl.js';
import * as gl from './gl.js';

const SECTION = 'section';
const STORE_SHELF = 'store-shelf';
const PATH = 'path';


/* The current element being edited/rendered by the user */
let currentElement = null;

/* TRUE if mouse is released, FALSE if LEFT button is down*/
let mouseUp = 1;

/* Position of mouse down event */
let startPos = vec(null, null);
let currPos = vec(null, null);
let bool_first_initialized = false;
let int_pathUUID = 0;

let elementType = null;

/* Put all objects here */
let PATHS = {};
let STORE_SHELVES = {};
let SECTIONS = {};


/////////////////////////////////////////////////////////////
/*
 * Generic mousedown, mouse up events
 * to handle setting the mouseUp global variable
 */
export function mousedown(evt) {
  if (evt.button === 0)
    mouseUp = 0;
}

export function mouseup(evt) {
  if (evt.button === 0) {
    mouseUp = 1;
  }
}

export function mousemove(evt) {
  currPos = clientToSnapCoords(vec(evt.clientX, evt.clientY));
}

export function onSectionClick() {
  elementType = SECTION;
}

export function onStoreShelfClick() {
  elementType = STORE_SHELF;
}

export function onPathClick() {
  elementType = PATH;
}

export function onDoneClick() {
  alert('Done click!');
}

export const PathHandlers = {
  mousemove: (evt) => pathMouseMove(evt),
  mousedown: (evt) => pathMouseDown(evt),
  mouseup: (evt) => pathMouseUp(evt)
};

export const SectionHandlers = {
  mousedown: (evt) => sectionMouseDown(evt),
  mousemove: (evt) => sectionMouseMove(evt),
  mouseup: (evt) => sectionMouseUp(evt)
};

export const StoreShelfHandlers = {
  mousedown: (evt) => storeShelfMouseDown(evt),
  mousemove: (evt) => storeShelfMouseMove(evt),
  mouseup: (evt) => storeShelfMouseUp(evt)
};

///////////////////////////////////////////////////////
///////////////// RECTANGLE DRAWING
/*
 * These are generic functions for drawing/creating
 * rectangle objects on the SVG for mouse down
 * and mouse move events.
 * These are used by the Section and StoreShelf
 * elements
 */

/**
 * Creates a rectangle at the specified position
 * with the specified config.
 *
 * @param pos
 * @param config
 * @param w
 * @param h
 */
const createRectangleEvt = (pos, config, w=5, h=5) => {
  let SVG = document.getElementById(ID_SVG);
  currentElement = rect(pos, w, h, config);

  __ns(SVG, {}, currentElement);
};

/**
 * Updates the currentElement on MOUSEMOVE events
 * This should only be called if the currentElement
 * is a RECTANGLE.
 *
 * Computes the top left corner of the shape based on
 * startPos and updates the width,height,x,y
 * attributes accordingly.
 *
 * @param evt
 */
const updateRectangleEvt = (evt) => {
  if (currentElement === null)
    return;

  if (mouseUp)
    return;

  /* Get snapped coordinates of mouse position*/
  let pt = clientToSnapCoords(vec(
    evt.clientX,
    evt.clientY
  ));

  /*
   * Find the new top left coordinate of the rectangle
   * since SVG does not accept negative width and
   * height attributes
   */
  const x = startPos.x > pt.x ? pt.x : startPos.x;
  const y = startPos.y > pt.y ? pt.y : startPos.y;

  /* Update the element attributes */
  update(currentElement, {
    'x': x,
    'y': y,
    'width': Math.abs(pt.x - startPos.x),
    'height': Math.abs(pt.y - startPos.y)
  });
};

////////////////////////////////////////////////////////////////////////
////////// SECTION EVENT HANDLERS
const sectionMouseDown = (evt) => {
  if (elementType !== SECTION)
    return;

  startPos = clientToSnapCoords(
    vec(evt.clientX, evt.clientY)
  );

  createRectangleEvt(startPos, STYLE_SECTION);
};

const sectionMouseMove = (evt) => {
  if (elementType !== SECTION)
    return;

  updateRectangleEvt(evt);
};

const sectionMouseUp = (evt) => {
  if (elementType !== SECTION)
    return;

  currentElement = null;
  startPos = vec(null, null);
};

////////////////////////////////////////////////////////////////////////
////////// STORE-SHELF EVENT HANDLERS
const storeShelfMouseDown = (evt) => {
  if (elementType !== STORE_SHELF)
    return;

  startPos = clientToSnapCoords(
    vec(evt.clientX, evt.clientY)
  );

  createRectangleEvt(startPos, STYLE_STORE_SHELF);
};

const storeShelfMouseMove = (evt) => {
  if (elementType !== STORE_SHELF)
    return;

  updateRectangleEvt(evt);
};

const storeShelfMouseUp = (evt) => {
  if (elementType !== STORE_SHELF)
    return;
  currentElement = null;
  startPos = vec(null, null);
};

////////////////////////////////////////////////////////////////////////
////////// PATH EVENT HANDLERS
const pathMouseDown = (evt) => {
  if (elementType !== PATH) {
    return;
  }

  bool_first_initialized = true;
  startPos = vec(currPos.x, currPos.y);
};

const pathMouseMove = (evt) => {
  if (elementType !== PATH || !ASSERT_VEC(startPos)) {
    return;
  }

  const SVG = document.getElementById(ID_SVG);

  // First time
  if (bool_first_initialized) {
    // create this element
    let _line = line(startPos, currPos, {
      id: `${ObjectSVGConfigs.PATH_ID}-${++int_pathUUID}`,
      ...STYLE_PATH
    });
    __ns(SVG, {}, _line );
    bool_first_initialized = false;
  } else {
    const currLine = document.getElementById(
      `${ObjectSVGConfigs.PATH_ID}-${int_pathUUID}`);
    __ns(currLine, {
      x2: currPos.x,
      y2: currPos.y
    });
  }
};

const pathMouseUp = (evt) => {
  if (elementType !== PATH) {
    return;
  }

  let id = `${ObjectSVGConfigs.PATH_ID}-${int_pathUUID}`;
  PATHS[id] = new Path(id, startPos, currPos);
  currentElement = null;
  startPos = vec(null, null);
  bool_first_initialized = false;
};