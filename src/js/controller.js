"use strict";

class Controller {
  constructor() {
    this.iteration = 0;
    this.states = [];
    this.range = 100;
    this.listener = new EventEmitter();

    this.currentRobot = document.getElementById("currentRobot");
    this.robotLabel = document.getElementById("robotLabel");
    this.robotVision = document.getElementById("robotVisionContainer");
    this.generateButton = document.getElementById("generate");
    this.commandInput = document.querySelector("#commandContainer textarea");

    canvasScript.initialDraw();

    this.robotLabel.addEventListener("click", this);
    this.currentRobot.querySelector("#remove").addEventListener("click", this);
    this.currentRobot.querySelector("#robotX").addEventListener("input", this);
    this.robotVision.querySelectorAll("input").forEach(input => input.addEventListener("input", this));
    this.generateButton.addEventListener("click", this);

    this.worker = new Worker("js/calculator.js");
    this.worker.onmessage = ({data: {type, response}}) => {
      if (type == "generate") {
        this.states[response.iter] = response.newState;

        this.listener.dispatch(`${response.iter}-generated`, response.newState);
      }
    };
  }

  handleEvent({type, target, key}) {
    switch (type) {
      case "keypress": {
        if (key == "Enter") {
          this.getNextGeneration();
        }
      }
      case "click": {
        if (target == this.robotLabel) {
          canvasScript.toggleFaulty();
          this.robotLabel.classList.toggle("faulty");
        } else if (target == this.generateButton) {
          document.addEventListener("keypress", this);
          this.startGenerate();
        } else if (target.classList.contains("label-danger")) {
          canvasScript.replaceBubbleRobot(null);
          this.hideBubble();
          this.changeGenerateStatus()
        }
        break;
      };
      case "dblclick": {
        canvasScript.scale();
        break;
      }
      case "input": {
        let {value} = target;
        if (target.id == "robotX") {
          const localX = Number(value);
          const globalX = localX + canvasScript.origin.position.x;

          if (isNaN(localX) || globalX < canvasScript.MIN_X || globalX > canvasScript.MAX_X) {
            target.style.backgroundColor = "red";
            return;
          }

          target.style.backgroundColor = "";
          canvasScript.updateRobotPosition({
            robot: canvasScript.hasBubble,
            localX,
            globalX,
          });

          return;
        }

        if (target.parentNode.id == "robotVisionContainer") {
          let range = parseInt(value, 10);

          if (isNaN(range) || range < 1 || range > 575) {
            target.style.backgroundColor = "red";
            return;
          }

          target.style.backgroundColor = "";
          this.range = range;
          this.robotVision.querySelectorAll("input").forEach(input => input.value = value);
          canvasScript.updateRange(range);
        }
      }
    }
  }

  async getNextGeneration() {
    const {i, nextGen} = await this.fetchNextGeneration();
    canvasScript.displayNewGeneration(i, nextGen);
  }

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
    
    this.states[0] = [...canvasScript.robots].map(([label, {data: {faulty, localPosition: {x}}}]) => ({
      label,
      faulty,
      x,
    }));
    this.states[0].sort((a, b) => a.x - b.x);

    this.generate(1, 10, this.states[0]);
    const {nextGen} = await this.fetchNextGeneration();
    canvasScript.displayNewGeneration(1, nextGen);
  }

  generate(iter, todo, state) {
    this.worker.postMessage({
      type: "generate",
      range: this.range,
      iter,
      todo,
      state,
    });
  }

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
        if (i % 10 == 0) {
          this.generate(i + 1, 10, this.states[i]);
        }
      }, true);
    });
  }

  changeGenerateStatus() {
    this.generateButton.disabled = canvasScript.robots.size < 2;
  }

  hideBubble() {
    this.currentRobot.classList.add("invisible");
    this.robotLabel.classList.remove("faulty");
  }

  showBubble({faulty, label: {content}, localPosition: {x}}) {
    this.robotLabel.innerText = content;
    if (faulty) {
      this.robotLabel.classList.add("faulty");
    }
    this.currentRobot.querySelector("#robotX").value = x;
    this.currentRobot.classList.remove("invisible");
  }

  updateBubble({x}) {
    this.currentRobot.querySelector("#robotX").value = x;
  }
}

let controller = new Controller();
