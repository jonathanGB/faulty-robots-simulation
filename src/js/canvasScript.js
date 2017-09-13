"use strict";

paper.install(window);

class CanvasScript {
  constructor() {
    this.canvas = document.getElementById("myCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.MIN_X = 50;
    this.MAX_X = 1200;
    this.axis = null;
    this.separator = null;
    this.iterationText = null;
    this.hasBubble = null;
    this.range = 100;
    this.robots = new Set();

    paper.setup(this.canvas);
  }

  updateRange(range) {
    this.range = range;

    for (let robot of this.robots) {
      let {x} = robot.position;

      robot.data.range.removeSegments();
      robot.data.range.addSegments([
        new Point(x - this.range, 50),
        new Point(x + this.range, 50),
      ]);
    }
  }

  replaceBubbleRobot(replacement) {
    this.hasBubble.data.label.remove();
    this.hasBubble.data.range.remove();
    this.hasBubble.remove();
    this.robots.delete(this.hasBubble);
    this.hasBubble = replacement;
  }

  updateRobotPosition({robot, x}) {
    let globalX = x + this.MIN_X;

    robot.data.localPosition.x = x;
    robot.position.x = globalX;
    robot.data.label.position.x = globalX;
    robot.data.range.removeSegments();
    robot.data.range.addSegments([
      new Point(globalX - this.range, 50),
      new Point(globalX + this.range, 50),
    ]);

  }

  toggleFaulty() {
    let {data: {faulty, label: {content: label}}, position: {x}} = this.hasBubble;
    let newRobotData = {
      faulty: !faulty,
      label,
      x,
    };

    let newRobot = this.generateRobot(newRobotData);
    this.replaceBubbleRobot(newRobot);
  }

  generateRobot({faulty, label, x}) {
    let center = new Point(x, 50);
    let radius = 15;
    let robot = faulty ?
      new Path.RegularPolygon(center, 4, radius + 5) :
      new Path.Circle(center, radius);
    robot.fillColor = faulty ?
      "red" :
      "green";
    robot.data.faulty = faulty;
    robot.data.localPosition = {
      x: x - this.MIN_X,
    };
    robot.strokeColor = "black";
    robot.on({
      mousedrag: ({target, point: {x}}) => {
        this.canvas.style.cursor = "move";

        if (x < this.MIN_X || x > this.MAX_X) {
          return;
        }

        let localX = x - this.MIN_X;
        this.updateRobotPosition({robot, x: localX});

        if (this.hasBubble == robot) {
          controller.updateBubble({x: localX})
        }
      },
      mouseenter: () => {
        this.canvas.style.cursor = "move";
      },
      doubleclick: ({target}) => {
        if (this.hasBubble) {
          controller.hideBubble();
          this.hasBubble.data.range.opacity = 0;

          if (this.hasBubble == target) {
            this.hasBubble = null;
            return;
          }
        }

        controller.showBubble(target.data);
        this.hasBubble = target;
        this.hasBubble.data.range.opacity = 1;
      }
    });
    this.robots.add(robot);

    let iterationText = new PointText(center.add(0, 3));
    iterationText.justification = 'center';
    iterationText.fillColor = 'white';
    iterationText.fontSize = 10;
    iterationText.content = label;
    robot.data.label = iterationText;
    iterationText.on({
      mousedrag: e => {
        e.target = robot;
        robot.emit("mousedrag", e)
      },
      doubleclick: e => {
        e.target = robot;
        robot.emit("doubleclick", e)
      }
    });

    let range = new Path.Line(new Point(x - this.range, 50), new Point(x + this.range, 50));
    range.sendToBack();
    range.strokeColor = '#F0AD4E';
    range.strokeWidth = 35;
    range.opacity = 0;
    robot.data.range = range;

    return robot;
  }

  initialDraw() {
    // draw axis, and store for further use (cloning)
    let axis = new Path();
    axis.strokeColor = 'black';
    axis.strokeWidth = 3;
    axis.strokeJoin = "bevel"
    axis.add(new Point(50, 50));
    axis.add(new Point(1200, 50));
    this.axis = axis;

    let robotNumber = 1;
    let axisHitBox = new Path.Rectangle(new Rectangle(50, 40, 1150, 30));
    axisHitBox.fillColor = "white"
    axisHitBox.opacity = 0
    axisHitBox.on({
      click: ({event: {shiftKey: faulty}, point: {x}}) => {
        let newRobotData = {
          faulty,
          label: robotNumber.toString().padStart(2, "0"),
          x,
        };

        this.generateRobot(newRobotData);
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
