"use strict";

/**
 * This class handles data and operations related to the UI outside the canvas
 * and serves as a middle-man for the computation of generations (done in `calculator.js`)
 */
class Controller {
  constructor() {
    this.iteration = 0; // current iteration (generation)
    this.states = []; // stores the positions-faultiness of all robots in all generations
    this.range = 100; // range of vision of robots "v"
    this.calculatorListener = new EventEmitter(); // alerts when computations are done (as calculations are done in another thread asynchronously)

    this.currentRobot = document.getElementById("currentRobot");
    this.robotLabel = document.getElementById("robotLabel");
    this.robotVision = document.getElementById("robotVisionContainer");
    this.generateButton = document.getElementById("generate");
    this.commandInput = document.querySelector("#commandContainer textarea");

    // draw the initial canvas for setup
    canvasScript.initialDraw();
    
    // listen to user events (outside canvas), and dispatch them to `handleEvent`
    document.addEventListener("keypress", this); 
    this.robotLabel.addEventListener("click", this);
    this.currentRobot.querySelector("#remove").addEventListener("click", this);
    this.currentRobot.querySelector("#robotX").addEventListener("input", this);
    this.robotVision.querySelectorAll("input").forEach(input => input.addEventListener("input", this));
    this.generateButton.addEventListener("click", this);

    // initialize the calculator worker (thread) & listen to its incoming messages
    this.worker = new Worker("js/calculator.js");
    this.worker.onmessage = ({data: {type, response}}) => {
      if (type == "generate") {
        this.states[response.iter] = response.newState;

        // if we were waiting for this generation, alert them (otherwise will do nothing)
        this.listener.dispatch(`${response.iter}-generated`, response.newState);
      }
    };
  }

  /**
   * Handles user events (but not in the canvas)
   * 
   * @param {Object} param0 Event properties that we care about
   */
  handleEvent({type, target, key}) {
    switch (type) {
      case "keypress": {
        // we don't care about keypresses in inputs or textareas
        if (target.tagName == "TEXTAREA" || target.tagName == "INPUT") {
          return;
        }

        if (key == "Enter" && this.iteration > 0) {
          this.getNextGeneration();
        } else if (key == "z") {
          canvasScript.zoom("in");
        } else if (key == "x") {
          canvasScript.zoom("out");
        } else if (key.startsWith("Arrow")) {
          canvasScript.moveView(key);
        }

        break;
      }
      case "click": {
        if (target == this.robotLabel) {
          canvasScript.toggleFaulty();
          this.robotLabel.classList.toggle("faulty");
        } else if (target == this.generateButton) {
          this.startGenerate();
        } else if (target.classList.contains("label-danger")) {
          // delete robot
          canvasScript.replaceBubbleRobot(null);
          this.hideBubble();
          this.changeGenerateStatus()
        }
        break;
      };
      case "input": {
        let {value} = target;

        // user is writing in the x-coordinate textual input
        if (target.id == "robotX") {
          const localX = Number(value);
          const globalX = localX + canvasScript.origin.position.x;

          // bad input, alert by turning input red
          if (isNaN(localX) || globalX < canvasScript.MIN_X || globalX > canvasScript.MAX_X) {
            target.style.backgroundColor = "red";
            return;
          }

          // good input, update robot position
          target.style.backgroundColor = "";
          canvasScript.updateRobotPosition({
            robot: canvasScript.hasBubble,
            localX,
            globalX,
          });

          return;
        }

        // handle vision's textual and range inputs at the same time
        if (target.parentNode.id == "robotVisionContainer") {
          let range = parseInt(value, 10);

          // bad input, alert user by turning input red
          if (isNaN(range) || range < 1 || range > 575) {
            target.style.backgroundColor = "red";
            return;
          }

          // good input, update values and robots' vision range
          target.style.backgroundColor = "";
          this.range = range;
          this.robotVision.querySelectorAll("input").forEach(input => input.value = value);
          canvasScript.updateRange(range);
        }
      }
    }
  }

  /**
   * Fetch new generation and send it to canvasScript
   */
  async getNextGeneration() {
    const {i, nextGen} = await this.fetchNextGeneration();
    canvasScript.displayNewGeneration(i, nextGen);
  }

  /**
   * When we generate for first time, we need to stop "setup phase"
   */
  async startGenerate() {
    // remove listeners
    console.log("start generate");
    this.currentRobot.querySelector("#remove").remove();
    this.robotLabel.removeEventListener("click", this);
    this.currentRobot.querySelector("#robotX").removeEventListener("input", this);
    this.currentRobot.querySelector("#robotX").readOnly = true;
    this.robotVision.querySelectorAll("input").forEach(input => {
      input.removeEventListener("input", this);
      input.type == "range" ? input.disabled = true : input.readOnly = true;
    });
    this.generateButton.removeEventListener("click", this);
    this.generateButton.disabled = true;
    this.commandInput.readOnly = true;

    canvasScript.removeSetupListeners();
    
    // store robots in increasing x-position; we have our iteration 0
    this.states[0] = [...canvasScript.robots].map(([label, {data: {faulty, localPosition: {x}}}]) => ({
      label,
      faulty,
      x,
    }));
    this.states[0].sort((a, b) => a.x - b.x);

    // generate 10 iterations, and display iteration 1 once we have it
    this.generate(1, 10, this.states[0]);
    const {nextGen} = await this.fetchNextGeneration();
    canvasScript.displayNewGeneration(1, nextGen);
  }

  /**
   * Helper to message `calculator` to compute a certain number of new generations
   * 
   * @param {Integer} iter iteration of the 1st iteration expected 
   * @param {Integer} todo how many generations expected
   * @param {Array{Object}} state current state of robots' positions
   */
  generate(iter, todo, state) {
    this.worker.postMessage({
      type: "generate",
      range: this.range,
      iter,
      todo,
      state,
    });
  }

  /**
   * Try to fetch the next generation; if not cached, wait till we receive an alert from `calculatorListener`
   */
  fetchNextGeneration() {
    return new Promise(resolve => {
      let currState = this.states[++this.iteration];
      const i = this.iteration;

      // if result already cached, return it
      if (currState) {
        resolve({i, nextGen: currState});

        // we are at the end of the batch, generate a new one
        if (i % 10 == 0) {
          this.generate(i + 1, 10, this.states[i]);
        }

        return;
      }

      // current generation is not cached, wait until it has been computed
      this.listener.on(`${this.iteration}-generated`, state => {
        resolve({i, nextGen: state});
        
        // we are at the end of the batch, generate a new one
        if (i % 10 == 0) {
          this.generate(i + 1, 10, this.states[i]);
        }
      }, true);
    });
  }

  /**
   * Setup only!
   * 
   * Change "generateButton" depending on number of robots (must be at least 2)
   */
  changeGenerateStatus() {
    this.generateButton.disabled = canvasScript.robots.size < 2;
  }

  /**
   * Hide robot bubble
   */
  hideBubble() {
    this.currentRobot.classList.add("invisible");
    this.robotLabel.classList.remove("faulty");
  }

  /**
   * Show selected robot's info in the bubble
   * 
   * @param {Object} param0 properties of the robot we want to display
   */
  showBubble({faulty, label: {content}, localPosition: {x}}) {
    this.robotLabel.innerText = content;
    if (faulty) {
      this.robotLabel.classList.add("faulty");
    }
    this.currentRobot.querySelector("#robotX").value = x;
    this.currentRobot.classList.remove("invisible");
  }

  /**
   * Update the robot's bubble info (for now, we only update the x-position)
   * @param {Object} param0:
   *  x is the new x-position of the robot
   */
  updateBubble({x}) {
    this.currentRobot.querySelector("#robotX").value = x;
  }
}

let controller = new Controller();
