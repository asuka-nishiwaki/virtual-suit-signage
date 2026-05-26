/** 2D Verlet 布シミュレーション（Canvas描画用） */
export interface SimParams {
  gravity: number;
  damping: number;
  constraintIterations: number;
  segmentsX: number;
  segmentsY: number;
}

export class SimParticle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  pinned: boolean;

  constructor(x: number, y: number, pinned = false) {
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.pinned = pinned;
  }

  update(gravity: number, damping: number) {
    if (this.pinned) return;
    const vx = (this.x - this.prevX) * damping;
    const vy = (this.y - this.prevY) * damping;
    this.prevX = this.x;
    this.prevY = this.y;
    this.x += vx;
    this.y += vy + gravity;
  }
}

export class SimConstraint {
  p1: SimParticle;
  p2: SimParticle;
  restLength: number;

  constructor(p1: SimParticle, p2: SimParticle) {
    this.p1 = p1;
    this.p2 = p2;
    this.restLength = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  solve() {
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    const diff = (this.restLength - dist) / dist;
    const ox = dx * diff * 0.5;
    const oy = dy * diff * 0.5;
    if (!this.p1.pinned) {
      this.p1.x -= ox;
      this.p1.y -= oy;
    }
    if (!this.p2.pinned) {
      this.p2.x += ox;
      this.p2.y += oy;
    }
  }
}

export class ClothSimulation2D {
  particles: SimParticle[] = [];
  constraints: SimConstraint[] = [];
  cols = 0;
  rows = 0;
  private params: SimParams;

  constructor(
    params: SimParams = {
      gravity: 0.35,
      damping: 0.97,
      constraintIterations: 4,
      segmentsX: 8,
      segmentsY: 10,
    }
  ) {
    this.params = params;
  }

  initJacketPanel(
    topLeft: { x: number; y: number },
    topRight: { x: number; y: number },
    bottomLeft: { x: number; y: number },
    bottomRight: { x: number; y: number }
  ) {
    this.particles = [];
    this.constraints = [];
    const sx = this.params.segmentsX;
    const sy = this.params.segmentsY;
    this.cols = sx + 1;
    this.rows = sy + 1;

    for (let j = 0; j <= sy; j++) {
      const t = j / sy;
      const leftX = topLeft.x + (bottomLeft.x - topLeft.x) * t;
      const leftY = topLeft.y + (bottomLeft.y - topLeft.y) * t;
      const rightX = topRight.x + (bottomRight.x - topRight.x) * t;
      const rightY = topRight.y + (bottomRight.y - topRight.y) * t;

      for (let i = 0; i <= sx; i++) {
        const u = i / sx;
        const x = leftX + (rightX - leftX) * u;
        const y = leftY + (rightY - leftY) * u;
        const pinned = j === 0 && (i === 0 || i === sx);
        this.particles.push(new SimParticle(x, y, pinned));
      }
    }

    for (let j = 0; j <= sy; j++) {
      for (let i = 0; i <= sx; i++) {
        const idx = j * this.cols + i;
        if (i < sx) this.constraints.push(new SimConstraint(this.particles[idx], this.particles[idx + 1]));
        if (j < sy) this.constraints.push(new SimConstraint(this.particles[idx], this.particles[idx + this.cols]));
      }
    }
  }

  pinShoulders(left: { x: number; y: number }, right: { x: number; y: number }) {
    if (this.particles.length === 0) return;
    this.particles[0].x = left.x;
    this.particles[0].y = left.y;
    this.particles[0].prevX = left.x;
    this.particles[0].prevY = left.y;
    const rightIdx = this.cols - 1;
    this.particles[rightIdx].x = right.x;
    this.particles[rightIdx].y = right.y;
    this.particles[rightIdx].prevX = right.x;
    this.particles[rightIdx].prevY = right.y;
  }

  simulate(steps = 3) {
    for (let s = 0; s < steps; s++) {
      this.particles.forEach((p) => p.update(this.params.gravity, this.params.damping));
      for (let i = 0; i < this.params.constraintIterations; i++) {
        this.constraints.forEach((c) => c.solve());
      }
    }
  }

  drawWrinkles(ctx: CanvasRenderingContext2D, color: string, alpha = 0.15) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1;

    for (let j = 0; j < this.rows - 1; j++) {
      ctx.beginPath();
      for (let i = 0; i < this.cols; i++) {
        const p = this.particles[j * this.cols + i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    for (let i = 0; i < this.cols - 1; i++) {
      ctx.beginPath();
      for (let j = 0; j < this.rows; j++) {
        const p = this.particles[j * this.cols + i];
        if (j === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}
