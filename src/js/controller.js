"use strict";

class Controller {
  constructor() {
    this.iteration = 0;
    this.states = [];

    canvasScript.initialDraw();

    //document.addEventListener("click", this, {once: true});
    //document.addEventListener("dblclick", this, {once: true});
    // this.worker = new Worker("js/calculator.js")
    // this.worker.postMessage("wazza")
    // this.worker.onmessage = ({data}) => {
    //   this.handleEvent({type: "worker", data});
    // }
  }

  handleEvent(e) {
    switch (e.type) {
      case "click": {
        canvasScript.drawLine();
        break;
      };
      case "dblclick": {
        canvasScript.scale();
        break;
      }
      case "worker": {
        console.log(e.data)
      }
    }
  }
}

let controller = new Controller();
