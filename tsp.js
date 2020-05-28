import dijkstra from "./dijkstra.js";
import Point from "./tsp/Point.js";

export function tourLength(Tour) {
  let length = 0;

  let i;
  for (i=1; i<Tour.length; i++) {
    let curr = Tour[i].point;
    let prev = Tour[i-1].point;
    length += curr.distanceFrom(prev.intersection).distance;
  }

  return length;
}

export function nearestNeighbor(clusters, start, end) {
  /*
   * From start, visit each cluster at most once and
   * return to end. The next cluster to visit is the
   * cluster closest to the current intersection.
   *
   * Tour: [{
   *  cluster, // null if start / end
   *  intersection,
   * }]
   */
  let Tour = [];

  let visited = {};
  let currIsection = start;

  Tour.push({
    cluster: null,
    point: new Point(start, [])
  });

  // Compute the first cluster to visit
  let firstVisit;
  {
    let min = Infinity;
    let minPoint = null;
    let minCluster = null;
    Object.values(clusters).forEach(cluster => {
      let {distance, point} = cluster.minFrom(start);
      if (distance < min) {
        min = distance;
        minPoint = point;
        minCluster = cluster;
      }
    });

    visited[minCluster.id] = true;
    Tour.push({
      cluster: minCluster,
      point: minPoint
    });
    firstVisit = minPoint.intersection;
  }

  currIsection = firstVisit;
  while (currIsection.id !== end.id) {
    let min = Infinity;
    let minPoint = null;
    let minCluster = null;
    Object.values(clusters).forEach(cluster => {
      if (!visited.hasOwnProperty(cluster.id)) {
        let {distance, point} = cluster.minFrom(currIsection);
        if (distance < min) {
          min = distance;
          minPoint = point;
          minCluster = cluster;
        }
      }
    });

    if (minCluster !== null) {
      visited[minCluster.id] = true;
      currIsection = minPoint.intersection;
      Tour.push({
        cluster: minCluster,
        point: minPoint
      });
    } else {
      // All clusters visited, go to end
      currIsection = end;
      Tour.push({
        cluster: null,
        point: new Point(end, [])
      });
    }
  }

  // TODO: trace paths from Tour
  let paths = [];
  return Tour;
}

/**
 * Returns new Tour after a single round of 2-opt
 * @param Tour
 */
export function twoOptSwap(Tour) {
  // No point in optimizing trivially small tours
  if (Tour.length <= 3) {
    return Tour;
  }

  let i, k;
  i = Math.floor(Math.random() * (Tour.length - 2)) + 1;
  k = Math.floor(Math.random() * (Tour.length - i - 2)) + i + 1;

  // construct new tour
  let newTour = [];
  {
    let n;
    for (n = 0; n <= i; n++) {
      newTour.push(Tour[n]);
    }
  }

  // i'th cluster to k'th cluster reroute
  {
    let {point} = Tour[k].cluster.minFrom(
      newTour[i].point.intersection
    );
    newTour.push({
      cluster: Tour[k].cluster,
      point
    });
  }

  /*
   * Reverse Tour and emplace to newTour.
   *
   * 'n': index of Tour
   * 'm': index of newTour
   * Use 'n' to access Tour. Since this is the reverse step,
   * 'n' is decrementing starting at k-1.
   * Use 'm' to access newTour. Starting at this step, index
   * for newTour diverges with index of Tour (i.e. whereas
   * newTour keeps increasing, we are accessing decreasing
   * Tour.
   *
   * Note: 'm' points at the PREVIOUS cluster for convenience,
   * as we need to re-evaluate the shortest path from the
   * previous (m'th) newTour cluster to the current (n'th)
   * Tour cluster.
   */
  {
    let n, m;
    for (n=k-1, m=i+1; n >= i+1; n--, m++) {
      let isSame = newTour[m].point.equals(Tour[n+1].point);
      if (isSame) {
        newTour.push(Tour[n]);
        continue;
      }

      let {point} = Tour[n].cluster.minFrom(
        newTour[m].point.intersection
      );
      newTour.push({
        cluster: Tour[n].cluster,
        point
      });
    }
  }

  {
    let {point} = Tour[k+1].cluster.minFrom(
      newTour[newTour.length-1].intersection
    );
    newTour.push({
      cluster: Tour[k+1].cluster,
      point
    });
  }

  {
    let n = k+2;
    let m = newTour.length - 1;
    for (; n < Tour.length-1; n++, m++) {
      let isSame = newTour[m].point.equals(Tour[n-1].point);
      if (isSame) {
        newTour.push(Tour[n]);
        continue;
      }

      let {point} = Tour[n].cluster.minFrom(
        newTour[m].point.intersection
      );
      newTour.push({
        cluster: Tour[n].cluster,
        point
      });
    }
  }

  // Finally, push end
  newTour.push(Tour[Tour.length-1]);
  return newTour;
}