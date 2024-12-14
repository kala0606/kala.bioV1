
var canvas;

let boids = [];
let moveFrames = 0;
let dir = 0;

var HEIGHT = window.innerHeight
var WIDTH = window.innerWidth
var DIM = Math.min(WIDTH, HEIGHT)
// var M = DIM/1000;
var M = WIDTH>HEIGHT ? DIM / 1000 : DIM/500;

let font;

// function preload() {
//   font = loadFont('HelveticaNeue-Regular.otf');
// }

function setup() {
    canvas = createCanvas(windowWidth, windowHeight, WEBGL); // Create a canvas
    canvas.position(0, 0); // Position it at the top-left corner
    canvas.style('z-index', '-1'); // Push the canvas behind other elements
    canvas.style('position', 'fixed'); // Ensure it stays fixed in the background
  
    background(70)

  for (let i = 0; i < 100; i++) {
    boids.push(new Boid(random(width), random(height)));
  }
}

function draw() {
  background(40); 
  // lights();
  // ambientLight(48, 48, 48);

  push();
  translate(-width/2, -height/2, 100)

  

  // Only update Boids if moveFrames > 0
  if (moveFrames > 0) {
    for (let boid of boids) {
      boid.edges();
      boid.flock(boids);
      boid.update();
    }
    moveFrames--; // Decrease the frame count
  }

 
  
  // Display all Boids
  for (let boid of boids) {
    boid.show();
  }

  pop();

  // Render menu and current page
  
  // currentPage.display();
  // menu.display();

//   console.log("Current Page:", currentPage);
// console.log("Is HomePage?", currentPage instanceof HomePage);
  

  
  

}



function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}




function mouseWheel(event) {
  print(event.delta)
  moveFrames = 1;
  dir = event.delta>0 ? 1 : -1; // Allow movement for 60 frames
}

function mousePressed(){
  moveFrames = 60;
}

