import StoreShelf from "./StoreShelf.js";
import BaseObject from "./BaseObject.js";
import Section from "./Section.js";
import Path from "./BaseObject.js";
import { ObjectTypes, ObjectSVGConfigs } from "./BaseObject.js";

import {
  clientToSnapCoords,
  lineLineIntersection,
  rayBoxIntersection,
  snapToGrid,
  getRectCorners,
  getRectCenter
} from './lib.js';
import {
  ID_SVG,
  ID_ELEMENT_FORM,
  ID_SECTION_G,
  ID_PATH_G,
  ID_STORE_SHELVES_G,
  STYLE_SECTION,
  STYLE_STORE_SHELF,
  STYLE_PATH,
  STYLE_STORE_SHELF_TEXT
} from './config.js';
import {__ns, vec, vec3, cross3, rect, line, update, ASSERT_VEC, text} from './gl.js';
import * as gl from './gl.js';

const SECTION = 'section';
const STORE_SHELF = 'store-shelf';
const PATH = 'path';


/* The current element being edited/rendered by the user */
let currentElement = null;

/* TRUE if mouse is released, FALSE if LEFT button is down*/
let mouseUp = 1;

let processingElemInfo = false;

/* Position of mouse down event */
let startPos = vec(null, null);
let currPos = vec(null, null);
let bool_first_initialized = false;
let int_pathUUID = 0;
let int_sectionUUID = 0;
let int_storeShelfUUID = 0;

let elementType = null;

/* Put all objects here */
export let PATHS = {};
export let STORE_SHELVES = {};
export let SECTIONS = {};
export let INTERSECTIONS = {};


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

/*
 * Handles element info form submission
 * Should create a new StoreShelf/Section
 * object based on the newly created element
 * type.
 * Assumes that the new element is stored
 * in the currentElement variable
 */
export function onInfoSubmit() {
  if (currentElement === null)
    alert('ERROR: current element is NULL!!');

  const name = document.getElementById('element-name').value;
  const annotations = document.getElementById('annotations').value.split(',');

  let { topLeft, botRight } = getRectCorners(currentElement);

  let id;
  switch (elementType) {
    case SECTION:
      id = `${ObjectSVGConfigs.SECTION_ID}-${int_sectionUUID}`;
      SECTIONS[id] = new Section(id, topLeft, botRight, name, annotations);
      break;
    case STORE_SHELF:
      id = `${ObjectSVGConfigs.STORE_SHELF_ID}-${int_storeShelfUUID}`;
      STORE_SHELVES[id] = new StoreShelf(id, topLeft, botRight, name, annotations);

      /* Add text to store/shelf block  */
      __ns(
        document.getElementById(ID_STORE_SHELVES_G),
        {},
        text(
          getRectCenter(currentElement),
          name,
          STYLE_STORE_SHELF_TEXT
        )
      );
      break;
    default:
      break;
  }

  toggleElementForm(false);
  document.getElementById(ID_ELEMENT_FORM).reset();

  return false;
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
///////////////// HELPER FUNCTIONS
const toggleElementForm = (show) => {
  let form = document.getElementById(ID_ELEMENT_FORM);
  form.style.display = show ? 'block' : 'none';
  document.getElementById('element-name').focus();
  processingElemInfo = show;
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
const createRectangleEvt = (parent, pos, config, w=5, h=5) => {
  currentElement = rect(pos, w, h, config);

  __ns(parent, {}, currentElement);
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
  if (currentElement === null || mouseUp)
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
  if (elementType !== SECTION || processingElemInfo)
    return;

  startPos = clientToSnapCoords(
    vec(evt.clientX, evt.clientY)
  );

  createRectangleEvt(
    document.getElementById(ID_SECTION_G),
    startPos, {
    ...STYLE_SECTION,
    id: `${ObjectSVGConfigs.SECTION_ID}-${++int_sectionUUID}`
  });
};

const sectionMouseMove = (evt) => {
  if (elementType !== SECTION || processingElemInfo)
    return;

  updateRectangleEvt(evt);
};

const sectionMouseUp = (evt) => {
  if (elementType !== SECTION || processingElemInfo)
    return;

  toggleElementForm(true);

  startPos = vec(null, null);
};


////////////////////////////////////////////////////////////////////////
////////// STORE-SHELF EVENT HANDLERS
const storeShelfMouseDown = (evt) => {
  if (elementType !== STORE_SHELF || processingElemInfo)
    return;

  startPos = clientToSnapCoords(
    vec(evt.clientX, evt.clientY)
  );

  createRectangleEvt(
    document.getElementById(ID_STORE_SHELVES_G),
    startPos, {
    ...STYLE_STORE_SHELF,
    id: `${ObjectSVGConfigs.STORE_SHELF_ID}-${++int_storeShelfUUID}`
  });
};

const storeShelfMouseMove = (evt) => {
  if (elementType !== STORE_SHELF || processingElemInfo)
    return;

  updateRectangleEvt(evt);
};

const storeShelfMouseUp = (evt) => {
  if (elementType !== STORE_SHELF || processingElemInfo)
    return;

  toggleElementForm(true);

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
