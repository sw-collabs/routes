import {__ns, circle, vec} from "./lib.js";

const ID_SVG = 'main-svg';

(() => {
  alert('hi there my name is jimmy');
  let SVG = document.getElementById(ID_SVG);
  __ns(SVG, {},
    circle(vec(100,100), 30, {
      'stroke-width': 10
    }));
})();
