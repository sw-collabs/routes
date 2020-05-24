import BaseObject from "./BaseObject.js";
import { ObjectTypes } from "./BaseObject.js"

export default class Section extends BaseObject {
  constructor(id, topLeft, botRight, name, annotations) {
    super(id, ObjectTypes.SECTION);

    /* vec objects*/
    this.topLeft = topLeft;
    this.botRight = botRight;

    /* User submitted element info*/
    this.name = name;
    this.annotations = annotations;

    /*
     * Might be necessary in the future.
     * This would contain all of the stores/shelves
     * contained in the section
     */
    this.store_shelves = [];
  }
}
