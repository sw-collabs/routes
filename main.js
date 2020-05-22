import {__ns, circle, vec, line, g} from "./gl.js";
import * as handlers from "./handlers.js";
import {ID_SVG, GRID_LINE_CONFIG, GRID_SIZE} from "./config.js";
import {snapToGrid} from "./lib.js"


/* Button Event Handlers */
const ButtonEvents = {
  uiHandleSectionClick: () => handlers.onSectionClick(),
  uiHandleStoreShelfClick: () => handlers.onStoreShelfClick(),
  uiHandlePathClick: () => handlers.onPathClick(),
  uiHandleDoneClick: () => handlers.onDoneClick()
};
const SVGEvents = {
  'mousedown': [
    handlers.Path.mousedown,
    /*
     * Test if snap to grid works
     */
    (evt) => {
      let SVG = document.getElementById(ID_SVG);

      let {left, top} = SVG.getBoundingClientRect();
      let x = evt.clientX - left;
      let y = evt.clientY - top;

      let pt = snapToGrid(x, y);
      __ns(SVG,
        {},
        circle(pt, 2, {
          'fill': 'black'
        }));
    },
    handlers.Section.mousedown,
    handlers.StoreShelf.mousedown,
    handlers.mousedown
  ],
  'mousemove': [
    handlers.Path.mousemove,
    handlers.Section.mousemove,
    handlers.StoreShelf.mousemove,
    handlers.mousemove
  ],
  'mouseup': [
    handlers.Path.mouseup,
    handlers.Section.mouseup,
    handlers.StoreShelf.mouseup,
    handlers.mouseup
  ]
};


/* Add import from this module to HTML file here */
window.Main = {
  ButtonEvents
};


////////////////////////////////////////////////////////////////////////////////
/* Anything that needs to be initialized in svg is done here
 * (i.e. event handlers)
 */
{
  const initSVG = () => {
    let SVG = document.getElementById(ID_SVG);

    /*
     * Create a group for each element type:
     * Section, Store/Shelf, Path
     */
    __ns(SVG, {}, g('sections'));
    __ns(SVG, {}, g('store-shelf'));
    __ns(SVG, {}, g('paths'));

    /*
     * Adds all event handlers defined from SVGEvents
     */
    for (let [k, v] of Object.entries(SVGEvents)) {
      v.forEach(handler => {
        console.log(k, handler);
        SVG.addEventListener(k, handler);
      });
    }

    initGrid();
  };

  /* Initialize grid on svg canvas */
  const initGrid = () => {
    let SVG = document.getElementById(ID_SVG);
    const {width, height} = SVG.getBoundingClientRect();

    // Draw vertical lines every GRID_SIZE pixels
    let elems = [];
    {
      let i;
      for (i = 0; i < width; i += GRID_SIZE) {
        elems.push(
          line(vec(i, 0), vec(i, height), GRID_LINE_CONFIG)
        );
      }
    }

    // Horizontal lines
    {
      let i;
      for (i = 0; i < height; i += GRID_SIZE) {
        elems.push(
          line(vec(0, i), vec(width, i), GRID_LINE_CONFIG)
        );
      }
    }

    __ns(SVG, {}, g('grid-lines', ...elems));
  };


  (() => {
    initSVG();
  })();
}
////////////////////////////////////////////////////////////////////////////////
