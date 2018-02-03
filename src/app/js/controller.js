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

    this.saveButton = document.getElementById("save");
    this.loadButton = document.getElementById("load");
    this.setupsDropdown = document.getElementById("loadDropdown")
    this.lightbox = document.getElementById("lightbox");
    this.currentRobot = document.getElementById("currentRobot");
    this.robotLabel = document.getElementById("robotLabel");
    this.robotVision = document.getElementById("robotVisionContainer");
    this.generateButton = document.getElementById("generate");
    this.commandContainer = document.getElementById("commandContainer");
    this.commandInput = document.querySelector("#commandContainer textarea");
    this.goodCommandIcon = document.querySelector("#commandContainer .good-command");
    this.badCommandIcon = document.querySelector("#commandContainer .bad-command");
    this.commandInputResizeIcon = document.querySelector("#commandContainer .expand");
    this.nextPosition = document.getElementById("nextPosition") || {}; // empty object to bypass problems in 2D

    // initialize the popover
    $(this.saveButton).popover();            

    // draw the initial canvas for setup
    canvasScript.is1d() ?
      canvasScript.initialDraw1d():
      canvasScript.initialDraw2d();

    // populate setups dropdown (1d setups if in 1d, 2d setups if in 2d)
    this.populateSetupsDropdown();
    
    // listen to user events (outside canvas), and dispatch them to `handleEvent`
    document.addEventListener("keypress", this);
    this.saveButton.addEventListener("click", this);
    this.lightbox.addEventListener("click", this);
    this.commandInputResizeIcon.addEventListener("click", this);
    this.commandInput.addEventListener("input", this);
    this.robotLabel.addEventListener("click", this);
    this.currentRobot.querySelector("#remove").addEventListener("click", this);
    this.currentRobot.querySelector("#robotX").addEventListener("input", this);
    this.robotVision.querySelectorAll("input").forEach(input => input.addEventListener("input", this));
    this.generateButton.addEventListener("click", this);

    if (canvasScript.is1d()) {
      // make sure the default set is "2 most visible" for next position calculation
      this.nextPosition.value = "most";
      this.nextPosition.addEventListener("change", this);
    } else { // is2d
      this.currentRobot.querySelector("#robotY").addEventListener("input", this);
    }


    // initialize the calculator worker (thread) & listen to its incoming messages
    this.worker = new Worker(`js/calculator${canvasScript.dimension}.js`);
    this.worker.onmessage = ({data: {type, response}}) => {
      if (type == "generate") {
        this.states[response.iter] = response.newState;

        // if we were waiting for this generation, alert them (otherwise will do nothing)
        this.calculatorListener.dispatch(`${response.iter}-generated`, response.newState);
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
          // toggle faulty state
          canvasScript.toggleFaulty();
          this.robotLabel.classList.toggle("faulty");
          this.robotLabel.style.backgroundColor = this.robotLabel.classList.contains("faulty") ? "red" : "green";
          this.updateCommandInput();
        } else if (target == this.generateButton) {
          this.startGenerate();
        } else if (target.classList.contains("label-danger")) {
          // delete robot
          canvasScript.replaceBubbleRobot(null);
          this.hideBubble();
          this.changeGenerateStatus();
          this.updateCommandInput();
        } else if (target.classList.contains("expand") || target.id == "lightbox") {
          // expand/minimize commandInput
          this.expandCommandInput();
        } else if (target.id == "save") {
          // save current command
          this.askToSaveCommand();
        }

        break;
      };
      case "input": {
        let {value} = target;

        // user is writing in the x or y-coordinate textual input
        if (target.id == "robotX" || target.id == "robotY") {
          const localX = Number(this.currentRobot.querySelector("#robotX").value);
          const globalX = localX + canvasScript.origin.position.x;

          // bad x-input, alert by turning input red
          if (isNaN(localX) || globalX < canvasScript.MIN_X || globalX > canvasScript.MAX_X) {
            target.style.backgroundColor = "red";
            return;
          }

          // if in 2d, validate the y-input
          let localY, globalY;
          if (canvasScript.is2d()) {
            localY = Number(this.currentRobot.querySelector("#robotY").value);
            globalY = canvasScript.origin.position.y - localY;

            if (isNaN(localY) || globalY < canvasScript.MAX_Y || globalY > canvasScript.MIN_Y) {
              target.style.backgroundColor = "red";
              return;
            }
          }

          // good input(s), update robot position
          target.style.backgroundColor = "";
          canvasScript.updateRobotPosition({
            robot: canvasScript.hasBubble,
            localX,
            globalX,
            localY,
            globalY,
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
          this.updateCommandInput();
        }

        if (target.parentNode.id == "commandContainer") {
          this.parseCommandInput(value);
        }
      }
      case "change": {
        // "nextPosition" select changed, update webworker flag & update command input 
        if (target == this.nextPosition) {
          this.worker.postMessage({
            type: "update-nextPosition",
            value: target.value,
          });
          this.updateCommandInput();
        }
      }
    }
  }

  /**
   * Change in UI (faulty toggle, added robot, etc.) requires an update of the command input
   */
  updateCommandInput() {
    const v = this.range;
    const nextPosition = this.nextPosition.value; // will be "undefined" in 2d.. defines behaviour of how next positions are computed
    const robots = [...canvasScript.robots].map(([label, {position: {x}, data: {faulty, localPosition: {y}}}]) => ({
      label,
      faulty,
      x: x - canvasScript.MIN_X,
      y: canvasScript.is2d() ? y : undefined,
    }));
    const command = {v, nextPosition, robots};
    this.commandInput.value = JSON.stringify(command, null, '\t');

    // we know the command is good, no need to `parseCommandValue` it...
    // but we need to make sure it has at least 2 robots for it to be 100% valid
    if (robots.length < 2) {
      this.goodCommandIcon.classList.remove("show");
      this.badCommandIcon.classList.add("show");
      this.saveButton.disabled = true;
    } else {
      this.goodCommandIcon.classList.add("show");
      this.badCommandIcon.classList.remove("show");
      this.saveButton.disabled = false;
    }

  }

  /**
   * Create a new list element in the dropdown of setups saved and append it to the list
   * 
   * @param {String} setupName 
   */
  createSetupDropdownElement(setupName) {
    let li = document.createElement("li");
    let a = document.createElement("a");

    a.innerText = setupName;
    a.href = "javascript:void(0)"; // no action
    a.onclick = this.loadCommand.bind(this);
    li.appendChild(a);

    this.setupsDropdown.appendChild(li);
  }

  /**
   * Go through the saved setups and display them in the setups dropdown
   * Only show elements that are from the right dimension (1d or 2d)
   */
  populateSetupsDropdown() {
    for (let i = 0; i < localStorage.length; i++) {
      const setupName = localStorage.key(i);
      const dim = localStorage.getItem(setupName).startsWith("2d") ? "2d" : "1d";

      // make sure the saved setup is of the same dimension as the current environment
      if (dim == canvasScript.dimension) {
        this.createSetupDropdownElement(setupName);
      }
    }
  }

  /**
   * Simple helper to destroy the button popover
   */
  destroyPopover() {
    $(this.saveButton).popover("destroy");
    this.saveButton.removeAttribute("data-content")
  }

  /**
   * Determines whether to show/hide the popover, and dynamically builds the popover if we show it
   */
  askToSaveCommand() {
    // popover already there, hide it
    if (this.saveButton.hasAttribute("data-content")) {
      this.destroyPopover();
      return;
    }

    // create dynamic popover
    const now = new Date();
    const defaultName = `setup-${localStorage.length} (${now.getDate().toString().padStart(2, "0")}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getFullYear()})`;
    const template = `<form onsubmit="controller.saveCommand(this.elements[0].value); return false;">
                        <div class="form-group">
                          <label for="commandName">Name:</label>
                          <input id="commandName" class="form-control" type="text" value="${defaultName}">
                        </div>
                        <button class="btn btn-primary" type="submit">Save</button> 
                      </form>
                     `
    $(this.saveButton).attr("data-content", template).popover("show")
  }

  /**
   * Make sure the setupName is unique; if so, store the command in localStorage
   * 
   * @param {String} setupName name of the provided setup
   */
  saveCommand(setupName) {
    // make sure the setup name is not already used
    for (let i = 0; i < localStorage.length; i++) {
      if (setupName == localStorage.key(i)) {
        toastr.error("", "setup name already used!");
        return;
      }
    }

    // setup name is good; store the setup and remove the popover
    // notice that the value stored starts with either "1d-" or "2d-" (or nothing in previous version)
    localStorage.setItem(setupName, `${canvasScript.dimension}-${this.commandInput.value}`);
    toastr.success("", "Setup saved!");
    this.destroyPopover();
    this.createSetupDropdownElement(setupName);
  }

  /**
   * Load a command from the dropdown
   * 
   * @param {String} command stored command to load 
   */
  loadCommand({target: {innerText: setupName}}) {
    const command = localStorage.getItem(setupName);
    if (!command) {
      toastr.error("", "setup not found!");
      return;
    }

    // get the command setup (trim the metadata, if any)
    const setup = command.startsWith("1d-") || command.startsWith("2d-") ?
      command.slice(3) : // ignore "1d-" or "2d-"
      command; // previous way, contains the whole command already

    this.commandInput.value = setup;
    const parseError = this.parseCommandInput(setup);
    if (parseError) {
      toastr.error("", "Setup loaded, but bad format!")
    } else {
      toastr.success("", "Setup loaded!");
    }
  }

  /**
   * Handle input from the user in the command textarea
   * If there's an error, we alert the user and do not display the robots
   * Otherwise, show the robots in the canvas
   * 
   * @param {String} value commandInput
   * @returns true if there was an error, nothing otherwise
   */
  parseCommandInput(value) {
    // inner helper to handle when we have a bad command
    const badCommand = (errMsg) => {
      console.log(errMsg);
      this.goodCommandIcon.classList.remove("show");
      this.badCommandIcon.classList.add("show");
      this.generateButton.disabled = true;
      this.saveButton.disabled = true;
      canvasScript.generateCommandRobots([]); // send empty array so no new robots are added
      return true; 
    };
    this.hideBubble();
    
    // command can't be empty
    if (value.length == 0) {
      return badCommand("len == 0")
    }

    try {
      // v (vision) and command (list of robots)
      const {v, robots: command, nextPosition = this.nextPosition.value} = JSON.parse(value);

      // command must have a property v (vision)
      if (!v || !Number.isInteger(v) || v < 1 || v > 575) {
        return badCommand("parameter v is absent or is not an integer between 1 and 575");
      }

      // nextPosition must be either "all" or "most" (if in 1d)
      if (canvasScript.is1d() && nextPosition != "all" && nextPosition != "most") {
        return badCommand("parameter nextPosition, if given, must be either 'all' or 'most'");
      }

      // command must be an array with at least 2 robots
      if (!Array.isArray(command) || command.length < 2) {
        return badCommand("not an arr or not enough elems");
      }
      
      // store all labels to make sure they're unique
      let labels = new Set();
      for (let {label, x, y, faulty} of command) {
        // label: String .. must be unique
        // x: Number between 0 and MAX_X - MIN_X
        // y: if 2D... Number between 0 and MIN_Y - MAX_Y
        // faulty: Boolean
        if (!label || typeof label != "string" || labels.has(label) ||
            x == undefined || typeof x != "number" || x < 0 || x > (canvasScript.MAX_X - canvasScript.MIN_X) ||
            (canvasScript.is2d() && (y == undefined || typeof y != "number" || y < 0 || y > (canvasScript.MIN_Y - canvasScript.MAX_Y))) ||
            faulty == undefined || typeof faulty != "boolean") {
          return badCommand("bad robot format");              
        } else {
          labels.add(label); // remember label
        }
      }

      // command is good
      this.goodCommandIcon.classList.add("show");
      this.badCommandIcon.classList.remove("show");
      this.generateButton.disabled = false;
      this.saveButton.disabled = false;

      // update nextPosition calculation
      if (this.nextPosition.value != nextPosition) {
        this.worker.postMessage({
          type: "update-nextPosition",
          value: nextPosition,
        });
        this.nextPosition.value = nextPosition;
      }

      // update vision range & display the robots!
      this.range = v;
      this.robotVision.querySelectorAll("input").forEach(input => input.value = v);      
      canvasScript.generateCommandRobots(command);
    } catch(e) {
      return badCommand("not json");
    }
  }

  /**
   * Expand or minimize the textarea (from or to a lightbox)
   */
  expandCommandInput() {
    this.commandContainer.classList.toggle("show");
    this.commandInputResizeIcon.classList.toggle("glyphicon-resize-full");
    this.commandInputResizeIcon.classList.toggle("glyphicon-resize-small");
    this.lightbox.classList.toggle("show");  
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
    if (canvasScript.is2d()) {
      this.currentRobot.querySelector("#robotY").removeEventListener("input", this);
      this.currentRobot.querySelector("#robotY").readOnly = true;
    } else { // is1d
      // nextPosition doesn't exist in 2d
      this.nextPosition.removeEventListener("change", this);
      this.nextPosition.disabled = true;
    }
    this.robotVision.querySelectorAll("input").forEach(input => {
      input.removeEventListener("input", this);
      input.type == "range" ? input.disabled = true : input.readOnly = true;
    });

    this.generateButton.removeEventListener("click", this);
    this.generateButton.disabled = true;
    this.commandInput.readOnly = true;

    canvasScript.removeSetupListeners();
    
    // store robots in increasing x-position; we have our iteration 0
    this.states[0] = [...canvasScript.robots].map(([label, {data: {faulty, localPosition: {x, y}}}]) => ({
      label,
      faulty,
      x,
      y,
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
    // helper to resolve the promise and start a new batch of generations to compute if need be
    const resolveGeneration = (resolve, i, currState) => {
      resolve({i, nextGen: currState});

      // we are at the end of the batch, generate a new one
      if (i % 10 == 0) {
        this.generate(i + 1, 10, this.states[i]);
      }
    };

    return new Promise(resolve => {
      let currState = this.states[++this.iteration];
      const i = this.iteration;

      // if result already cached, return it
      if (currState) {
        resolveGeneration(resolve, i, currState);

        return;
      }

      // current generation is not cached, wait until it has been computed
      this.calculatorListener.on(`${this.iteration}-generated`, state => {
        resolveGeneration(resolve, i, state);
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
  showBubble({colour, faulty, label: {content}, localPosition: {x, y}}) {
    this.robotLabel.innerText = content;
    if (faulty) {
      this.robotLabel.classList.add("faulty");
    }
    this.robotLabel.style.backgroundColor = colour;
    this.currentRobot.querySelector("#robotX").value = x;
    this.currentRobot.classList.remove("invisible");
    
    if (canvasScript.is2d()) {
      this.currentRobot.querySelector("#robotY").value = y;
    }
  }

  /**
   * Update the robot's bubble info (for now, we only update the x-position)
   * 
   * @param {Object} param0:
   *  x is the new local-x of the robot
   *  y is the new local-y of the robot (if in 2d)
   */
  updateBubble({x, y}) {
    this.currentRobot.querySelector("#robotX").value = x;
    if (canvasScript.is2d()) {
      this.currentRobot.querySelector("#robotY").value = y;
    }
  }
}

let controller = new Controller();
toastr.options = {
  "closeButton": false,
  "debug": false,
  "newestOnTop": false,
  "progressBar": false,
  "positionClass": "toast-top-right",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "3000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
}
