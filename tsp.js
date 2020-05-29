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

export function tourPaths(Tour) {
  let paths = [];

  let i;
  for (i=1; i<Tour.length; i++) {
    let curr = Tour[i].point;
    let prev = Tour[i-1].point;
    paths.push(curr.distanceFrom(prev.intersection).paths);
  }

  return paths;
}

export function randomClusters(clusters, start, end) {
  let Tour = [];

  Tour.push({
    cluster: null,
    point: new Point(start, [])
  });

  Object.values(clusters).forEach(cluster => {
    let points = cluster.points;
    let numPoints = Object.keys(points).length;
    let rand = Math.floor(Math.random() * numPoints);
    Tour.push({
      cluster,
      point: Object.values(points)[rand]
    });
  });

  Tour.push({
    cluster: null,
    point: new Point(end, [])
  });

  return Tour;
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

  return Tour;
}

function genTwoOptIndices(tourLength) {
  let i = Math.floor(Math.random()*(tourLength-4))+1;
  let k = Math.floor(Math.random()*(tourLength-i-3))+i+1;

  return {i, k};
}

/**
 * @param Tour: Tour to optimize
 * @param MIN_COUNT: Used to detect when we've reached local minimum
 * @param MAX_ITERS: Used to limit number of 2-Opt rounds
 */
export function twoOpt(Tour, MIN_COUNT, MAX_ITERS) {
  // No point in optimizing trivially small tours
  if (Tour.length <= 3) {
    return Tour;
  }

  let iters = 0;
  let minLength = tourLength(Tour);

  let i, k
  let prev_i = -1, prev_k = -1;
  let minCount = 0;
  while (minCount < MIN_COUNT && iters < MAX_ITERS) {
    // 0 ... i, i+1, ..., k, k+1, ..., Tour.length-1
    ({i, k} = genTwoOptIndices(Tour.length));

    if (i !== prev_i && k !== prev_k) {
      let newTour = twoOptSwap(Tour, i, k);
      let len = tourLength(newTour);
      console.log(`2-Opt[${iters}]: Min: ${minLength}, New: ${len}`);
      if (len < minLength) {
        Tour = newTour;
        minLength = len;
        minCount = 0; // reset minCount
      } else {
        minCount++;
      }

      prev_i = i;
      prev_k = k;
      iters++;
    }
  }

  return Tour;
}

/**
 * Returns new Tour after a single round of 2-opt
 * @param Tour
 */
export function twoOptSwap(Tour, i, k) {
  // T[0] -> T[i]
  let newTour = [];
  {
    let n;
    for (n = 0; n <= i; n++) {
      newTour.push(Tour[n]);
    }
  }

  // T[i] -> T[k]
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
   * T[k-1] -> T[i+1]: Reverse Tour and emplace to newTour.
   *
   * 'n': index of Tour
   * 'm': index of newTour
   *
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

  // T[i+1] -> T[k+1]
  {
    let {point} = Tour[k+1].cluster.minFrom(
      newTour[newTour.length-1].point.intersection
    );
    newTour.push({
      cluster: Tour[k+1].cluster,
      point
    });
  }

  // T[k+1] -> T[length(T)-2]
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

export function simulatedAnnealing(Tour, temp, tempDelta) {
  let WinnerTour = Tour;
  let CurrTour = Tour;
  let tourLength = Tour.length;

  let CurrTourLen = tourLength(Tour);
  let WinnerTourLen = CurrTourLen;

  while (temp >= 0) {
    let isEquilibium = false;
    while (!isEquilibium) {
      let {i, k} = genTwoOptIndices(tourLength);
      let NewTour = twoOptSwap(CurrTour, i, k);

      let NewTourLen = tourLength(NewTour);
      if (NewTourLen < WinnerTourLen) {
        WinnerTour = NewTour;
        WinnerTourLen = NewTourLen;
      }

      let delta = NewTourLen - CurrTourLen;
      if (delta < 0) {
        CurrTour = NewTour;
        CurrTourLen = NewTourLen;
      } else {
        // TODO
      }
    }
  }
}