import { Net, mutate} from './brain';

const birdImg =new Image();
birdImg.src ="assets/bird.png";

const c =document.createElement("canvas") as HTMLCanvasElement;
document.body.appendChild(c);

const scale= 2;
const ctx =c.getContext("2d")!;

let birds: Bird[] =[];
let pipes:Pipe[] = [];
let deadBirds: Bird[] =[];
let pipeTimer =1500;
let frontPipe: Pipe | null = null;
let bestBird: Bird | null = null;
let gen = 1;
let pillarsPassed = 0;

class Bird {
  score = 0;
  y = 0.5;
  x = 0;
  yVelocity = 0;
  gravity = 0.0003;
  dead = false;
  brain = new Net();

  update(): void {
    if (!this.dead) this.score++;

    this.yVelocity += this.gravity;
    this.y += this.yVelocity;

    if (frontPipe && this.brain.predict([this.y, this.yVelocity, frontPipe.height, frontPipe.x])) {
      this.yVelocity = -0.008;
    }

    //boundary Check
    if (this.y > 1 || this.y < 0) {
      this.die();
      return;
    }
    //collision Check
    for (const p of pipes) {
      if (this.x > p.x && this.x < p.x + 0.1 && Math.abs(this.y - p.height) > 0.1) {
        this.die();
        return;
      }
    }
  }
  private die(): void {
    if (!this.dead) {
      this.dead = true;
      deadBirds.push(this);
    }
  }

  draw(): void {
    if (this.dead) return;
    const size = c.height * 0.07;
    const xPos = (c.width - c.height) / 2 - size / 2;
    const yPos = this.y * c.height - size / 2;

    ctx.save();
    ctx.translate(xPos + size / 2, yPos + size / 2);
    ctx.rotate(this.yVelocity * 50);
    ctx.globalAlpha = this === bestBird ? 1 : 0.4;
    ctx.drawImage(birdImg, -size / 2, -size / 2, size, size);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

class Pipe {
  x: number;
  height: number;
  passed = false;

  constructor() {
    this.x=(c.width-c.height) /2 / c.height + 1;
    this.height = Math.random() * 0.75 + 0.125;
  }

  update(): boolean {
    this.x -= 0.01;
    if (!this.passed && bestBird && this.x + 0.05 < bestBird.x) {
      this.passed = true;
      pillarsPassed++;
    }
    //return true if still on screen
    return this.x > -((c.width - c.height) / 2) / c.height - 0.1;
  }

  draw(): void {
    const xCoord = this.x * c.height + (c.width - c.height) / 2;
    ctx.fillStyle = "#065122ff";
    ctx.fillRect(xCoord, 0, c.height * 0.1, c.height * (this.height - 0.1));
    ctx.fillStyle = "#076033ff";
    ctx.fillRect(xCoord, (this.height + 0.1) * c.height, c.height * 0.1, c.height);
  }
}

function update(): void {
  c.width = scale * window.innerWidth;
  c.height = scale * window.innerHeight;
  ctx.imageSmoothingEnabled = false;

  if (deadBirds.length === birds.length && birds.length > 0) {
    nextGeneration();
  }

  pipeTimer += 1000 / 60;
  if (pipeTimer > 1500) {
    pipeTimer = 0;
    pipes.push(new Pipe());
  }

  for (const p of pipes) {
    if (p.x > -0.1) {
      frontPipe = p;
      break;
    }
  }
  ctx.clearRect(0, 0, c.width, c.height);

  birds.forEach(b => { b.update(); b.draw(); });
  pipes = pipes.filter(p => {
    const active = p.update();
    if (active) p.draw();
    return active;
  });
  drawUI();
}

function nextGeneration(): void {
  gen++;
  birds.sort((a, b) => b.score - a.score);
  const parents=birds.slice(0, 10);

  birds = [];
  deadBirds = [];
  pipes = [];
  pillarsPassed = 0;

  for (let i = 0; i < 999; i++) {
    const b = new Bird();
    const randomParent = parents[Math.floor(Math.random() * parents.length)];
    b.brain = mutate(randomParent.brain);
    birds.push(b);
  }

  //elitism
  if (parents.length > 0) {
    const champion = parents[0];
    champion.dead = false;
    champion.y = 0.5;
    champion.yVelocity = 0;
    champion.score = 0;
    birds.push(champion);
    bestBird = champion;
  }
}

function drawUI(): void {
  ctx.fillStyle = "black";
  ctx.font = `bold ${Math.floor(c.height / 25)}px Arial`;
  ctx.fillText(`Generation: ${gen}`, c.width / 50, c.height / 10);
  ctx.fillText(`Alive: ${birds.length - deadBirds.length}`, c.width / 50, c.height / 5);
  ctx.fillText(`Pillars Passed: ${pillarsPassed}`, c.width / 50, c.height / 3);
}

for (let i = 0; i < 1000; i++) birds.push(new Bird()); //initial population
setInterval(update, 1000 / 60);