import StoreShelf from "./StoreShelf.js";
import BaseObject from "./BaseObject.js";
import Section from "./Section.js";
import Intersection, {
  getIntersection,
  upsertIntersection,
  removeFromIntersection
} from "./Intersection.js";
import Path from "./Path.js";
import { ObjectTypes, ObjectSVGConfigs } from "./BaseObject.js";

import {
  clientToSnapCoords,
  svgCoordsToGridCoords,
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
  ID_DISPLAY_LAYER_G,
  STYLE_SECTION,
  STYLE_STORE_SHELF,
  STYLE_PATH,
  STYLE_STORE_SHELF_TEXT,
  STYLE_ADJ_DISPLAY
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
let currGridCoords = vec(null, null);
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
  currGridCoords = svgCoordsToGridCoords(currPos);
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
  Object.values(PATHS).forEach(path => {
    console.assert(path.type === ObjectTypes.PATH);
    path.updateAdjacency();

    // Highlight all adjacent stores
    const center = vec(
      path.from.x + (path.to.x - path.from.x)/2,
      path.from.y + (path.to.y - path.from.y)/2
    );

    const DISPLAY_G = document.getElementById(ID_DISPLAY_LAYER_G);
    Object.values(path.adjStoreShelves).forEach(adj => {
      if (adj.type === ObjectTypes.STORE_SHELF) {
        __ns(DISPLAY_G, {},
          line(center, adj.center(), STYLE_ADJ_DISPLAY)
        );
      }
    });
  });
}

export function onExportClick() {
  alert('export click');
}

export function onImportClick() {
  alert('import click');
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
  if (currentElement === null) {
    alert('ERROR: current element is NULL!!');
    return;
  }

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

  startPos = vec(currPos.x, currPos.y);
  currentElement = null;
};

const pathMouseMove = (evt) => {
  if (elementType !== PATH || !ASSERT_VEC(startPos)) {
    return;
  }

  if (currentElement === null) {
    currentElement = line(startPos, currPos, STYLE_PATH);
    __ns(document.getElementById(ID_SVG), {}, currentElement);
  } else {
    // draw only horizontal or vertical lines
    let delta = gl.ABS(gl.SUB(currPos, startPos));
    let isX = delta.x >= delta.y;
    __ns(currentElement, {
      x2: isX ? currPos.x : startPos.x,
      y2: !isX ? currPos.y : startPos.y
    })
  }
};

const pathMouseUp = (evt) => {
  if (elementType !== PATH) {
    return;
  }

  document.getElementById(ID_SVG).removeChild(currentElement);
  const NewPath = new Path(
    vec(
      parseFloat(currentElement.getAttribute('x1')),
      parseFloat(currentElement.getAttribute('y1'))
    ),
    vec(
      parseFloat(currentElement.getAttribute('x2')),
      parseFloat(currentElement.getAttribute('y2'))
    )
  );
  upsertIntersection(NewPath.from, NewPath);
  upsertIntersection(NewPath.to, NewPath);

  /*
   * If current path intersects with any paths, break them
   * apart. Since all lines are guaranteed to be straight,
   * lines can intersect at most once.
   *
   * Approach:
   * For each path in PATHS, check if current path intersects
   * with it. If intersects:
   * (1) Cut current path into 2 segments at the intersection
   *     point
   * (2) Cut other path into 2 segments at the intersection
   *     point
   * (3) Discard paths which were cut
   * (4) Create new intersection (if not exists)
   *
   * Note: define 'other' as the path which intersects with
   * the main (or current) path.
   */
  let currPathSegments = { [NewPath.id]: NewPath };
  let otherPathSegments = [];

  Object.values(PATHS).forEach(path => {
    Object.values(currPathSegments).forEach(currPath => {
      let atPoint = currPath.lineIntersection(path);
      if (atPoint !== null) {
        // intersects at 'atPoint'
        let currSegments = currPath.cut(atPoint);
        let otherSegments = path.cut(atPoint);

        // Initialize cut segments for main path
        if (currSegments.length > 0) {
          removeFromIntersection(currPath.from, currPath);
          removeFromIntersection(currPath.to, currPath);
          currPath.undraw();
          delete currPathSegments[currPath.id];

          // Create new paths
          currSegments.forEach(({from, to}) => {
            let newCurrPath = new Path(from, to);
            currPathSegments[newCurrPath.id] = newCurrPath;

            upsertIntersection(newCurrPath.from, newCurrPath);
            upsertIntersection(newCurrPath.to, newCurrPath);
          });
        }

        // Initialize cut segments for 'other' path
        if (otherSegments.length > 0) {
          removeFromIntersection(path.from, currPath);
          removeFromIntersection(path.to, currPath);
          path.undraw();
          delete PATHS[path.id];

          // Create new paths
          otherSegments.forEach(({from, to}) => {
            let newOtherPath = new Path(from, to);
            otherPathSegments.push(newOtherPath);

            upsertIntersection(newOtherPath.from, newOtherPath);
            upsertIntersection(newOtherPath.to, newOtherPath);
          });
        }
      }
    });
  });

  // Finally, commit path
  Object.values(currPathSegments).forEach(path => {
    PATHS[path.id] = path;
  });
  otherPathSegments.forEach(path => {
    PATHS[path.id] = path;
  })

  currentElement = null;
  startPos = vec(null, null);
};
