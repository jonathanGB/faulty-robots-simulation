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

    let robotNumber = 1;
    let axisHitBox = new Path.Rectangle(new Rectangle(50, 40, 1150, 30));
    axisHitBox.fillColor = "white"
    axisHitBox.opacity = 0
    axisHitBox.on({
      click: ({event: {shiftKey}, point: {x}}) => {
        let center = new Point(x, 50);
        let radius = 15;
        let robot = shiftKey ?
          new Path.RegularPolygon(center, 3, radius + 5) :
          new Path.Circle(center, radius);
        robot.fillColor = shiftKey ?
          "red" :
          "green";
        robot.strokeColor = "black";
        robot.on({
          mousedrag: ({target, point: {x}}) => {
            target.position.x = x;
            target.data.label.position.x = x;
            this.canvas.style.cursor = "move";
          },
          mouseenter: () => {
            this.canvas.style.cursor = "move";
          },
          click: ({event: {ctrlKey}}) => {
            if (!ctrlKey) {
              return;
            }
            this.hasBubble = !this.hasBubble;
            let {hasBubble} = this;
          }
        });

        let iterationText = new PointText(center.add(0, 3));
        iterationText.justification = 'center';
        iterationText.fillColor = 'white';
        iterationText.fontSize = 10;
        iterationText.content = robotNumber.toString().padStart(2, "0");
        robot.data.label = iterationText;
        iterationText.on({
          mousedrag: e => {
            e.target = robot;
            robot.emit("mousedrag", e)
          },
          click: e => {
            robot.emit("click", e)
          }
        })
        robotNumber++;


      },
      mousemove: () => {
        this.canvas.style.cursor = "pointer";
      },
      mouseleave: () => {
        this.canvas.style.cursor = "default";
      }
    })

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
