"use strict";

paper.install(window);

class CanvasScript {
  constructor() {
    this.canvas = document.getElementById("myCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.axis = null;
    this.separator = null;
    this.iterationText = null;

    paper.setup(this.canvas);
  }

  initialDraw() {
    // draw axis, and store for further use (cloning)
    let axis = new Path();
    axis.strokeColor = 'black';
    axis.strokeWidth = 3;
    axis.strokeJoin = "bevel"
    axis.add(new Point(50, 50));
    axis.add(new Point(1200, 50));
    axis.add(new Point(1175, 30));
    axis.add(new Point(1200, 50));
    axis.add(new Point(1175, 70));
    this.axis = axis;

    // draw iteration number
    let iterationText = new PointText(new Point(7, 55));
    iterationText.justification = 'left';
    iterationText.fillColor = 'red';
    iterationText.fontSize = 20;
    iterationText.content = '000';
    this.iterationText = iterationText;

    // draw separator, and store for further use (cloning)
    let separator = new Path();
    separator.strokeColor = "#777";
    separator.add(new Point(0, 100));
    separator.add(new Point(1204, 100));
    this.separator = separator;
  }
}

let canvasScript = new CanvasScript();
