"use strict";

/**
 * This class defines simple behaviours and minimal data of a disc.
 * Discs are used in the algorithm to find the smallest enclosing disc, which is necessary
 * to determine the next position of robots in a 2D environment.
 */
class Disc {
  constructor(p1, p2, p3 = null) {
    // if 3 points are provided, we can directly find the unique disc
    if (p3) {
      const {x, y, rSquared} = findDiscWith3Points(p1, p2, p3);
      this.center = {x, y};
      this.rSquared = rSquared;
      return;
    }

    // otherwise, our disc is the smallest possible with the 2 given points
    const {x: x1, y: y1} = p1;
    const {x: x2, y: y2} = p2;
    this.center = {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
    };
    this.rSquared = (x1 - this.center.x) ** 2 + (y1 - this.center.y) ** 2
  }

  /**
   * Determines if the given point is contained within the current disc
   * 
   * @param {Object} param0 coordinates of a given point
   */
  contains({x, y}) {
    return (x - this.center.x) ** 2 + (y - this.center.y) ** 2 <= this.rSquared;
  }
}

/**
 * Finds the unique disc provided 3 points on its boundary
 * Calculations are the simplified state of the computation determinant of a special matrix
 * Based on this answer: https://math.stackexchange.com/a/1460096
 * 
 * @param {Object} param0 first point 
 * @param {Object} param1 second point
 * @param {Object} param2 third point
 * @returns coordinates of the center (x,y) and the radius^2 of that disc
 */
function findDiscWith3Points({x: x1, y: y1}, {x: x2, y: y2}, {x: x3, y: y3}) {
  const a21 = x1 ** 2 + y1 ** 2; // 2nd row, 1st column in the matrix
  const a31 = x2 ** 2 + y2 ** 2;
  const a41 = x3 ** 2 + y3 ** 2;

  // compute the minors
  const M11 = x1 * (y2 - y3) -
              y1 * (x2 - x3) +
              x2 * y3 -
              y2 * x3;
  const M12 = a21 * (y2 - y3) -
              y1 * (a31 - a41) +
              a31 * y3 -
              y2 * a41;
  const M13 = a21 * (x2 - x3) -
              x1 * (a31 - a41) +
              a31 * x3 -
              x2 * a41;
  const M14 = a21 * (x2 * y3 - y2 * x3) -
              x1 * (a31 * y3 - y2 * a41) +
              y1 * (a31 * x3 - x2 * a41);

  // compute the center (x,y) and the radius of the disc
  const x = M12 / M11 / 2; 
  const y = -M13 / M11 / 2;
  const rSquared = M14 / M11 +
                   x ** 2 +
                   y ** 2;

  return {x, y, rSquared};
}

// export `Disc` if running inside Node (test suite)
if (this.DedicatedWorkerGlobalScope === undefined) {
  module.exports = Disc;
}