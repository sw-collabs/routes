import {__ns, circle, vec, line, g} from "./lib.js";
import * as handlers from "./handlers.js";

const ID_SVG = 'main-svg';


/* Button Event Handlers */
const ButtonEvents = {
  uiHandleSectionClick: () => handlers.onSectionClick(),
  uiHandleStoreShelfClick: () => handlers.onStoreShelfClick(),
  uiHandlePathClick: () => handlers.onPathClick(),
  uiHandleDoneClick: () => handlers.onDoneClick()
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
  const GRID_CLR = '#dbdbdb';
  const GRID_SIZE = 20;
  const GRID_LINE_CONFIG = {'stroke-width': 0.5, 'stroke' : GRID_CLR};

  const initSVG = () => {
    let SVG = document.getElementById(ID_SVG);
    SVG.addEventListener('mousedown', testSnap);

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
        elems.push(line(vec(i, 0), vec(i, height), GRID_LINE_CONFIG));
      }
    }

    // Horizontal lines
    {
      let i;
      for (i = 0; i < height; i += GRID_SIZE) {
        elems.push(line(vec(0, i), vec(width, i), GRID_LINE_CONFIG));
      }
    }

    __ns(SVG, {}, g('grid-lines', ...elems));
  };

  /*
   * TBD - test if snap to grid works
   */
  const testSnap = (evt) => {
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
  };


  /*
   * Snaps the given position to a point
   * on the grid.
   * @returns vector with snapped position
   */
  const snapToGrid = (x, y) => {
    const {width, height} =
      document.getElementById(ID_SVG).getBoundingClientRect();

    return {
      x: Math.min(GRID_SIZE * Math.round(x / GRID_SIZE), width),
      y: Math.min(GRID_SIZE * Math.round(y / GRID_SIZE), height)
    };
  };

  (() => {
    initSVG();
  })();
}
////////////////////////////////////////////////////////////////////////////////
