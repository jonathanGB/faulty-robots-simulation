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

  /* 
     example of mutual-chain calculation:
        v: 10
        x: [0, 10, 20, 25, 30, 32, 34, 36]
        rightmosts: (
          10: (0)
          20: (10)
          30: (20)
          34: (25)
          36: (30, 32, 34)
        )
        
        (0, 10, 20, 30, 36): colour 1
        (25, 34): colour 2
        (32): colour 3
  */
  const newState = [];  
  let rightMosts = new Map(); // right-most key => set of robots for which the key is the right-most
  let colourGenerator = generateColour(); // generator function ... yields a colour
  for (let i = 0; i < state.length; ++i) {
    let currRobot = state[i];
    const {lefts, rights} = findRobotsVisible(state, i, range);
    const leftMost = lefts.length ? lefts[0] : currRobot; // if no robots on the left, left-most is itself
    const rightMost = rights.length ? rights[rights.length - 1] : currRobot; // if no robots on the right, right-most is itself

    // check if this robot is the right most to other robots
    // if so, is one of those robots the left-most to this robot?
    // if both are true, we are in a mutual chain, so we share the colour of the left-most
    // otherwise, generate a new colour for this robot
    const currIsRightMostTo = rightMosts.get(currRobot.label);
    if (currIsRightMostTo && currIsRightMostTo.has(leftMost.label)) {
      currRobot.colour = leftMost.colour;
    } else {
      currRobot.colour = colourGenerator.next().value;
    }

    // check if this robot shares a common right-most
    // if so, add this robot's label to the list
    // otherwise, create a new list with this robot's label
    const currRightMosts = rightMosts.get(rightMost.label);
    if (currRightMosts) {
      currRightMosts.add(currRobot.label);      
    } else {
      rightMosts.set(rightMost.label, new Set([currRobot.label]));
    }

    // if not faulty: update position; if faulty: keep the same
    // we store the new position in either cases in a temporary property (newX) to not interfere with other robots calculations
    currRobot.newX = currRobot.faulty ?
      currRobot.x :
      (leftMost.x + rightMost.x) / 2;

    newState.push(currRobot);
  }

  // all robots of this wave are done calculating, we move the temp property to its real property, and delete it
  for (let robot of newState) {
    robot.x = robot.newX;
    delete robot.newX;
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

/**
 * Generator function that yields colours
 */
function* generateColour() {
  yield "blue";
  yield "lime";
  yield "crimson";  
  yield "brown";  
  yield "turquoise";
  yield "indigo";
  yield "olive";
  yield "teal";
  yield "cyan";
  yield "cornflowerblue";
  yield "pink";
  yield "orange";  
  yield "silver";
  yield "black"; 
}