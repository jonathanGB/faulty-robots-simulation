"use strict";

paper.install(window);

/**
 * This class handles data and operations related to the paper-canvas
 */
class CanvasScript {
  constructor() {
    this.canvas = document.getElementById("myCanvas");
    this.MIN_X = 50; // absolute x-coordinate of the beginning of the axis
    this.MAX_X = 1200; // absolute x-coordinate of the end of the axis
    this.axis = null; // reference to the axis object of the 0th generation
    this.axisHitBox = null; // reference to the axis-hitbox object of the 0th generation
    this.separator = null; // reference to the axis-hitbox object of the 0th generation
    this.iterationText = null; // reference to the iterationText object of the 0th generation
    this.hasBubble = null; // reference to the robot displayed in the bubble
    this.robots = new Map(); // map label -> robot object
    this.origin = null; // reference to the origin object of the 0th generation

    paper.setup(this.canvas);
  }

  /**
   * Move the view in the direction provided
   * 
   * @param {String} direction in which direction we want to move the view 
   */
  moveView(direction) {
    let deltaX = 0;
    let deltaY = 0;

    switch(direction) {
      case "ArrowUp": {
        deltaY = 50;
        break;
      }
      case "ArrowDown": {
        deltaY = -50;
        break;
      }
      case "ArrowLeft": {
        deltaX = 50;
        break;
      }
      case "ArrowRight": {
        deltaX = -50;
        break;
      }
    }

    view.translate(deltaX, deltaY);
  }

  /**
   * Zoom the view in the direction provided
   * 
   * @param {String} direction "in" or "out"
   */
  zoom(direction) {
    if (direction == "in") {
      view.zoom += 0.25;
    } else {
      view.zoom = Math.max(0.25, view.zoom - 0.25); // zoom out, unless it would overflow
    }
  }

  /**
   * If we create a new generation and it would be underneath the current view, recenter the view
   * so it becomes visible
   * 
   * @param {Number} bottomY bottom of the new generation
   */
  recenterView(bottomY) {
    if (bottomY > view.bounds.y + view.bounds.height) {
      view.center = new Point(view.center.x, bottomY - (view.bounds.height / 2));
    }
  }

  /**
   * New generation requested, display it
   * 
   * @param {Integer} iteration number of the new generation 
   * @param {Array{Object}} newGen new robots to add to the canvas 
   */
  displayNewGeneration(iteration, newGen) {
    console.log(newGen)

    const iterationText = iteration.toString().padStart(3, "0");
    const deltaY = iteration * 100; // delta in height when we translate the initial objects
    this.axis.clone().translate(0, deltaY);
    const separator = this.separator.clone();
    separator.translate(0, deltaY);
    this.iterationText.clone().translate(0, deltaY).set({content: iterationText});
    this.origin.clone().translate(0, deltaY);

    this.recenterView(separator.position.y);

    // display all robots of the new generation
    for (const {label, faulty, x} of newGen) {
      // get canvas-related info and clone objects
      const initialRobot = this.robots.get(label);
      const robot = initialRobot.clone();
      const robotLabel = initialRobot.data.label.clone();
      const robotRange = initialRobot.data.range.clone();
      const robotLocalPosition = {...initialRobot.data.localPosition};
      const absoluteX = x + this.origin.position.x; // absolute x-position of the new robot
      const deltaX = absoluteX - robot.position.x; // delta in x of the new robot to its x-position in the previous generation (to translate)
      
      // assign data to the new robot
      robot.data.label = robotLabel;
      robot.data.range = robotRange;
      robot.data.localPosition = robotLocalPosition;
      robot.translate(deltaX, deltaY);
      robotLabel.translate(deltaX, deltaY);
      robotRange.translate(deltaX, deltaY);
      robotLocalPosition.x = x;
      robotLabel.set({content: label});
      robotRange.opacity = 0;      

      // assign double-click event handler to the robot
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

  /**
   * We want to remove the listeners related to setup once the setup is finished
   */
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

  /**
   * Setup only!
   * Possibly change the origin (leftmost faulty); if so, change the local positions of robots (relative)
   */
  updateOrigin() {
    console.log("update origin")
    const currOriginX = this.origin.position.x;

    // find new origin-x
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

    // if the origin should be changed, change it and update relative positions of robots
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

  /**
   * Setup only!
   * The range has been changed, update the vision segments of the robots
   * 
   * @param {Number} range new vision v for all robots
   */
  updateRange(range) {
    for (let [, robot] of this.robots) {
      const {x} = robot.position;

      robot.data.range.removeSegments();
      robot.data.range.addSegments([
        new Point(x - range, 50),
        new Point(x + range, 50),
      ]);
    }
  }

  /**
   * Setup only!
   * 
   * Used when deleting a robot (null), or to toggle faulty (Robot)
   * @param {Robot|null} replacement 
   */
  replaceBubbleRobot(replacement) {
    replacement ?
      this.robots.set(replacement.data.label.content, replacement) :            
      this.robots.delete(this.hasBubble.data.label.content);

    // delete previous bubble data 
    this.hasBubble.data.label.remove();
    this.hasBubble.data.range.remove();
    this.hasBubble.remove();

    // update bubble
    this.hasBubble = replacement
    this.updateOrigin();
  }

  /**
   * Setup only!
   * 
   * @param {Object} param0:
   *  robot is the robot object that we want to update
   *  localX is the local-x of the robot
   *  globalX is the absolute-x of the robot
   */
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

  /**
   * Setup only!
   * Called by `controller` when user toggles the faulty state in the bubble
   * We need to replace the robot (because the shape changes)
   */
  toggleFaulty() {
    let {data: {faulty, label: {content: label}}, position: {x}} = this.hasBubble;
    let newRobotData = {
      faulty: !faulty,
      label,
      x,
    };

    let newRobot = this.generateRobot(newRobotData, true);
    this.replaceBubbleRobot(newRobot);
  }

  /**
   * New command inbound: we must delete previous robots in setup and display the new ones
   * @param {Array{Object}} command robots to generate 
   */
  generateCommandRobots(command) {
    // cleanup previous robots
    this.robots.forEach(robot => {
      // delete previous bubble data 
      robot.data.label.remove();
      robot.data.range.remove();
      robot.remove();
    });
    this.robots.clear();
    this.updateOrigin();

    // insert the new robots in the canvas
    command.forEach(({x, faulty, label}) => this.generateRobot({
      x: x + this.MIN_X, // shift to respect absolute-x
      faulty,
      label,
    }));
  }

  /**
   * Setup only!
   * Creates a new robot (or a replacement) and returns it
   * 
   * @param {Object} param0:
   *  faulty is if the robot to create is faulty
   *  label is the label of the robot to create
   *  x is the x-coordinate of the robot to create
   * @param {Bool} isReplacement behaviour of generate varies slightly if it's a new robot or one we replace
   */
  generateRobot({faulty, label, x}, isReplacement=false) {
    let center = new Point(x, 50); // 50 is the y-coordinate of the axis during setup
    let radius = 15;
    let robot = faulty ? // faulty robot are squares; non-faulty are circles
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
    
    // assign listeners to robot during setup (some of them are removed once setup is complete)
    robot.on({
      mousedrag: ({target, point: {x}}) => {
        this.canvas.style.cursor = "move";

        // don't exit the axis limits
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
        // bring to front so dragging it over other robots doesn't break
        target.bringToFront();
        target.data.label.bringToFront();
      },
      mouseup: () => {
        // otherwise, the origin could be a few pixels off if we dragged the robot-origin
        this.updateOrigin();
      },
      doubleclick: ({target}) => {
        // if new target we want to display its bubble; otherwise, we hide the bubble (toggle)
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

    // don't update map or origin if it's only a replacement robot (toggle)
    // if it' a replacement, it's already handled by `replaceBubbleRobot`
    if (!isReplacement) {
      this.robots.set(label, robot);          
      this.updateOrigin();
    }

    // create label for robot
    let labelText = new PointText(center.add(0, 3));
    labelText.justification = 'center';
    labelText.fillColor = 'white';
    labelText.fontSize = 10;
    labelText.content = label;
    robot.data.label = labelText;
    
    // if label receives an event, dispatch it to its related robot
    labelText.on({
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

    // create the range of the vision (rectangle centered on the robot)
    let range = new Path.Line(new Point(x - controller.range, 50), new Point(x + controller.range, 50));
    range.sendToBack();
    range.strokeColor = '#F0AD4E';
    range.strokeWidth = 35;
    range.opacity = 0;
    robot.data.range = range;

    return robot;
  }

  /**
   * Before setup (once)!
   * 
   * Draw the initial canvas (axis, axisHitbox, iterationText, origin, generation separator)
   * These objects created are stored, to be reused for the next generations 
   * (which simply clone them, then translate them)
   */
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

    // draw separator
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
