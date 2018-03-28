"use strict";

// we are in a WebWoker
if (this.DedicatedWorkerGlobalScope !== undefined) {
  importScripts("disc.js");
  importScripts("vector.js");

  // receiving messages (this file is a WebWorker)
  onmessage = ({data}) => {
    if (data.type == "generate") {
      generate(data.iter, data.todo, data.state, data.range);
    }
  }
} else { // we are running in Node.js
  global.Disc = require("./disc");
  module.exports = miniDisc;
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

  const uniques = getUniqueRobots(state);
  const newState = [];
  for (let currRobot of state) {
    const visibles = findRobotsVisible(currRobot, uniques, range);

    if (currRobot.faulty || visibles.length < 2) {
      newState.push(currRobot);
      continue;
    }

    const {center: ci} = miniDisc(visibles);
    const connectedCenter = getConnectedCenter(range, ci, currRobot, visibles.filter(visible => visible != currRobot));
    currRobot.newX = connectedCenter.x;
    currRobot.newY = connectedCenter.y;

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
 * From a given list, only return robots that are at distinct coordinates
 * We realized that if 2 or more robots have the same coordinates and end up in `findDiscWith3Points`, we get a resulting disc that is wrong (infinite disc). 
 * Therefore, removing duplicates is necessary.
 * 
 * Since then, we restricted even more: duplicates now also include robots that are within a distance of 1e-10
 * 
 * @param {Array} robots 
 * @returns {Array}
 */
function getUniqueRobots(robots) {
  let uniques = [];

  for (const currRobot of robots) {
    const robotsWithin = findRobotsVisible(currRobot, uniques, 1e-10);
    
    if (robotsWithin.length == 0) {
      uniques.push(currRobot);
    }
  }

  return uniques;
}

/**
 * Retuns the robots visible to a reference robot within a certain range
 * 
 * @param {Object} comparedRobot point of reference
 * @param {Array} state current state of robots' positionss
 * @param {Number} range vision v of all robots
 * @returns {Array}
 */
function findRobotsVisible(comparedRobot, state, range) {
  return state.filter(currRobot => {
    // compute distance-squared between comparedRobot and currRobot
    // we keep it squared so we don't have to worry about precision errors by computing the square root
    const distanceSquared = (comparedRobot.x - currRobot.x) ** 2 + (comparedRobot.y - currRobot.y) ** 2;
    return distanceSquared <= range ** 2;
  })
}

/**
 * Based on `Smallest Enclosing Disc` in "Computational Geometry - Algorithms and Applications - Third Edition"
 * 
 * @param {Array{Object}} P set of points {x, y}
 * @returns {Disc} smallest disc containing all points in `P`
 */
function miniDisc(P) {
  shuffle(P);

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
 * Based on `Smallest Enclosing Disc` in "Computational Geometry - Algorithms and Applications - Third Edition"
 * 
 * @param {Array{Object}} P set of points {x, y}
 * @param {Object} q point {x, y} on the boundary of the new disc
 * @returns {Disc} smallest enclosing disc for P with q on its boundary
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
 * Based on `Smallest Enclosing Disc` in "Computational Geometry - Algorithms and Applications - Third Edition"
 * 
 * @param {Array{Object}} P set of points {x, y}
 * @param {Object} q1 point {x, y} on the boundary of the new disc
 * @param {Object} q2 point {x, y} on the boundary of the new disc
 * @returns {Disc} smallest enclosing disc for P with q1 and q2 on its boundary
 */
function miniDiscWith2Points(P, q1, q2) {
  let D0 = new Disc(q1, q2);

  for (let pk of P) {
    if (!D0.contains(pk)) {
      D0 = new Disc(q1, q2, pk);
    }
  }

  return D0;
}

/**
 * Apply the algorithm to make sure that the next position (ci) of the current robot (Ri) stills maintains connectivity
 * with its neighbours (R)
 * 
 * @param {Integer} V 
 * @param {Object} ci 
 * @param {Object} Ri 
 * @param {Array} R 
 */
function getConnectedCenter(V, ci, Ri, R) {
  const Vgoal = new Vector([Ri, ci]);
  const limit = Math.min(...R.map(Rj => {
    const Vrirj = new Vector([Ri, Rj]);
    const dj = Vrirj.norm;
    const {cosθj, sinθj} = Vrirj.getCosAndSin(new Vector([Ri, ci]));
    const lj = (dj / 2 * cosθj) + Math.sqrt((V / 2) ** 2 - (dj / 2 * sinθj) ** 2);

    return lj;
  }));

  const D = Math.min(Vgoal.norm, limit);
  return Vgoal.resize(D).end;
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