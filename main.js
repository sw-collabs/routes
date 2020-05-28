import {__ns, circle, vec, text, line, g} from "./gl.js";
import * as handlers from "./handlers.js";
import {
  ID_SVG,
  ID_STORE_SHELVES_G,
  ID_PATH_G,
  ID_SECTION_G,
  ID_INTERSECTION_G,
  ID_DISPLAY_LAYER_G,
  GRID_LINE_CONFIG,
  GRID_SIZE, ID_GRID_LINES
} from "./config.js";
import Queue from "./Queue.js";


/* Button Event Handlers */
const ButtonEvents = {
  uiHandleSectionClick: () => handlers.onSectionClick(),
  uiHandleStoreShelfClick: () => handlers.onStoreShelfClick(),
  uiHandlePathClick: () => handlers.onPathClick(),
  uiHandleDoneClick: () => handlers.onDoneClick(),
  uiHandleInfoSubmit: () => handlers.onInfoSubmit(),
  uiHandleExportClick: () => handlers.onExportClick(),
  uiHandleShoppingListSubmit: () => handlers.onShoppingListSubmit(),
  uiHandleToggleClick: () => handlers.onToggleClick(),
  uiHandleToggleGridClick: () => handlers.onToggleGridClick()
};

const SVGEvents = {
  'mousedown': [
    handlers.PathHandlers.mousedown,
    handlers.SectionHandlers.mousedown,
    handlers.StoreShelfHandlers.mousedown,
    handlers.mousedown
  ],
  'mousemove': [
    handlers.PathHandlers.mousemove,
    handlers.SectionHandlers.mousemove,
    handlers.StoreShelfHandlers.mousemove,
    handlers.mousemove
  ],
  'mouseup': [
    handlers.PathHandlers.mouseup,
    handlers.SectionHandlers.mouseup,
    handlers.StoreShelfHandlers.mouseup,
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
function testQueue() {
  // Example queue usage:
  let q = new Queue((v1, v2) => v1.key < v2.key);
  for (let i=0; i<100; i++) {
    let V = {key: Math.random()*100};
    q.insert(V);

    // Change the keys
    V.key = Math.random()*200;
  }
  // Run reheap
  q.reheap();

  let v;
  while (v = q.pop()) {
    console.log(v);
  }
}

{
  const initSVG = () => {
    document.getElementById("import").addEventListener("change", handlers.onImportClick);
    let SVG = document.getElementById(ID_SVG);

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

    /*
     * Create a group for each element type:
     * Section, Store/Shelf, Path
     */
    __ns(SVG, {}, g(ID_SECTION_G));
    __ns(SVG, {}, g(ID_DISPLAY_LAYER_G));
    __ns(SVG, {}, g(ID_STORE_SHELVES_G));
    __ns(SVG, {}, g(ID_PATH_G));
    __ns(SVG, {}, g(ID_INTERSECTION_G));
  };

  /* Initialize grid on svg canvas */
  const initGrid = () => {
    let SVG = document.getElementById(ID_SVG);
    const {width, height} = SVG.getBoundingClientRect();

    // Draw vertical lines every GRID_SIZE pixels
    let elems = [];
    {
      let ind = 0;
      let i;
      for (i = 0; i < width; i += GRID_SIZE, ind++) {
        elems.push(
          line(vec(i, 0), vec(i, height), GRID_LINE_CONFIG)
        );
        elems.push(
          text(vec(i, 8), `${ind}`, {
            'fill': 'white',
            'font-family': 'Helvetica',
            'font-size': '10'
          })
        )
      }
    }

    // Horizontal lines
    {
      let ind = 0;
      let i;
      for (i = 0; i < height; i += GRID_SIZE, ind++) {
        elems.push(
          line(vec(0, i), vec(width, i), GRID_LINE_CONFIG)
        );
        elems.push(
          text(vec(0, i+2), `${ind}`, {
            'fill': 'white',
            'font-family': 'Helvetica',
            'font-size': '10'
          })
        )
      }
    }

    __ns(SVG, {}, g(ID_GRID_LINES, ...elems));
  };


  (() => {
    initSVG();
  })();
}
////////////////////////////////////////////////////////////////////////////////
