"use strict";

/**
 * This class defines behaviour related to 2D vectors properties (like norms, products, and resizing)
 * 
 */
class Vector {
  /**
   * Vector going from `p1` to `p2`
   * 
   * @param {Array} param0 tuple of 2 Points
   */
  constructor([p1, p2]) {
    this.start = p1;
    this.end = p2;
    this.deltaX = p2.x - p1.x;
    this.deltaY = p2.y - p1.y;
    this.norm = Math.sqrt(this.deltaX ** 2 + this.deltaY ** 2);
  }

  /**
   * Returns the scalar product of 2 vectors with components `x` and `y`
   * 
   * @param {Vector} otherVec 
   */
  scalarProduct(otherVec) {
    return this.deltaX * otherVec.deltaX + this.deltaY * otherVec.deltaY
  }

  /**
   * Returns the cosθ and sinθ of two vectors
   * 
   * @param {Vector} otherVec 
   */
  getCosAndSin(otherVec) {
    const cosθj = this.scalarProduct(otherVec) / (this.norm * otherVec.norm);
    const sinθj = Math.sqrt(1 - cosθj ** 2) || 0; // OR 0 if sqrt returns NaN (approximation error)

    return {cosθj, sinθj};
  }

  /**
   * Resizes a Vector of norm "x" to a norm of "newNorm" (keeping the same orientation)
   *
   * @param {Number} newNorm 
   */
  resize(newNorm) {
    if (this.norm == newNorm) {
      return new Vector([this.start, this.end]);
    }

    const newDeltaX = this.deltaX * newNorm / this.norm;
    const newDeltaY = this.deltaY * newNorm / this.norm;
    const newEnd = {
      x: this.start.x + newDeltaX,
      y: this.start.y + newDeltaY,
    };

    return new Vector([this.start, newEnd]);
  }
}

// export `Vector` if running inside Node (test suite)
if (this.DedicatedWorkerGlobalScope === undefined) {
  module.exports = Vector;
}