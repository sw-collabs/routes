import {__ns, circle, vec} from "./lib.js";

const ID_SVG = 'main-svg';

const GRID_CLR = '#dbdbdb';
const GRID_SIZE = 5;


const initGrid = () => {
  let SVG = document.getElementById(ID_SVG);

  const {width, height} = SVG.getBoundingClientRect();

  // Draw vertical lines every GRID_SIZE pixels
  let i;
  for (i=0; i < width; i+=GRID_SIZE) {
    SVG.appendChild
  }


};

(() => {
  initGrid();
})();
