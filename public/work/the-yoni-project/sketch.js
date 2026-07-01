const rand_seed = (size) =>
  [...Array(size)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
var tempHash = "0x" + rand_seed(64);


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
        a |= 0; b |= 0; c |= 0; d |= 0;
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

var DEFAULT_SIZE = 1000;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var DIM = Math.min(WIDTH, HEIGHT);
var M = DIM / DEFAULT_SIZE;

let clrLen;
let whichClr;

let clr0 = [[38, 0, 27],[255, 0, 92],[255, 246, 0],[129, 0, 52]];
let clr1 = [[30, 49, 99],[240, 55, 165],[45, 70, 185],[248, 248, 248]];
let clr2 = [[59, 0, 0],[255, 0, 0],[255, 246, 205],[255, 149, 197]];
let clr3 = [[0, 0, 0],[255, 255, 255]];
let clr4 = [[12, 236, 221],[255, 243, 56],[255, 103, 231],[196, 0, 255]];
let clr5 = [[230, 204, 169],[83, 53, 53],[174, 76, 207],[255, 109, 109]];
let clr6 = [[73, 255, 0],[251, 255, 0],[255, 147, 0],[255, 0, 0]];
let clr7 = [[240, 228, 215],[245, 192, 192],[255, 113, 113],[159, 216, 223]];
let clr8 = [[75, 119, 141],[40, 181, 181],[143, 217, 168],[210, 230, 156]];
let clr9 = [[243, 145, 137],[4, 101, 130]];
let clr10 = [[198, 213, 126],[213, 126, 126],[162, 205, 205],[255, 225, 175]];
let clr11 = [[75, 119, 141],[40, 181, 181],[143, 217, 168],[210, 230, 156]];
let clr12 = [[209, 232, 228],[195, 123, 137],[188, 204, 154],[234, 231, 198]];
let clr13 = [[46, 76, 109],[245, 238, 220],[218, 221, 252],[252, 153, 124]];
let clr14 = [[20, 47, 67],[255, 171, 76],[255, 95, 126],[176, 0, 185]];

let clr1Num;
let clr1Cnt = -1;
let clr1Blk;
let clrA = [];

let clr2Num = 100;
let clr2Cnt = -1;
let clr2Blk;
let clrB = [];

let bgCount = R.random_int(20,80);

let whichColor;
let whichSet;

let whichSet_mov;
let whichSet_age;
let whichSet_mul;
let whichSet_ss;
let whichSet_as;

let set_mov;   //movement intensity
let set_age;   //num of lines
let set_mul;   //z-noise
let set_ss;    //stroke size
let set_as;    //animation speed

let zoff = 0;
let ov; 

function setup() {
  createCanvas(WIDTH, HEIGHT, WEBGL);
  noiseSeed(seed);
  // web embed: disable depth test so the translucent trail overlay composites
  // by paint order (alpha blend) rather than being occluded by prior frames.
  if (typeof drawingContext !== "undefined" && drawingContext.disable) {
    drawingContext.disable(drawingContext.DEPTH_TEST);
  }

  whichColor = R.random_int(0, 14);

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
  else if (whichColor == 13) whichClr = clr13;
  else whichClr = clr14;

  whichSet = R.random_int(1, 90);
  whichSet_mov = R.random_int(1, 100);
  whichSet_age = R.random_int(1, 100);
  whichSet_mul = R.random_int(1, 100);
  whichSet_ss = R.random_int(1, 100);
  whichSet_as = R.random_int(1, 100);

  if (whichSet >= 1 && whichSet <= 5) {
    // 01-5 / sym, old, ribbed
    set_mov = map(whichSet_mov, 1, 100, 0, 0.1);
    set_age = map(whichSet_age, 1, 100, 80, 100);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 4.0);
    set_ss = map(whichSet_ss, 1, 100, 1, 5);
    set_as = map(whichSet_ss, 1, 100, 1, 2);
    clr1Num = 12;
  } else if (whichSet >= 6 && whichSet <= 10) {
    // 6-10 / sym, mid, ribbed
    set_mov = map(whichSet_mov, 1, 100, 0, 0.1);
    set_age = map(whichSet_age, 1, 100, 40, 70);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 1.0);
    set_ss = map(whichSet_ss, 1, 100, 3, 5);
    set_as = map(whichSet_ss, 1, 100, 0.5, 1);
    clr1Num = 12;
  } else if (whichSet >= 11 && whichSet <= 15) {
    // 11-15 / sym, young, ribbed
    set_mov = map(whichSet_mov, 1, 100, 0, 0.1);
    set_age = map(whichSet_age, 1, 100, 10, 30);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 1.0);
    set_ss = map(whichSet_ss, 1, 100, 10, 15);
    set_as = map(whichSet_ss, 1, 100, 0.1, 0.4);
    clr1Num = 12;
  } else if (whichSet >= 16 && whichSet <= 20) {
    // 16-20 / sym, old, smooth
    set_mov = map(whichSet_mov, 1, 100, 0, 0.1);
    set_age = map(whichSet_age, 1, 100, 80, 100);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 4.0);
    set_ss = map(whichSet_ss, 1, 100, 1, 10);
    set_as = map(whichSet_ss, 1, 100, 1, 2);
    clr1Num = 100;
  } else if (whichSet >= 21 && whichSet <= 25) {
    // 21-25 / sym, mid, smooth
    set_mov = map(whichSet_mov, 1, 100, 0, 0.1);
    set_age = map(whichSet_age, 1, 100, 40, 70);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 1.0);
    set_ss = map(whichSet_ss, 1, 100, 3, 5);
    set_as = map(whichSet_ss, 1, 100, 1, 2);    
    clr1Num = 100;
  } else if (whichSet >= 26 && whichSet <= 30) {
    // 26-30 / sym, young, smooth

    set_mov = map(whichSet_mov, 1, 100, 0, 0.1);
    set_age = map(whichSet_age, 1, 100, 10, 30);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 1.0);
    set_ss = map(whichSet_ss, 1, 100, 10, 15);
    set_as = map(whichSet_ss, 1, 100, 0.1, 0.4);

    clr1Num = 100;
  } else if (whichSet >= 31 && whichSet <= 35) {
    // 31-35 / SSym, old, ribbed
    set_mov = map(whichSet_mov, 1, 100, 0.5, 1.2);
    set_age = map(whichSet_age, 1, 100, 80, 100);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 2.0);
    set_ss = map(whichSet_ss, 1, 100, 2, 5);
    set_as = map(whichSet_ss, 1, 100, 1, 2);
    clr1Num = 12;
  } else if (whichSet >= 36 && whichSet <= 40) {
    // 36-40 / Ssym, mid, ribbed
    set_mov = map(whichSet_mov, 1, 100, 0.5, 1.2);
    set_age = map(whichSet_age, 1, 100, 40, 70);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 1.0);
    set_ss = map(whichSet_ss, 1, 100, 3, 5);
    set_as = map(whichSet_ss, 1, 100, 1, 2);
    clr1Num = 12;
  } else if (whichSet >= 41 && whichSet <= 45) {
    // 41-45 / Ssym, young, ribbed
    set_mov = map(whichSet_mov, 1, 100, 0.5, 1.2);
    set_age = map(whichSet_age, 1, 100, 10, 30);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 1.0);
    set_ss = map(whichSet_ss, 1, 100, 10, 15);
    set_as = map(whichSet_ss, 1, 100, 0.1, 0.4);
    clr1Num = 12;
  } else if (whichSet >= 46 && whichSet <= 50) {
    // 46-50 / SSym, old, smooth
    set_mov = map(whichSet_mov, 1, 100, 0.5, 1.2);
    set_age = map(whichSet_age, 1, 100, 80, 100);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 2.0);
    set_ss = map(whichSet_ss, 1, 100, 2, 5);
    set_as = map(whichSet_ss, 1, 100, 1, 2);
    clr1Num = 100;
  } else if (whichSet >= 51 && whichSet <= 55) {
    // 51-55 / Ssym, mid, smooth
    set_mov = map(whichSet_mov, 1, 100, 0.5, 1.2);
    set_age = map(whichSet_age, 1, 100, 40, 70);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 1.0);
    set_ss = map(whichSet_ss, 1, 100, 3, 5);
    set_as = map(whichSet_ss, 1, 100, 1, 2);
    clr1Num = 100;
  } else if (whichSet >= 56 && whichSet <= 60) {
    // 56-60 / Ssym, young, smooth
    set_mov = map(whichSet_mov, 1, 100, 0.5, 1.2);
    set_age = map(whichSet_age, 1, 100, 10, 30);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 1.0);
    set_ss = map(whichSet_ss, 1, 100, 10, 15);
    set_as = map(whichSet_ss, 1, 100, 0.1, 0.3);
    clr1Num = 100;
  } else if (whichSet >= 61 && whichSet <= 65) {
    // 61-65 / ASym, old, ribbed
    set_mov = map(whichSet_mov, 1, 100, 1.3, 2);
    set_age = map(whichSet_age, 1, 100, 80, 100);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 2.0);
    set_ss = map(whichSet_ss, 1, 100, 2, 5);
    set_as = map(whichSet_ss, 1, 100, 1, 2);
    clr1Num = 12;
  } else if (whichSet >= 66 && whichSet <= 70) {
    // 66-70 / Asym, mid, ribbed
    set_mov = map(whichSet_mov, 1, 100, 1.3, 2);
    set_age = map(whichSet_age, 1, 100, 40, 70);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 1.0);
    set_ss = map(whichSet_ss, 1, 100, 3, 5);
    set_as = map(whichSet_ss, 1, 100, 1, 2);
    clr1Num = 12;
  } else if (whichSet >= 71 && whichSet <= 75) {
    // 71-75 / Asym, young, ribbed
    set_mov = map(whichSet_mov, 1, 100, 1.3, 2);
    set_age = map(whichSet_age, 1, 100, 10, 30);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 1.0);
    set_ss = map(whichSet_ss, 1, 100, 10, 15);
    set_as = map(whichSet_ss, 1, 100, 0.1, 0.3);
    clr1Num = 12;
  } else if (whichSet >= 76 && whichSet <= 80) {
    // 76-80 / ASym, old, smooth
    set_mov = map(whichSet_mov, 1, 100, 1.3, 2);
    set_age = map(whichSet_age, 1, 100, 80, 100);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 2.0);
    set_ss = map(whichSet_ss, 1, 100, 2, 5);
    set_as = map(whichSet_ss, 1, 100, 1, 2);
    clr1Num = 100;
  } else if (whichSet >= 81 && whichSet <= 85) {
    // 81-85 / Asym, mid, smooth
    set_mov = map(whichSet_mov, 1, 100, 1.3, 2);
    set_age = map(whichSet_age, 1, 100, 40, 70);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 1.0);
    set_ss = map(whichSet_ss, 1, 100, 3, 5);
    set_as = map(whichSet_ss, 1, 100, 1, 2);
    clr1Num = 100;
  } else if (whichSet >= 86 && whichSet <= 90) {
    // 86-90 / Asym, young, smooth
    set_mov = map(whichSet_mov, 1, 100, 1.3, 2);
    set_age = map(whichSet_age, 1, 100, 10, 30);
    set_mul = map(whichSet_mul, 1, 100, 1.0, 1.0);
    set_ss = map(whichSet_ss, 1, 100, 10, 15);
    set_as = map(whichSet_ss, 1, 100, 0.1, 0.3);
    clr1Num = 100;
  }

  ov = R.random_int(100, 500);

  setColorTables();

  // web embed: paint the background ONCE here so draw() never clears —
  // every line accumulates and all trails stay visible.
  background(clrB[floor(bgCount % clrB.length)]);
}


// ---
  
  
function draw() {
  // no background here — it was painted once in setup, so all trails persist
  scale(0.7);

  let co = 0;
  let sw = 10;
  let sn = int(set_age / 10);
  let ri = (1000 / 22) * M;

  for (let gr = 0; gr < (1000 / 2) * M; gr += (1000 / (set_age * 2)) * M) {
    strokeWeight((co / 30) * M * set_ss);
    stroke(clrA[floor((int(sn) + frameCount * set_as/4) % clrA.length)]);
    // fill(clrB[floor((int(sn) + frameCount * set_as/4) % clrB.length)]);
    fill(255)
    push();
    rotate(PI / 2);
    translate((1000 / 20) * M, (-1000 / 20) * M);
    beginShape();
    for (let a = 0; a < PI; a += radians(3)) {
      let xoff = map(cos(a), -1, 1, 0, set_mov);
      let yoff = map(sin(a), -1, 1, 0, set_mov);

      const r = map(1 / sin(a), -1, 1, 0, ri * 2) + map(noise(xoff, yoff, zoff), 0, 1, 0, gr * set_mul) + noise(gr+zoff)*ov;

      let x = r * cos(a);
      let y = r * sin(a);

      vertex(x, y);
      ellipse(x,y,6*noise(zoff)*M);
    }
    endShape();

    // push();
    // rotate(PI);
    // translate(0, (-1000 / 10) * M);
    // // beginShape();
    // for (let a = 0; a < PI; a += radians(5)) {
    //   let xoff = map(sin(a), -1, 1, 0, set_mov);
    //   let yoff = map(sin(a), -1, 1, 0, set_mov);

    //   const r = map(1 / sin(a), -1, 1, 0, ri * 2) + map(noise(xoff, yoff, zoff+10), 0, 1, 0, gr * set_mul) + noise(gr+zoff)*ov;

    //   let x = r * cos(a);
    //   let y = r * sin(a);
    //     // stroke(0);
    //     strokeWeight(0);
    //     // translate(x,y)
    //   ellipse(x,y,10*M);
    // //   line(x,y,x+20*M, y);
    // }
    // // endShape();
    // pop();

    

    push();
    rotate(PI);
    translate(0, (-1000 / 10) * M);
    beginShape();
    for (let a = 0; a < PI; a += radians(3)) {
      let xoff = map(sin(a), -1, 1, 0, set_mov);
      let yoff = map(sin(a), -1, 1, 0, set_mov);

      const r = map(1 / sin(a), -1, 1, 0, ri * 2) + map(noise(xoff, yoff, zoff), 0, 1, 0, gr * set_mul) + noise(gr+zoff)*ov;

      let x = r * cos(a);
      let y = r * sin(a);

      vertex(x, y);

      ellipse(x,y,6*noise(zoff)*M);
    //   line(x,y,x+20*M, y);
    }
    endShape();
    pop();

    // push();
    // rotate(PI);
    // translate(0, (-1000 / 10) * M);
    // // beginShape();
    // for (let a = 0; a < PI; a += radians(5)) {
    //   let xoff = map(sin(a), -1, 1, 0, set_mov);
    //   let yoff = map(sin(a), -1, 1, 0, set_mov);

    //   const r = map(1 / sin(a), -1, 1, 0, ri * 2) + map(noise(xoff, yoff, zoff+10), 0, 1, 0, gr * set_mul) + noise(gr+zoff)*ov;

    //   let x = r * cos(a);
    //   let y = r * sin(a);
    //     // stroke(0);
    //     strokeWeight(0);
    //     // translate(x,y)
    //   ellipse(x,y,5*M);
    // //   line(x,y,x+20*M, y);
    // }
    // // endShape();
    // pop();

    pop();

    zoff += 0.0001;
    ri += 0.1;
    co++;
    if (sn == clr1Num - 1) sn = 0;
    else sn++;
  }

  console.log(frameRate());
}

function setColorTables() {
  clrLen = whichClr.length;
  clr1Blk = floor(clr1Num / clrLen);
  clr2Blk = floor(clr2Num / clrLen);
  for (let i = 0; i < clr1Num; ++i) {
    if (i % clr1Blk == 0) clr1Cnt = (clr1Cnt + 1) % clrLen;
    let _c1 = color(whichClr[clr1Cnt][0],whichClr[clr1Cnt][1],whichClr[clr1Cnt][2]);
    let _c2 = color(whichClr[(clr1Cnt + 1) % clrLen][0],whichClr[(clr1Cnt + 1) % clrLen][1],whichClr[(clr1Cnt + 1) % clrLen][2]);
    clrA.push(lerpColor(_c1,_c2,map(i, clr1Cnt * clr1Blk, (clr1Cnt + 1) * clr1Blk, 0.0, 1.0)));
  }
  for (let i = 0; i < clr2Num; ++i) {
    if (i % clr2Blk == 0) clr2Cnt = (clr2Cnt + 1) % clrLen;
    let _c1 = color(whichClr[clr2Cnt][0],whichClr[clr2Cnt][1],whichClr[clr2Cnt][2]);
    let _c2 = color(whichClr[(clr2Cnt + 1) % clrLen][0],whichClr[(clr2Cnt + 1) % clrLen][1],whichClr[(clr2Cnt + 1) % clrLen][2]);
    clrB.push(lerpColor(_c1,_c2,map(i, clr2Cnt * clr2Blk, (clr2Cnt + 1) * clr2Blk, 0.0, 1.0)));
  }
}
