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

  const newState = [];
  for (let i = 0; i < state.length; ++i) {
    if (state[i].faulty) {
      newState.push({...state[i]}); // push copied object
      continue;
    }

    const {lefts, rights} = findRobotsVisible(state, i, range);
    const leftMost = lefts.length ? lefts[0].x : state[i].x; // if no robots on the left, left-most is itself
    const rightMost = rights.length ? rights[rights.length - 1].x : state[i].x; // if no robots on the right, right-most is itself
    const newX = (leftMost + rightMost) / 2;
    newState.push({...state[i], x: newX});
  }
  newState.sort((a, b) => a.x - b.x);

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
  const visibles = {
    lefts: [],
    rights: [],
  };
  const comparedRobot = state[currIndex];

  // look to the left
  for (let i = 0; i < currIndex; ++i) {
    const visitedRobot = state[i];
    const dist = comparedRobot.x - visitedRobot.x;

    if (dist <= range) {
      visibles.lefts.push(visitedRobot);
    }
  }

  // look to the right
  for (let i = currIndex + 1; i < state.length; ++i) {
    const visitedRobot = state[i];
    const dist = visitedRobot.x - comparedRobot.x;

    if (dist > range) {
      break;
    }
    
    visibles.rights.push(visitedRobot);
  }

  return visibles;
}