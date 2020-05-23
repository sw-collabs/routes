import BaseObject from "./BaseObject.js";
import { ObjectTypes } from "./BaseObject.js"

export default class StoreShelf extends BaseObject {
  constructor(id, topLeft, botRight) {
    super(id, ObjectTypes.STORE_SHELF);
    this.topLeft = topLeft;
    this.botRight = botRight;
  }
}
