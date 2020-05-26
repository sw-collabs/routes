import BaseObject from "./BaseObject.js";
import { vec, rect } from "./gl.js"
import { STORE_SHELVES, INTERSECTIONS } from "./handlers.js";
import { ObjectTypes } from "./BaseObject.js"
import {__ns, text} from "./gl.js";
import {ID_STORE_SHELVES_G, STYLE_STORE_SHELF, STYLE_STORE_SHELF_TEXT} from "./config.js";
import {getRectCenter} from "./lib.js";


export function getStoreShelfByName(name) {
  return Object.values(STORE_SHELVES)
    .find(storeShelf => storeShelf.name === name);
}

/**
 * IMPORTANT: must be invoked 2 times:
 *
 * (1) Cold initialization - does not initialize 'intersections'
 *     since there is a circular dependency of 'intersections':
 *     i.e. StoreShelf -> Intersection -> Path -> StoreShelf
 * (2) Assumes INTERSECTIONS has been FULLY initialized.
 *     This time, populates the 'intersections' field.
 */
export function importStoreShelf(json) {
  let storeShelf;
  if (!STORE_SHELVES.hasOwnProperty(json.id)) {
    storeShelf = new StoreShelf(
      json.id,
      json.topLeft,
      json.botRight,
      json.name,
      json.annotations
    );
    STORE_SHELVES[storeShelf.id] = storeShelf;
  } else {
    console.assert(json.intersections.length === 0 || Object.keys(INTERSECTIONS).length > 0);
    console.assert(STORE_SHELVES.hasOwnProperty(json.id));

    storeShelf = STORE_SHELVES[json.id];
    json.intersections.forEach(isectionId => {
      console.assert(INTERSECTIONS.hasOwnProperty(isectionId));
      storeShelf.intersections[isectionId] = INTERSECTIONS[isectionId];
    });
  }
}

export default class StoreShelf extends BaseObject {
  constructor(id, topLeft, botRight, name, annotations) {
    super(id, ObjectTypes.STORE_SHELF);
    this.topLeft = topLeft;
    this.botRight = botRight;

    this.name = name;
    this.annotations = annotations;

    /* The section that this object is stored in */
    this.parentSection = null;

    /* List of intersections that are 'connected' to the element*/
    this.intersections = {};

    /* Add text to store/shelf block  */
    __ns(
      document.getElementById(ID_STORE_SHELVES_G),
      {},
      rect(
        this.topLeft,
        this.width(),
        this.height(),
        {
          ...STYLE_STORE_SHELF,
          id: this.id
        }
      ),
      text(
        this.center(),
        this.name,
        STYLE_STORE_SHELF_TEXT
      )
    );
  }

  width() {
    return this.botRight.x - this.topLeft.x;
  }

  height() {
    return this.botRight.y - this.topLeft.y;
  }

  center() {
    let xmin, xmax, ymin, ymax;

    xmin = this.topLeft.x;
    xmax = this.botRight.x;
    ymin = this.topLeft.y;
    ymax = this.botRight.y;

    return vec(
      xmin + (xmax - xmin) / 2,
      ymin + (ymax - ymin) / 2
    )
  }

  addIntersections(..._intersections) {
    _intersections.forEach(intersection => {
      if (!this.intersections.hasOwnProperty(intersection.id)) {
        this.intersections[intersection.id] = intersection;
      }
    });
  }

  json() {
    return {
      id: this.id,
      topLeft: this.topLeft,
      botRight: this.botRight,
      name: this.name,
      annotations: this.annotations,
      intersections: Object.values(this.intersections).map(isection => isection.id)
    };
  }
}
