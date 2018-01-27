"use strict";

class Disc {
  constructor({x: x1, y: y1}, {x: x2, y: y2}) {
    this.center = {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
    };
    this.rSquared = (x1 - this.center.x) ** 2 + (y1 - this.center.y) ** 2
  }

  contains({x, y}) {
    return (x - this.center.x) ** 2 + (y - this.center.y) ** 2 <= this.rSquared;
  }

  extend({x, y}) {
    return this;
  }
}