import {clientToSnapCoords} from './lib.js';
import {ID_SVG, SECTION_CONFIG, STORE_SHELF_CONFIG} from './config.js';
import {__ns, vec, rect, update} from './gl.js';

const SECTION = 'section';
const STORE_SHELF = 'store-shelf';

/* The current element being edited/rendered by the user */
let currentElement = null;

/* TRUE if mouse is released, FALSE if LEFT button is down*/
let mouseUp = 1;

/* Position of mouse down event */
let startPos = vec(null, null);

let elementType = null;

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

export function onSectionClick() {
  alert('Section click!');
  elementType = SECTION;
}

export function onStoreShelfClick() {
  alert('Store shelf click!');
  elementType = STORE_SHELF;
}

export function onPathClick() {
  alert('Path click!');
}

export function onDoneClick() {
  alert('Done click!');
}

export const Path = {
  mousemove() { },
  mousedown() {  }
};

export const Section = {
  mousedown: (evt) => sectionMouseDown(evt),
  mousemove: (evt) => sectionMouseMove(evt),
  mouseup: (evt) => sectionMouseUp(evt)
};

export const StoreShelf = {
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

  createRectangleEvt(startPos, SECTION_CONFIG);
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
};

////////////////////////////////////////////////////////////////////////
////////// STORE-SHELF EVENT HANDLERS
const storeShelfMouseDown = (evt) => {
  if (elementType !== STORE_SHELF)
    return;

  startPos = clientToSnapCoords(
    vec(evt.clientX, evt.clientY)
  );

  createRectangleEvt(startPos, STORE_SHELF_CONFIG);
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
};