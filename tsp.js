import dijkstra from "./dijkstra.js";


export function nearestNeighbor(clusters, start, end) {
  /*
   * From start, visit each cluster at most once and
   * return to end. The next cluster to visit is the
   * cluster closest to the current intersection.
   */
  let paths = [];

  let visited = {};
  let currIsection = start;

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
    paths.push(minPoint.distanceFrom(start).paths);
    firstVisit = minPoint.intersection;
  }

  currIsection = firstVisit;
  while (currIsection.id !== end.id) {
    console.log(currIsection);
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
      paths.push(minPoint.distanceFrom(currIsection).paths);
      currIsection = minPoint.intersection;
    } else {
      // All clusters visited, go to end
      paths.push(dijkstra(currIsection, [end]));
      currIsection = end;
    }
  }

  return paths;
}