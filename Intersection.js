import BaseObject, {ObjectTypes} from "./BaseObject";

export default class Intersection extends BaseObject {
  constructor(id, point) {
    super(id, ObjectTypes.INTERSECTION);
    this.point = point;
    this.connectedPaths = [];
  }
}