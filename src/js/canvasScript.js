"use strict";

paper.install(window);

class CanvasScript {
  constructor() {
    this.canvas = document.getElementById("myCanvas");
    this.MIN_X = 50;
    this.MAX_X = 1200;
    this.axis = null;
    this.axisHitBox = null;
    this.separator = null;
    this.iterationText = null;
    this.hasBubble = null;
    this.robots = new Map();
    this.origin = null;

    paper.setup(this.canvas);
  }


  displayNewGeneration(iteration, newGen) {
    console.log(newGen)

    const iterationText = iteration.toString().padStart(3, "0");
    const deltaY = iteration * 100;
    this.axis.clone().translate(0, deltaY);
    this.separator.clone().translate(0, deltaY);
    this.iterationText.clone().translate(0, deltaY).set({content: iterationText});
    this.origin.clone().translate(0, deltaY);

    for (const {label, faulty, x} of newGen) {
      const initialRobot = this.robots.get(label);
      const robot = initialRobot.clone();
      const robotLabel = initialRobot.data.label.clone();
      const robotRange = initialRobot.data.range.clone();
      const robotLocalPosition = {...initialRobot.data.localPosition};
      const absoluteX = x + this.origin.position.x;
      const deltaX = absoluteX - robot.position.x;
      
      robot.data.label = robotLabel;
      robot.data.range = robotRange;
      robot.data.localPosition = robotLocalPosition;
      robot.translate(deltaX, deltaY);
      robotLabel.translate(deltaX, deltaY);
      robotRange.translate(deltaX, deltaY);
      robotLocalPosition.x = x;
      robotLabel.set({content: label});
      robotRange.opacity = 0;      

      robot.on({
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
      robotLabel.on({
        doubleclick: e => {
          e.target = robot;
          robot.emit("doubleclick", e)
        },
      });
    }
  }

  removeSetupListeners() {
    this.axisHitBox.remove();
    this.axisHitBox = null;
    this.canvas.style.cursor = "default";

    for (let [,robot] of this.robots) {
      robot._callbacks = {
        doubleclick: robot._callbacks.doubleclick,
      };
      robot.data.label._callbacks = {
        doubleclick: robot.data.label._callbacks.doubleclick,
      };
    }
  }

  updateOrigin() {
    const currOriginX = this.origin.position.x;

    const {originX: newOriginX} = [...this.robots].reduce((acc, [,{position: {x}, data: {faulty}}]) => {
      // first faulty found, make origin the position of that faulty robot for now
      if (faulty && acc.default) {
        return {
          originX: x,
          default: false,
        };
      }

      if (faulty && x < acc.originX) {
        acc.originX = x;
        return acc;
      }

      return acc;
    }, {originX: 50, default: true});

    if (currOriginX != newOriginX) {
      this.origin.position.x = newOriginX;

      for (let [, robot] of this.robots) {
        let localX = robot.position.x - newOriginX;

        robot.data.localPosition.x = localX;

        if (robot == this.hasBubble) {
          controller.updateBubble({x: localX});
        }
      }
    }
  }

  updateRange(range) {
    controller.range = range;

    for (let [, robot] of this.robots) {
      const {x} = robot.position;

      robot.data.range.removeSegments();
      robot.data.range.addSegments([
        new Point(x - range, 50),
        new Point(x + range, 50),
      ]);
    }
  }

  replaceBubbleRobot(replacement) {
    this.robots.delete(this.hasBubble.data.label._content);
    this.hasBubble.data.label.remove();
    this.hasBubble.data.range.remove();
    this.hasBubble.remove();
    this.hasBubble = replacement;

    if (!replacement) {
      this.updateOrigin();
    }
  }

  updateRobotPosition({robot, localX, globalX}) {
    robot.data.localPosition.x = localX;
    robot.position.x = globalX;
    robot.data.label.position.x = globalX;
    robot.data.range.removeSegments();
    robot.data.range.addSegments([
      new Point(globalX - controller.range, 50),
      new Point(globalX + controller.range, 50),
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
    this.updateOrigin();
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
      x: x - this.origin.position.x,
    };
    robot.strokeColor = "black";
    robot.on({
      mousedrag: ({target, point: {x}}) => {
        this.canvas.style.cursor = "move";

        if (x < this.MIN_X || x > this.MAX_X) {
          return;
        }

        this.updateOrigin();

        let localX = x - this.origin.position.x;
        this.updateRobotPosition({robot, localX, globalX: x});

        if (this.hasBubble == robot) {
          controller.updateBubble({x: localX})
        }
      },
      mouseenter: () => {
        this.canvas.style.cursor = "move";
      },
      mousedown: ({target}) => {
        target.bringToFront();
        target.data.label.bringToFront();
      },
      mouseup: () => {
        this.updateOrigin();
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
    this.robots.set(label, robot);
    this.updateOrigin();

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
      },
      mousedown: e => {
        e.target = robot;
        robot.emit("mousedown", e);
      },
      mouseup: () => {
        robot.emit("mouseup");
      }
    });

    let range = new Path.Line(new Point(x - controller.range, 50), new Point(x + controller.range, 50));
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
    axisHitBox.fillColor = "white";
    axisHitBox.opacity = 0;
    axisHitBox.on({
      click: ({event: {shiftKey: faulty}, point: {x}}) => {
        let newRobotData = {
          faulty,
          label: robotNumber.toString().padStart(2, "0"),
          x,
        };

        this.generateRobot(newRobotData);
        controller.changeGenerateStatus();
        robotNumber++;
      },
      mousemove: () => {
        this.canvas.style.cursor = "pointer";
      },
      mouseleave: () => {
        this.canvas.style.cursor = "default";
      }
    });
    this.axisHitBox = axisHitBox;

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

    // draw origin mark
    let origin = new Path();
    origin.strokeColor = "black";
    origin.strokeWidth = 2;
    origin.add(new Point(this.MIN_X, 20));
    origin.add(new Point(this.MIN_X, 80));
    this.origin = origin;
  }
}

let canvasScript = new CanvasScript();
