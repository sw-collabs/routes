import { INTERSECTIONS } from "./handlers.js";
import Queue from "./Queue.js"
import { getIntersection } from "./Intersection.js"
import { getPathByIntersections } from "./Path.js";

let G = null;

/**
 * IMPORTANT NOTE: Dijkstra algorithm will only be
 * correct in this case if the data set (i.e. INTERSECTIONS)
 * remains consistent throughout consecutive invocations
 * of Dijkstra.
 *
 * @param src The source point
 */
const initializeGraph = (src) => {
  if (G === null) {
    G = {};
    Object.values(INTERSECTIONS).forEach(isection => {
      G[isection.id] = {
        id: isection.id,
        pred: null,
        dist: Infinity
      }
    });
  } else {
    Object.values(G).forEach(v => {
      v.pred = null;
      v.dist = Infinity;
    });
  }

  G[src.id].dist = 0;
};

/**
 *
 * @param G graph
 * @param curr Intersection object
 * @param adj  Intersection object
 */
const relax = (G, curr, adj, weight) => {
  let adjV = G[adj.id];
  let currV = G[curr.id];
  if (adjV.dist > currV.dist + weight) {
    adjV.dist = currV.dist + weight;
    adjV.pred = currV;
  }
};

const backtrace = (G, dest) => {
  let P = [];

  let curr = dest;
  while (curr.pred !== null) {
    P.push(
      getPathByIntersections(
        INTERSECTIONS[curr.id].point,
        INTERSECTIONS[curr.pred.id].point
      )
    );
    curr = curr.pred;
  }
  return P;
};

/**
 * @param src: Intersection object
 * @param dests: List of Intersection objects
 * @returns {[]}
 */
export default function dijkstra(src, dests) {
  /*
   * 1. initialize graph - set all weights to infinity
   * 2. Closed set is empty
   * 3. Add all intersections to queue
   * 4. while q is !empty
   *      Get the vertex [u] with the shortest weight
   *      Put [u] into closed set
   *      For each of [u]'s adjacent vertices, relax
   */

  initializeGraph(src);
  let S = {}; // closed set

  let Q = new Queue((a, b) => a.dist < b.dist);
  Object.values(G).forEach(i => Q.insert(i));

  let curr;
  while (Q.size() > 0) {
    curr = Q.pop();
    if (dests.find(v => v.id === curr.id)) {
      break;
    }
    S[curr.id] = curr;

    let currISection = INTERSECTIONS[curr.id];
    Object.values(currISection.connectedPaths).forEach(path => {
      /*
       * 1. Get the path.to, path.from Intersection
       *    objects and determine which isection is
       *    the /adjacent/ one (id != currIsectionID)
       * 2. relax the distance to the object
       */

      const to = getIntersection(path.to);
      let adjISection = to.id === currISection.id ?
        getIntersection(path.from) : to;
      relax(G, currISection, adjISection, path.weight);
    });

    Q.reheap();
  }

  return backtrace(G, curr);
}