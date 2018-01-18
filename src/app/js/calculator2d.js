"use strict";

// receiving messages (this file is a WebWorker)
onmessage = ({data}) => {
  if (data.type == "generate") {
    generate(data.iter, data.todo, data.state, data.range);
  }
}

/**
 * Compute the next generation of robots' positions
 * @param {Number} iter current iteration
 * @param {Number} todo how many left to generate
 * @param {Array{Object}} state current state of robots' positions
 * @param {Number} range vision v of all robots
 */
function generate(iter, todo, state, range) {
  if (todo == 0) {
    return;
  }

  // TODO: implement

  postMessage({
    type: "generate",
    response: {
      iter,
      newState,
    },
  });

  return generate(iter + 1, todo - 1, newState, range);
}

/**
 * Retuns the robots visible to the left and to the right of the comparedRobot
 * First of `lefts` is leftmost - last of `rights` is rightmost
 * 
 * @param {Array{Object}} state current state of robots' positions
 * @param {Integer} currIndex index of the comparedRobot 
 * @param {Number} range vision v of all robots 
 */
function findRobotsVisible(state, currIndex, range) {
  // TODO: implement

  return visibles;
}
