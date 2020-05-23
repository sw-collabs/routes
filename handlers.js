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

const ObjectTypes = {
  PATH: 'PATH',
  SECTION: 'SECTION',
  STORE_SHELF: 'STORE_SHELF'
};

class Object {
  constructor(id, type) {
    this.id = id;
    this.type = type;
  }
}

class StoreShelf extends Object {
  constructor(id, topLeft, botRight) {
    super(id, ObjectTypes.STORE_SHELF);
    this.topLeft = topLeft;
    this.botRight = botRight;
  }
}

class Path extends Object {
  constructor(id, from, to) {
    super(id, ObjectTypes.PATH);
    this.from = from;
    this.to = to;
    this.unitVec = gl.NORMALIZE(gl.SUB(to, from));
    this.adjStoreShelves = [];
  }

  lineIntersection(path) {
    return lineLineIntersection(
      this.from,
      this.to,
      path.from,
      path.to
    );
  }

  /*
   * Gets all stores which are adjacent to the current
   * path, stores it in 'adjStoreShelves'.
   *
   * (1) Use 'unitVec' to traverse along this path. until hits
   *     a new grid point.
   * (2) From the new grid point, generate a ray perpendicular
   *     to 'unitVec'. Find the first STORE_SHELF box to intersect
   *     with this ray and store it in 'adjStoreShelves'
   * (3) Do this starting from 'this.from' until reaches
   *     'this.to'
   */
  updateAdjacency() {
    const T_MAX = 5.0;
    this.adjStoreShelves = {};

    /*
     * - Transform 'unitVec' into 3D vector by adding 0 as
     *   the z value.
     * - Compute perpendicular vector to 'unitVec' by taking
     *   cross product with z-axis. Since 'unitVec' is on
     *   x-y plane, a cross product with the z-axis is
     *   guaranteed to be on the x-y plane, and orthogonal
     *   to both 'unitVec' and the z-axis.
     * - Set this as 'front'
     * - 'back' is simply the reverse direction of 'front'
     */
    let front, back;
    {
      let _u3 = vec3(this.unitVec.x, this.unitVec.y, 0);
      let _front = cross3(_u3, vec3(0,0,1));
      front = gl.NORMALIZE(vec(_front.x, _front.y));
      back = gl.SUB(vec(0,0), front);
    }

    // Lambda
    const intersect = (ray, box) => {
      let intersects, t;

      ({intersects, t} =
          rayBoxIntersection(currGrid,
                             ray,
                             box.topLeft,
                             box.botRight)
      );

      if (intersects &&
          t <= T_MAX &&
          !this.adjStoreShelves.hasOwnProperty(box.id)
      ) {
        this.adjStoreShelves[box.id] = box;
      }
    };

    let currGrid = this.from;
    while (gl.LEQUALS(currGrid, this.to)) {
      Object.values(STORE_SHELVES).forEach(box => {
        intersect(front, box);
        intersect(back, box);
      });

      let newGrid, p;
      do {
        // p = p + 0.3*u
        p = gl.ADD(p, gl.SCALAR_MULT(0.3, this.unitVec));
        newGrid = snapToGrid(p.x, p.y);
      } while (gl.EQUALS(newGrid, currGrid));
      currGrid = newGrid;
    }
  }

  /*
   * Cuts a path into 2 paths based on the given point
   * which is guaranteed to be a point on this Path
   *
   * Note: after this function, Path should no longer
   * be used.
   */
  cut(atPoint) {
    return {
      first: new Path(this.from, atPoint),
      second: new Path(atPoint, this.to)
    };
  }
}

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
  alert('Section click!');
  elementType = SECTION;
}

export function onStoreShelfClick() {
  alert('Store shelf click!');
  elementType = STORE_SHELF;
}

export function onPathClick() {
  alert('Path click!');
  elementType = PATH;
}

export function onDoneClick() {
  alert('Done click!');
}

export const Path = {
  mousemove: (evt) => pathMouseMove(evt),
  mousedown: (evt) => pathMouseDown(evt),
  mouseup: (evt) => pathMouseUp(evt)
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
  const ID_STR = 'path';

  // First time
  if (bool_first_initialized) {
    // create this element
    let _line = line(startPos, currPos, {
      id: `${ID_STR}-${++int_pathUUID}`,
      ...STYLE_PATH
    });
    __ns(SVG, {}, _line );
    bool_first_initialized = false;
  } else {
    const currLine = document.getElementById(`${ID_STR}-${int_pathUUID}`);
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

  currentElement = null;
  startPos = vec(null, null);
  bool_first_initialized = false;
};
