"use strict";

class Controller {
  constructor() {
    this.iteration = 0;
    this.states = [];
    this.currentRobot = document.getElementById("currentRobot");
    this.robotLabel = document.getElementById("robotLabel");
    this.robotVision = document.getElementById("robotVisionContainer");
    this.generate = document.getElementById("generate");
    this.commandInput = document.querySelector("#commandContainer textarea");

    canvasScript.initialDraw();

    this.robotLabel.addEventListener("click", this);
    this.currentRobot.querySelector("#remove").addEventListener("click", this);
    this.currentRobot.querySelector("#robotX").addEventListener("input", this);
    this.robotVision.querySelectorAll("input").forEach(input => input.addEventListener("input", this));
    this.generate.addEventListener("click", this);

    //document.addEventListener("click", this, {once: true});
    //document.addEventListener("dblclick", this, {once: true});
    // this.worker = new Worker("js/calculator.js")
    // this.worker.postMessage("wazza")
    // this.worker.onmessage = ({data}) => {
    //   this.handleEvent({type: "worker", data});
    // }
  }

  handleEvent({type, target}) {
    switch (type) {
      case "click": {
        if (target == this.robotLabel) {
          canvasScript.toggleFaulty();
          this.robotLabel.classList.toggle("faulty");
        } else if (target == this.generate) {
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
      case "worker": {
        console.log(e.data)
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
          canvasScript.range = range;
          this.robotVision.querySelectorAll("input").forEach(input => input.value = value);
          canvasScript.updateRange(range);
        }
      }
    }
  }

  startGenerate() {
    // remove listeners
    console.log("start generate");
    this.currentRobot.querySelector("#remove").remove();
    this.robotLabel.removeEventListener("click", this);
    this.currentRobot.querySelector("#robotX").removeEventListener("input", this);
    this.currentRobot.querySelector("#robotX").readOnly = true;
    this.robotVision.querySelectorAll("input").forEach(input => {
      input.removeEventListener("input", this)
      input.type == "range" ? input.disabled = true : input.readOnly = true;
    });
    this.generate.removeEventListener("click", this);
    this.generate.disabled = true;
    this.commandInput.readOnly = true;

    canvasScript.removeSetupListeners();
  }

  changeGenerateStatus() {
    this.generate.disabled = canvasScript.robots.size < 2;
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
