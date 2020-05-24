import BaseObject from "./BaseObject.js";
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
}
