const SVG_NS = 'http://www.w3.org/2000/svg';

export const ASSERT_VEC = v => v !== null && v.x !== null && v.y !== null;
export const DISTANCE = v => Math.sqrt(v.x*v.x + v.y*v.y);
export const ABS = v => vec(Math.abs(v.x), Math.abs(v.y));
export const SQR_DIST = v => v.x * v.x + v.y * v.y;
export const NORMALIZE = v => vec(v.x/DISTANCE(v), v.y/DISTANCE(v));
export const SUB = (v1, v2) => vec(v1.x-v2.x, v1.y-v2.y);
export const ADD = (v1, v2) => vec(v1.x+v2.x, v1.y+v2.y);
export const SCALAR_MULT = (s, v) => vec(s*v.x, s*v.y);
export const EQUALS = (v1, v2) => v1.x === v2.x && v1.y === v2.y;
export const LEQUALS = (v1, v2) => v1.x <= v2.x && v1.y <= v2.y;
export const VEC_STR = v => `${v.x}-${v.y}`;

export function mat2(a11, a12, a21, a22) {
  /*
   | a11 a12 |
   | a21 a22 |
   */
  return {
    a11,
    a12,
    a21,
    a22
  };
}

export function det(mat2) {
  const {a11, a12, a21, a22} = mat2;
  return a11 * a22 - a12 * a21;
}

export function cross3(vec3_a, vec3_b) {
  console.assert(vec3_a.z !== null);
  console.assert(vec3_b.z !== null);

  let a1, a2, a3;
  let b1, b2, b3;

  a1 = vec3_a.x;
  a2 = vec3_a.y;
  a3 = vec3_a.z;
  b1 = vec3_b.x;
  b2 = vec3_b.y;
  b3 = vec3_b.z;

  return vec3(
    a2 * b3 - a3 * b2,
    a3 * b1 - a1 * b3,
    a1 * b2 - a2 * b1
  );
}

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

export function vec3(x, y, z) {
  return {x, y, z};
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


