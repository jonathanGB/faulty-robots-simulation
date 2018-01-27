"use strict";

importScripts("disc.js")

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
    let currRobot = state[i];
    const visibles = findRobotsVisible(state, i, range);

    if (currRobot.faulty || visibles.length < 2) {
      newState.push(currRobot);
      continue;
    }

    const smallestEnglobingDisc = miniDisc(shuffle(visibles));

    currRobot.newX = minDisc.center.x;
    currRobot.newY = minDisc.center.y;

    newState.push(currRobot);
  }

  for (let robot of newState) {
    robot.x = robot.newX || robot.x;
    robot.y = robot.newY || robot.y;
    delete robot.newX;
    delete robot.newY;
  }
  
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
 * Retuns the robots visible to a reference robot within a certain range
 * 
 * @param {Array{Object}} state current state of robots' positions
 * @param {Integer} currIndex index of the comparedRobot 
 * @param {Number} range vision v of all robots 
 */
function findRobotsVisible(state, currIndex, range) {
  const comparedRobot = state[currIndex];
  let visibles = [];

  for (let i = 0; i < state.length; i++) {
    // skip comparedRobot
    if (i == currIndex) {
      continue;
    }

    // compute distance-squared between comparedRobot and currRobot
    // we keep it squared so we don't have to worry about precision errors by computing the square root
    const currRobot = state[i];
    const distanceSquared = (comparedRobot.x - currRobot.x) ** 2 + (comparedRobot.y - currRobot.y) ** 2;
    if (distanceSquared <= range ** 2) {
      visibles.push(currRobot);
    }
  }

  return visibles;
}

/**
 * 
 * @param {Array{Object}} P set of points {x, y}
 * @returns {Object} smallest disc containing all points in `P`
 * @returns {Disc}
 */
function miniDisc(P) {
  let [p1, p2] = P;
  let D2 = new Disc(p1, p2);

  for (let i = 2; i < P.length; i++) {
    let pi = P[i];
    if (!D2.contains(pi)) {
      D2 = miniDiscWithPoint(P.slice(0, i), pi)
    }
  }

  return D2;
}

/**
 * 
 * @param {Array{Object}} P 
 * @param {Object} q
 * @returns {Disc}
 */
function miniDiscWithPoint(P, q) {
  let [p1] = P;
  let D1 = new Disc(p1, q);

  for (let j = 1; j < P.length; j++) {
    let pj = P[j];
    if (!D1.contains(pj)) {
      D1 = miniDiscWith2Points(P.slice(0, j), pj, q);
    }
  }

  return D1;
}

/**
 * 
 * @param {Array{Object}} P 
 * @param {Object} q1 
 * @param {Object} q2
 * @returns {Disc}
 */
function miniDiscWith2Points(P, q1, q2) {
  let D0 = new Disc(q1, q2);

  for (let pk of P) {
    if (!D0.contains(pk)) {
      return D0.extend(pk);
    }
  }

  return D0;
}

/**
 * Implementation of the Fisher-Yates shuffle
 * 
 * @param {Array} arr 
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    // random integer between [0,i]
    let j = Math.floor(Math.random() * (i+1));

    // swap
    let tmp = arr[j];
    arr[j] = arr[i];
    arr[i] = tmp;
  }
}