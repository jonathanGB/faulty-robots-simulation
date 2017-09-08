"use strict";

class Controller {
  constructor() {
    this.iteration = 0;
    this.states = [];
    this.currentRobot = document.getElementById("currentRobot");
    this.robotLabel = document.getElementById("robotLabel");

    canvasScript.initialDraw();

    this.robotLabel.addEventListener("click", this);
    this.currentRobot.querySelector(".label-danger").addEventListener("click", this);
    this.currentRobot.querySelector("#robotX").addEventListener("input", this);

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
        } else if (target.classList.contains("label-danger")) {
          canvasScript.replaceBubbleRobot(null);
          this.hideBubble();
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
          value = Number(value);
          if (isNaN(value) || value < 0 || value > canvasScript.MAX_X - canvasScript.MIN_X) {
            target.style.backgroundColor = "red";
            return;
          }

          target.style.backgroundColor = "";
          canvasScript.updateRobotPosition({
            robot: canvasScript.hasBubble,
            x: value,
          });
        }
      }
    }
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
