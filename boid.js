class Boid {
    constructor(x, y) {
      this.position = createVector(x, y);
      this.velocity = createVector(0,random(-1,1));//p5.Vector.random2D();
      this.velocity.setMag(random(2, 4));
      this.acceleration = createVector();
      this.maxForce = 0.2;
      this.maxSpeed = 4;
      this.size = random()>0.8 ? random(150,300)*M : random(50,80)*M
    }
  
    edges() {
      if (this.position.x > width) this.position.x = 0;
      if (this.position.x < 0) this.position.x = width;
      if (this.position.y > height) this.position.y = 0;
      if (this.position.y < 0) this.position.y = height;
    }
  
    flock(boids) {
      let alignment = this.align(boids);
      let cohesion = this.cohere(boids);
      let separation = this.separate(boids);
  
      // Adjusting weights for behaviors
      alignment.mult(1.0);
      cohesion.mult(1.0);
      separation.mult(1.5);
  
    //   this.acceleration.add(alignment);
    //   this.acceleration.add(cohesion);
    //   this.acceleration.add(separation);
    }
  
    align(boids) {
      let perceptionRadius = 50;
      let steering = createVector();
      let total = 0;
      for (let other of boids) {
        let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
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
  
    cohere(boids) {
      let perceptionRadius = 50;
      let steering = createVector();
      let total = 0;
      for (let other of boids) {
        let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
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
  
    separate(boids) {
      let perceptionRadius = 30;
      let steering = createVector();
      let total = 0;
      for (let other of boids) {
        let d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
        if (other != this && d < perceptionRadius) {
          let diff = p5.Vector.sub(this.position, other.position);
          diff.div(d);
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
  
    update() {
    
      this.position.add(this.velocity);
      this.velocity.add(this.acceleration);
    //   
      this.velocity.limit(this.maxSpeed);
      this.acceleration.mult(0);
      this.acceleration.mult(0);
    }
  
    show() {
      strokeWeight(0.3);
      stroke(100);
      fill(25*noise(this.position.x/100, this.position.y/100))
      push()
      translate(this.position.x, this.position.y);
      rotateX(TWO_PI*sin(this.position.x/100 + this.position.y/100)*0.1)
      box(this.size)
      pop();
    }
  }