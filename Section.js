import BaseObject from "./BaseObject.js";
import { ObjectTypes } from "./BaseObject.js"
import { SECTIONS } from "./handlers.js";
import {__ns, rect} from "./gl.js";
import {ID_SECTION_G, STYLE_SECTION} from "./config.js";

export function importSection(json) {
  console.assert(!SECTIONS.hasOwnProperty(json.id));
  let section = new Section(
   json.id,
   json.topLeft,
   json.botRight,
   json.name,
   json.annotations
  );

  SECTIONS[section.id] = section;
  return section; // for convenience
}

export default class Section extends BaseObject {
  constructor(id, topLeft, botRight, name, annotations) {
    super(id, ObjectTypes.SECTION);

    /* vec objects*/
    this.topLeft = topLeft;
    this.botRight = botRight;

    /* User submitted element info*/
    this.name = name;
    this.annotations = [];
    this.annotations.concat(annotations);

    /*
     * Might be necessary in the future.
     * This would contain all of the stores/shelves
     * contained in the section
     */
    this.store_shelves = [];

    __ns(
      document.getElementById(ID_SECTION_G),
      {},
      rect(
        this.topLeft,
        this.width(),
        this.height(),
        {
          ...STYLE_SECTION,
          id: this.id
        }
      )
    );
  }

  width() {
    return this.botRight.x - this.topLeft.x;
  }

  height() {
    return this.botRight.y - this.topLeft.y;
  }

  json() {
    return {
      id: this.id,
      topLeft: this.topLeft,
      botRight: this.botRight,
      name: this.name,
      annotations: this.annotations
    };
  }
}
