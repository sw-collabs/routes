const SVG_NS = 'http://www.w3.org/2000/svg';

export function __ns(elem, config={}, ...children) {
  Object.keys(config).forEach(k => {
    elem.setAttribute(k, config[k])
  });

  if (children) {
    children.forEach(child => {
      elem.appendChild(child);
    });
  }

  return elem;
}

export function vec(x, y) {
  return {x, y};
}

export function circle(vec, r, config={}) {
  const c = document.createElementNS(SVG_NS, 'circle');

  return __ns(c, {
    ...config,
    cx: vec.x,
    cy: vec.y,
    r
  });
}

export function polygon(points, config={}) {
  const p = document.createElementNS(SVG_NS, 'polygon');

  return __ns(p, {
    ...config,
    points
  });
}

export function polyline(points, config={}) {
  const p = document.createElementNS(SVG_NS, 'polyline');

  return __ns(p, {
    points,
    ...config
  });
}

export function line(vecf, vect, config={}) {
  const l = document.createElementNS(SVG_NS, 'line');
  l.style.zIndex = '1';

  return __ns(l, {
    ...config,
    x1: vecf.x,
    y1: vecf.y,
    x2: vect.x,
    y2: vect.y
  });
}

export function rect(vecf, w, h, config={}) {
  const r = document.createElementNS(SVG_NS, 'rect');
  return __ns(r, {
    ...config,
    x: vecf.x,
    y: vecf.y,
    width: w,
    height: h
  });
}

export function g(id, ...children) {
  const g = document.createElementNS(SVG_NS, 'g');
  return __ns(g, {'id' : id}, ...children);
}

export function text(vec, words, config={}) {
  const t = document.createElementNS(SVG_NS, 'text');
  if (typeof words === 'string') {
    t.innerHTML = words;
  } else {
    t.appendChild(words);
  }
  t.style.zIndex = '1';

  return __ns(t, {
    ...config,
    x: vec.x, y: vec.y
  });
}

export function update(elem, config) {
  for (let [k, v] of Object.entries(config)) {
    elem.setAttribute(k, v);
  }
  return elem;
};


