import BaseObject from "./BaseObject.js";
import { vec } from "./gl.js"
import { ObjectTypes } from "./BaseObject.js"

export default class StoreShelf extends BaseObject {
  constructor(id, topLeft, botRight, name, annotations) {
    super(id, ObjectTypes.STORE_SHELF);
    this.topLeft = topLeft;
    this.botRight = botRight;

    this.name = name;
    this.annotations = annotations;

    /* The section that this object is stored in */
    this.parentSection = null;
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
}
