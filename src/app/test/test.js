const chai = require("chai");
const {expect} = chai;
const Disc = require("../js/disc");
const miniDisc = require("../js/calculator2d");

chai.use(require("chai-almost")());

describe("Testing creating discs", function() {
  describe("A disc with (-1,0) & (1,0) on its boundary", function() {
    const d = new Disc({
      x: -1,
      y: 0,
    }, {
      x: 1,
      y: 0,
    });

    it("should be centered at x=0", function() {
      expect(d.center.x).to.equal(0);
    });

    it("should be centered at y=0", function() {
      expect(d.center.y).to.equal(0);
    });

    it("should have a radius^2 of 1", function() {
      expect(d.rSquared).to.equal(1);
    });
  });

  describe("A disc with (-4,0) & (0,0) on its boundary", function() {
    const d = new Disc({
      x: -4,
      y: 0,
    }, {
      x: 0,
      y: 0,
    });

    it("should be centered at x=-2", function() {
      expect(d.center.x).to.equal(-2);
    });

    it("should be centered at y=0", function() {
      expect(d.center.y).to.equal(0);
    });

    it("should have a radius^2 of 4", function() {
      expect(d.rSquared).to.equal(4);
    });
  });

  describe("A disc with (-3,2) & (15,-5) on its boundary", function() {
    const d = new Disc({
      x: -3,
      y: 2,
    }, {
      x: 15,
      y: -5,
    });

    it("should be centered at x=6", function() {
      expect(d.center.x).to.equal(6);
    });

    it("should be centered at y=-1.5", function() {
      expect(d.center.y).to.equal(-1.5);
    });

    it("should have a radius^2 of 93.25", function() {
      expect(d.rSquared).to.equal(93.25);
    });
  });

  describe("A disc with (-1,0) & (1,0) & (0,1) on its boundary", function() {
    const d = new Disc({
      x: -1,
      y: 0,
    }, {
      x: 1,
      y: 0,
    }, {
      x: 0,
      y: 1,
    });

    it("should be centered at x=0", function() {
      expect(d.center.x).to.equal(0);
    });

    it("should be centered at y=0", function() {
      expect(d.center.y).to.equal(0);
    });

    it("should have a radius^2 of 1", function() {
      expect(d.rSquared).to.equal(1);
    });
  });

  describe("A disc with (1,1) & (5,3) & (2,4) on its boundary", function() {
    const d = new Disc({
      x: 1,
      y: 1,
    }, {
      x: 5,
      y: 3,
    }, {
      x: 2,
      y: 4,
    });

    it("should be centered at x=3", function() {
      expect(d.center.x).to.equal(3);
    });

    it("should be centered at y=2", function() {
      expect(d.center.y).to.equal(2);
    });

    it("should have a radius^2 of 5", function() {
      expect(d.rSquared).to.equal(5);
    });
  });

  describe("A disc with (-6,9) & (4.5,3) & (17,7) on its boundary", function() {
    const d = new Disc({
      x: -6,
      y: 9,
    }, {
      x: 4.5,
      y: 3,
    }, {
      x: 17,
      y: 7,
    });

    it("should be centered at x=6.4166666667", function() {
      expect(d.center.x).to.almost.equal(6.4166666667);
    });

    it("should be centered at y=18.5416666667", function() {
      expect(d.center.y).to.almost.equal(18.5416666667);
    });

    it("should have a radius^2 of 245.2170138906", function() {
      expect(d.rSquared).to.almost.equal(245.2170138906);
    });
  });
});

describe("Testing minimal englobing disc finding", function() {
  describe("A disc containing (0,0) & (0,1) & (0,-1) & (-1,0)", function() {
    const P = [{
      x: 0,
      y: 0,
    }, {
      x: 0,
      y: 1,
    }, {
      x: 0,
      y: -1,
    }, {
      x: -1,
      y: 0,
    }];

    const d = miniDisc(P);

    it("should contain all the points in P", function() {
      for (let p of P) {
        expect(d.contains(p)).to.equal(true);
      }
    });

    it("should be centered at x=0", function() {
      expect(d.center.x).to.equal(0);
    });

    it("should be centered at y=0", function() {
      expect(d.center.y).to.equal(0);
    });

    it("should have a radius^2 of 1", function() {
      expect(d.rSquared).to.equal(1);
    });
  });

  describe("A disc containing (4,5) & (0,5) & (4,1) & (0,9) & (10,3)", function() {
    const P = [{
      x: 4,
      y: 5,
    }, {
      x: 0,
      y: 5,
    }, {
      x: 4,
      y: 1,
    }, {
      x: 0,
      y: 9,
    }, {
      x: 10,
      y: 3,
    }];

    const d = miniDisc(P);

    it("should contain all the points in P", function() {
      for (let p of P) {
        expect(d.contains(p)).to.equal(true);
      }
    });
  });

  describe("A disc containing (5,9) & (5,11) & (8,9) & (8,11) & (11,14)", function() {
    const P = [{
      x: 5,
      y: 9,
    }, {
      x: 5,
      y: 11,
    }, {
      x: 8,
      y: 9,
    }, {
      x: 8,
      y: 11,
    }, {
      x: 11,
      y: 14,
    }];

    const d = miniDisc(P);

    it("should contain all the points in P", function() {
      for (let p of P) {
        expect(d.contains(p)).to.equal(true);
      }
    });
  });

  describe("A disc containing (8,5) & (9,1) & (16,1) & (12,0) & (10,3) & (13,2) & (12,4) & (18,5)", function() {
    const P = [{
      x: 8,
      y: 5,
    }, {
      x: 9,
      y: 1,
    }, {
      x: 16,
      y: 1,
    }, {
      x: 12,
      y: 0,
    }, {
      x: 10,
      y: 3,
    }, {
      x: 13,
      y: 2,
    }, {
      x: 12,
      y: 4,
    }, {
      x: 18,
      y: 5,
    }];

    const d = miniDisc(P);

    it("should contain all the points in P", function() {
      for (let p of P) {
        expect(d.contains(p)).to.equal(true);
      }
    });
  })
});
