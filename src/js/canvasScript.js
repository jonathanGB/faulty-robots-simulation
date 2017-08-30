"use strict";

paper.install(window);

class CanvasScript {
  constructor() {
    this.canvas = document.getElementById("myCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.path = null;

    paper.setup(this.canvas);
  }

  drawLine() {
    let path = new Path();
    this.path = path;
  	path.strokeColor = 'black';

  	let start = new Point(100, 100);
  	path.moveTo(start);
  	path.lineTo(start.add([ 200, -50 ]));
    
  	view.draw();
  }

  scale() {
    this.path.scale(1.5)
  }
}

let canvasScript = new CanvasScript();
