"use strict";

class Controller {
  constructor() {
    document.addEventListener("click", this, {once: true});
    document.addEventListener("dblclick", this, {once: true});
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
    }
  }
}

let controller = new Controller();
