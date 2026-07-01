const rand_seed = (size) =>
  [...Array(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
var tempHash = "0x" + rand_seed(64);
// var tempHash = "0x2338fbb6c1d7281e8282d74c41900596ea0158027c5bfca3c37a6c7f36ad2161";

console.log(tempHash);

tokenData = {
  hash: tempHash,
  tokenId: "123000456",
};

let hash = tokenData.hash;

let seed = parseInt(tokenData.hash.slice(0, 16), 16);

class Random {
  constructor() {
    this.useA = false;
    let sfc32 = function (uint128Hex) {
      let a = parseInt(uint128Hex.substr(0, 8, 16));
      let b = parseInt(uint128Hex.substr(8, 8, 16));
      let c = parseInt(uint128Hex.substr(16, 8, 16));
      let d = parseInt(uint128Hex.substr(24, 8, 16));
      return function () {
        a |= 0;
        b |= 0;
        c |= 0;
        d |= 0;
        let t = (((a + b) | 0) + d) | 0;
        d = (d + 1) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
      };
    };

    this.prngA = new sfc32(tokenData.hash.substr(2, 32));

    this.prngB = new sfc32(tokenData.hash.substr(34, 32));
    for (let i = 0; i < 1e6; i += 2) {
      this.prngA();
      this.prngB();
    }
  }

  random_dec() {
    this.useA = !this.useA;
    return this.useA ? this.prngA() : this.prngB();
  }

  random_num(a, b) {
    return a + (b - a) * this.random_dec();
  }

  random_int(a, b) {
    return Math.floor(this.random_num(a, b + 1));
  }

  random_bool(p) {
    return this.random_dec() < p;
  }

  random_choice(list) {
    return list[this.random_int(0, list.length - 1)];
  }
}
let R = new Random(seed);

let rans = [];

var res = 360;
let stp = 1.0;
let f = 0.0;
let rd = 200;
let mX, mY;
let ry, rx, rz, sf, atp, rr;
let n = 0;
let mx, my, dk, karma, bcol;

const flock = [];
let kflock = [];
let alignSlider, cohesionSlider, separationSlider;

let clrLen;
let whichClr;

let clr0 = [
  [225, 77, 42],
  [253, 132, 31],
  [62, 109, 156],
  [0, 18, 83],
];
let clr1 = [
  [0, 0, 0],
  [207, 10, 10],
  [220, 95, 0],
  [238, 238, 238],
];
let clr2 = [
  [255, 247, 233],
  [255, 115, 29],
  [95, 157, 247],
  [23, 70, 162],
];
let clr3 = [
  [0, 0, 0],
  [255, 255, 255],
];
let clr4 = [
  [49, 225, 247],
  [64, 13, 81],
  [216, 0, 166],
  [255, 119, 119],
];
let clr5 = [
  [239, 239, 239],
  [210, 0, 26],
  [255, 222, 0],
  [255, 250, 231],
];
let clr6 = [
  [252, 226, 219],
  [255, 143, 177],
  [178, 112, 162],
  [122, 68, 149],
];
let clr7 = [
  [245, 237, 220],
  [207, 210, 207],
  [162, 181, 187],
  [235, 29, 54],
];
let clr8 = [
  [245, 245, 245],
  [240, 84, 84],
  [48, 71, 94],
  [18, 18, 18],
];
let clr9 = [
  [255, 255, 255],
  [0, 0, 0],
];

let clr1Num = 200;
let clr1Cnt = -1;
let clr1Blk;
let clrA = [];

let whichColor;

var DEFAULT_SIZE = 1000;

var HEIGHT = window.innerHeight
var WIDTH = window.innerWidth // web: fill the viewport edge-to-edge (was HEIGHT*0.707)
var DIM = Math.min(WIDTH, HEIGHT);
var M = DIM / DEFAULT_SIZE;
let c;
let V;
let age;

let img;
function preload() {
  // img = loadImage("slide0.png"); // removed for web — asset not needed
}

function setup() {
  DIM = Math.min(WIDTH, HEIGHT);
  createCanvas(WIDTH, HEIGHT, WEBGL);
  noiseSeed(seed);

  M = DIM / 1000;
  // V = 58;
  V = R.random_int(0, 90);

  comp = R.random_num(0, 1);
  orig = R.random_num(0, 1);

  rectMode(CENTER);

  let whichColor = R.random_int(0, 9);

  if (V < 20) {
    age = R.random_int(2, 5);

    sf = R.random_int(15, 40);
    bs = R.random_int(15, 40);

    cpr = R.random_int(35, 500);
    spr = 25;
    apr = R.random_int(35, 100);

    av = 2;
    cv = 0.1;
    sv = 0.1;

    mf = 0.2;
  }

  if (V >= 20 && V < 30) {
    age = R.random_int(1, 2);

    sf = R.random_int(20, 100);
    bs = R.random_int(15, 20);

    cpr = 25;
    spr = 25;
    apr = 30;

    av = R.random_num(0, 1);
    cv = 0.1;
    sv = 0.1;

    mf = 0.2;
  }

  if (V >= 30 && V < 40) {
    age = R.random_int(1, 2);

    sf = R.random_int(20, 80);
    bs = R.random_int(25, 80);

    cpr = 0;
    spr = 0;
    apr = 0;

    av = 0.1;
    cv = 0.1;
    sv = 0.4;

    mf = 0.2;
  }

  if (V >= 40 && V < 60) {
    age = R.random_int(2, 3);

    sf = R.random_int(20, 100);
    bs = R.random_int(25, 40);

    cpr = 24;
    spr = 25;
    apr = R.random_int(10, 400);

    av = 0.1;
    cv = 0.1;
    sv = 0.1;

    mf = 0.2;
  }

  if (V >= 60 && V <= 70) {
    age = R.random_int(1, 3);

    sf = R.random_int(20, 80);
    bs = R.random_int(15, 100);

    cpr = 90;
    spr = 25;
    apr = 50;

    av = 0.1;
    cv = 0.8;
    sv = 0.1;

    mf = 0.2;
  }

  if (V >= 70 && V < 80) {
    age = R.random_int(1, 2);

    sf = R.random_int(20, 40);
    bs = R.random_int(15, 20);

    cpr = 2;
    spr = 100;
    apr = 100;

    av = 0.1;
    cv = 0.1;
    sv = 0.8;

    mf = 0.2;
  }

  if (V >= 80 && V <= 90) {
    age = R.random_int(1, 2);

    sf = R.random_int(20, 50);
    bs = R.random_int(15, 100);

    cpr = 1000;
    spr = 0;
    apr = 10;

    av = 0.1;
    cv = 0.1;
    sv = 10;

    mf = 0.2;
  }

  for (let i = 0; i <= sf; i++) {
    if (i % 2 == 0) {
      rans[i] = R.random_int(1, bs);
    } else rans[i] = R.random_int(10, bs);
  }

  for (let i = 0; i < sf; i++) {
    let br = rans[i];
    flock.push(new Boid(br, mx, my));
  }

  if (whichColor == 0) whichClr = clr0;
  else if (whichColor == 1) whichClr = clr1;
  else if (whichColor == 2) whichClr = clr2;
  else if (whichColor == 3) whichClr = clr3;
  else if (whichColor == 4) whichClr = clr4;
  else if (whichColor == 5) whichClr = clr5;
  else if (whichColor == 6) whichClr = clr6;
  else if (whichColor == 7) whichClr = clr7;
  else if (whichColor == 8) whichClr = clr8;
  else if (whichColor == 9) whichClr = clr9;
  else if (whichColor == 10) whichClr = clr10;
  else if (whichColor == 11) whichClr = clr11;
  else if (whichColor == 12) whichClr = clr12;

  setColorTables();

  console.log("V ", V);
  console.log("Age ", age);

  let bcol = clrA[0];

  background(bcol);
  push();
  // translate(-WIDTH/2, -HEIGHT/2)
  // rotate(PI/2)
  // image(img, -WIDTH/2, -HEIGHT/2);
  pop();
}

function draw() {
  ambientLight(100);
  directionalLight(255, 255, 255, 0, 0, -DIM * 2 * M);

  smooth();

  scale(0.8);

  if (comp > 0.8 && V >= 20 && V < 40) {
    for (let boid of flock) {
      boid.edgesC(flock);
      boid.flock(flock);
      boid.update();
      boid.show(flock);
    }
  } else {
    for (let boid of flock) {
      boid.edges();
      boid.flock(flock);
      boid.update();
      boid.show(flock);
    }
  }

  if (frameCount >= 190 * 2 * age) {
    if (mouseIsPressed) {
      for (let boid of kflock) {
        boid.edges();
        boid.flock(kflock);
        boid.update();
        boid.showK(kflock);
      }
    }

    print("done");
  }
}

function keyPressed() {
  if (keyCode === 55) {
    saveCanvas(c, "myCanvas", "jpg");
  }
}

function setColorTables() {
  clrLen = whichClr.length;
  clr1Blk = floor(clr1Num / clrLen);
  for (let i = 0; i < clr1Num; ++i) {
    if (i % clr1Blk == 0) clr1Cnt = (clr1Cnt + 1) % clrLen;
    let _c1 = color(
      whichClr[clr1Cnt][0],
      whichClr[clr1Cnt][1],
      whichClr[clr1Cnt][2]
    );
    let _c2 = color(
      whichClr[(clr1Cnt + 1) % clrLen][0],
      whichClr[(clr1Cnt + 1) % clrLen][1],
      whichClr[(clr1Cnt + 1) % clrLen][2]
    );
    clrA.push(
      lerpColor(
        _c1,
        _c2,
        map(i, clr1Cnt * clr1Blk, (clr1Cnt + 1) * clr1Blk, 0.0, 1.0)
      )
    );
  }
}

class Boid {
  constructor(br, mx, my) {
    if (orig > 0.9 && V < 40 && V >= 20) {
      this.position = createVector();
    } else {
      this.position = createVector(
        map(R.random_num(0, 1), 0, 1, -WIDTH / 2, WIDTH / 2),
        map(R.random_num(0, 1), 0, 1, -HEIGHT / 2, HEIGHT / 2)
      );
    }
    if (dk == 1) {
      this.position = createVector(mx, my);
    }

    this.velocity = createVector();
    let angle = R.random_num(0, 1) * TWO_PI;
    let length = 1;
    this.cf = R.random_int(0, 199);
    this.ff = R.random_int(1, 50);
    this.velocity.x = length * Math.cos(angle);
    this.velocity.y = length * Math.sin(angle);
    this.velocity.z = length * Math.sin(angle);
    this.velocity.setMag(R.random_num(2, 4) * M);
    this.acceleration = createVector();
    this.maxForce = mf * M;
    this.maxSpeed = 5 * M;
    this.size = br * M;
  }

  edges() {
    if (this.position.x > WIDTH / 2) {
      this.position.x = -WIDTH / 2;
    } else if (this.position.x < -WIDTH / 2) {
      this.position.x = WIDTH / 2;
    }
    if (this.position.y > HEIGHT / 2) {
      this.position.y = -HEIGHT / 2;
    } else if (this.position.y < -HEIGHT / 2) {
      this.position.y = HEIGHT / 2;
    }
  }

  edgesC(boid) {
    for (let other of boid) {
      let d = dist(this.position.x, this.position.y, 0, 0);
      if (d > 500 * M) {
        this.position.limit(500 * M);
      }
    }
  }

  align(boids) {
    let perceptionRadius = apr * M;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < perceptionRadius) {
        steering.add(other.velocity);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  separation(boids) {
    let perceptionRadius = spr * M;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < perceptionRadius && d > 0) {
        let diff = p5.Vector.sub(this.position, other.position);
        diff.div(d * d);
        steering.add(diff);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  cohesion(boids) {
    let perceptionRadius = cpr * M;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < perceptionRadius) {
        steering.add(other.position);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.sub(this.position);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  flock(boids) {
    let alignment = this.align(boids);
    let cohesion = this.cohesion(boids);
    let separation = this.separation(boids);

    alignment.mult(av);
    cohesion.mult(cv);
    separation.mult(sv);

    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(separation);
  }

  flockK(boids) {
    let alignment = this.align(boids);
    let cohesion = this.cohesion(boids);
    let separation = this.separation(boids);

    alignment.mult(av);
    cohesion.mult(cv);
    separation.mult(sv);

    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(separation);
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.acceleration.mult(0);
  }

  show(boids) {
    let m = map(frameCount, 0, 190 * 2 * age, 0, PI);
    let cm = map(this.position.x, -WIDTH / 2, WIDTH / 2, 0, 199);
    let ac = frameCount;

    let perceptionRadius = apr * M;

    if (ac < 190 * 2 * age) {
      let shv = createVector();
      shv = this.position;
      for (let other of boids) {
        let d = dist(
          this.position.x,
          this.position.y,
          other.position.x,
          other.position.y
        );
        if (other != this && d < 200 * M && d > 10 * M) {
          stroke(clrA[floor((this.cf + ac / this.ff) % clrA.length)]);

          strokeWeight(this.size * 0.01 * M * sin(m));
          line(shv.x, shv.y, other.position.x, other.position.y);

          shv.dot(other.position);
        }
      }

      push();
      noStroke();

      fill(clrA[floor((int(cm) + ac / this.ff) % clrA.length)]);

      translate(this.position.x, this.position.y);

      rotateX(ac / 120);
      rotateY(ac / 120);
      rotateZ(ac / 120);
      box(sin(m) * this.size);

      pop();
    }
  }

  showK(boids) {
    let cm = map(this.position.x, -WIDTH / 2, WIDTH / 2, 0, 199);
    let ac = frameCount % (190 * 2 * age);
    let m = map(frameCount, 0, 190 * 2 * age, 0, PI);

    let perceptionRadius = apr * M;

    let shv = createVector();
    shv = this.position;
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < 200 * M && d > 10 * M) {
        stroke(clrA[floor((this.cf + ac / this.ff) % clrA.length)]);

        strokeWeight(this.size * 0.01 * M * sin(m));
        line(shv.x, shv.y, other.position.x, other.position.y);

        shv.dot(other.position);
      }
    }

    push();
    noStroke();

    fill(clrA[floor((int(cm) + ac / this.ff) % clrA.length)]);

    translate(this.position.x, this.position.y);

    rotateX(ac / 120);
    rotateY(ac / 120);
    rotateZ(ac / 120);
    box(sin(m) * this.size);

    pop();
  }
}

class KBoid {
  constructor(br, mx, my) {
    this.position = createVector(
      map(R.random_num(0, 1), 0, 1, -WIDTH / 2, WIDTH / 2),
      map(R.random_num(0, 1), 0, 1, -HEIGHT / 2, HEIGHT / 2)
    );
    console.log(this.position);

    this.velocity = createVector();
    let angle = R.random_num(0, 1) * TWO_PI;
    let length = 1;
    this.cf = R.random_int(0, 199);
    this.ff = R.random_int(1, 50);
    this.velocity.x = length * Math.cos(angle);
    this.velocity.y = length * Math.sin(angle);
    this.velocity.z = length * Math.sin(angle);
    this.velocity.setMag(R.random_num(2, 4) * M);
    this.acceleration = createVector();
    this.maxForce = mf * M;
    this.maxSpeed = 5 * M;
    this.size = br * M;
  }

  edges() {
    if (this.position.x > WIDTH / 2) {
      this.position.x = -WIDTH / 2;
    } else if (this.position.x < -WIDTH / 2) {
      this.position.x = WIDTH / 2;
    }
    if (this.position.y > HEIGHT / 2) {
      this.position.y = -HEIGHT / 2;
    } else if (this.position.y < -HEIGHT / 2) {
      this.position.y = HEIGHT / 2;
    }
  }

  edgesC(boid) {
    for (let other of boid) {
      let d = dist(this.position.x, this.position.y, 0, 0);
      if (d > 500 * M) {
        this.position.limit(500 * M);
      }
    }
  }

  align(boids) {
    let perceptionRadius = apr * M;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < perceptionRadius) {
        steering.add(other.velocity);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  separation(boids) {
    let perceptionRadius = spr * M;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < perceptionRadius && d > 0) {
        let diff = p5.Vector.sub(this.position, other.position);
        diff.div(d * d);
        steering.add(diff);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  cohesion(boids) {
    let perceptionRadius = cpr * M;
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < perceptionRadius) {
        steering.add(other.position);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.sub(this.position);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  attract(boids, mox, moy) {
    let perceptionRadius = 150 * M;
    let steering = createVector();
    var bipc = createVector(mox, moy);
    let total = 0;
    for (let other of boids) {
      let d = p5.Vector.sub(bipc, this.position);
      if (other != this) {
        steering.add(d);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  flock(boids) {
    let alignment = this.align(boids);
    let cohesion = this.cohesion(boids);
    let separation = this.separation(boids);
    let attraction = this.attract(
      boids,
      mouseX - width / 2,
      mouseY - height / 2
    );

    alignment.mult(av);
    cohesion.mult(cv);
    separation.mult(sv);
    attraction.mult(1);

    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(separation);
    this.acceleration.add(attraction);
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.acceleration.mult(0);
  }

  show(boids) {
    let m = map(frameCount, 0, 190 * 2 * age, 0, PI);
    let cm = map(this.position.x, -WIDTH / 2, WIDTH / 2, 0, 199);
    let ac = frameCount;

    let perceptionRadius = apr * M;

    if (ac < 190 * 2 * age) {
      let shv = createVector();
      shv = this.position;
      for (let other of boids) {
        let d = dist(
          this.position.x,
          this.position.y,
          other.position.x,
          other.position.y
        );
        if (other != this && d < 200 * M && d > 10 * M) {
          stroke(clrA[floor((this.cf + ac / this.ff) % clrA.length)]);

          strokeWeight(this.size * 0.01 * M * sin(m));
          line(shv.x, shv.y, other.position.x, other.position.y);

          shv.dot(other.position);
        }
      }

      push();
      noStroke();

      fill(clrA[floor((int(cm) + ac / this.ff) % clrA.length)]);

      translate(this.position.x, this.position.y);

      rotateX(ac / 120);
      rotateY(ac / 120);
      rotateZ(ac / 120);
      box(sin(m) * this.size);

      pop();
    }
  }

  showK(boids) {
    let cm = map(this.position.x, -WIDTH / 2, WIDTH / 2, 0, 199);
    let ac = frameCount % (190 * 2 * age);
    let m = map(frameCount, 0, 190 * 2 * age, 0, PI);

    let perceptionRadius = apr * M;

    let shv = createVector();
    shv = this.position;
    for (let other of boids) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (other != this && d < 200 * M && d > 10 * M) {
        stroke(clrA[floor((this.cf + ac / this.ff) % clrA.length)]);

        strokeWeight(this.size * 0.01 * M * sin(m));
        line(shv.x, shv.y, other.position.x, other.position.y);

        shv.dot(other.position);
      }
    }

    push();
    noStroke();

    fill(clrA[floor((int(cm) + ac / this.ff) % clrA.length)]);

    translate(this.position.x, this.position.y);

    rotateX(ac / 120);
    rotateY(ac / 120);
    rotateZ(ac / 120);
    box(sin(m) * this.size);

    pop();
  }
}

function keyPressed() {
  if (keyCode === DOWN_ARROW && frameCount > 190 * 2 * age) {
    fill(clrA[0]);

    rect(0, 0, WIDTH * 2, HEIGHT * 2);
  }
}

function mousePressed() {
  let kc = R.random_int(1, 10);

  for (let i = 0; i <= kc; i++) {
    if (i % 2 == 0) {
      rans[i] = R.random_int(1, bs);
    } else rans[i] = R.random_int(10, bs);
  }

  for (let i = 0; i < kc; i++) {
    br = rans[i];
    kflock.push(new KBoid(br, screenX - width / 2, screenY - height / 2));
  }
}
