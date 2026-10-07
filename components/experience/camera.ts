import { WORLD } from './siteplan';

export type View = { x: number; y: number; z: number };
export type Box = { x0: number; y0: number; x1: number; y1: number };
export type Inset = { top: number; right: number; bottom: number; left: number };

type Listener = (v: View) => void;
type FlyOptions = { duration?: number; rho?: number; ease?: (t: number) => number };

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeInOutQuint = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);

export function polyBox(polys: number[][]): Box {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of polys) {
    for (let i = 0; i < p.length; i += 2) {
      x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]);
      y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]);
    }
  }
  return { x0, y0, x1, y1 };
}

// van Wijk & Nuij smooth zoom-pan path over views expressed as [cx, cy, visibleWidth]
function zoomPath(p0: [number, number, number], p1: [number, number, number], rho: number) {
  const [ux0, uy0, w0] = p0;
  const [ux1, uy1, w1] = p1;
  const dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy;
  const rho2 = rho * rho, rho4 = rho2 * rho2;
  if (d2 < 1e-6) {
    const S = Math.log(w1 / w0) / rho;
    return { S, at: (t: number) => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S)] as const };
  }
  const d1 = Math.sqrt(d2);
  const b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1);
  const b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
  const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const S = (r1 - r0) / rho;
  return {
    S,
    at: (t: number) => {
      const s = t * S;
      const coshr0 = Math.cosh(r0);
      const u = (w0 / (rho2 * d1)) * (coshr0 * Math.tanh(rho * s + r0) - Math.sinh(r0));
      return [ux0 + u * dx, uy0 + u * dy, (w0 * coshr0) / Math.cosh(rho * s + r0)] as const;
    },
  };
}

export class Camera {
  view: View = { x: WORLD.width / 2, y: WORLD.height / 2, z: 0.5 };
  vw = 1;
  vh = 1;
  maxZ = 3.2;
  flying = false;

  private listeners = new Set<Listener>();
  private raf = 0;
  private cancelFlight: (() => void) | null = null;
  private zoomTarget: { z: number; sx: number; sy: number } | null = null;
  private glide: { vx: number; vy: number; t: number } | null = null;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn(this.view);
    return () => void this.listeners.delete(fn);
  }

  private emit() {
    for (const fn of this.listeners) fn(this.view);
  }

  resize(w: number, h: number) {
    this.vw = Math.max(1, w);
    this.vh = Math.max(1, h);
    this.set(this.view);
  }

  minZ() {
    return Math.max(this.vw / WORLD.width, this.vh / WORLD.height);
  }

  clamp(v: View): View {
    const z = Math.min(this.maxZ, Math.max(this.minZ(), v.z));
    const hw = this.vw / (2 * z), hh = this.vh / (2 * z);
    return {
      z,
      x: Math.min(WORLD.width - hw, Math.max(hw, v.x)),
      y: Math.min(WORLD.height - hh, Math.max(hh, v.y)),
    };
  }

  set(v: View) {
    this.view = this.clamp(v);
    this.emit();
  }

  toScreen(x: number, y: number): [number, number] {
    const { view: v } = this;
    return [(x - v.x) * v.z + this.vw / 2, (y - v.y) * v.z + this.vh / 2];
  }

  toWorld(sx: number, sy: number): [number, number] {
    const { view: v } = this;
    return [(sx - this.vw / 2) / v.z + v.x, (sy - this.vh / 2) / v.z + v.y];
  }

  // view that fits a world box inside the screen minus UI insets
  frame(box: Box, inset: Inset, opts: { pad?: number; maxZ?: number } = {}): View {
    const pad = opts.pad ?? 0.1;
    const aw = Math.max(80, this.vw - inset.left - inset.right);
    const ah = Math.max(80, this.vh - inset.top - inset.bottom);
    const bw = box.x1 - box.x0, bh = box.y1 - box.y0;
    let z = Math.min(aw / bw, ah / bh) * (1 - pad);
    z = Math.min(z, opts.maxZ ?? this.maxZ);
    const acx = inset.left + aw / 2, acy = inset.top + ah / 2;
    return this.clamp({
      z,
      x: (box.x0 + box.x1) / 2 - (acx - this.vw / 2) / z,
      y: (box.y0 + box.y1) / 2 - (acy - this.vh / 2) / z,
    });
  }

  stop() {
    this.cancelFlight?.();
    this.cancelFlight = null;
    this.zoomTarget = null;
    this.glide = null;
    cancelAnimationFrame(this.raf);
    this.flying = false;
  }

  flyTo(target: View, opts: FlyOptions = {}): Promise<boolean> {
    this.stop();
    const to = this.clamp(target);
    const from = this.view;
    const path = zoomPath([from.x, from.y, this.vw / from.z], [to.x, to.y, this.vw / to.z], opts.rho ?? 1.25);
    const natural = (Math.abs(path.S) * 1000 * (opts.rho ?? 1.25)) / Math.SQRT2;
    const duration = opts.duration ?? Math.min(2600, Math.max(1100, natural * 0.85));
    const ease = opts.ease ?? easeInOutCubic;
    this.flying = true;
    return new Promise((resolve) => {
      const t0 = performance.now();
      let done = false;
      this.cancelFlight = () => {
        if (!done) {
          done = true;
          resolve(false);
        }
      };
      const step = (now: number) => {
        if (done) return;
        const t = Math.min(1, (now - t0) / duration);
        const [x, y, w] = path.at(ease(t));
        this.view = this.clamp({ x, y, z: this.vw / w });
        this.emit();
        if (t < 1) this.raf = requestAnimationFrame(step);
        else {
          done = true;
          this.flying = false;
          this.cancelFlight = null;
          this.set(to);
          resolve(true);
        }
      };
      this.raf = requestAnimationFrame(step);
    });
  }

  panBy(dx: number, dy: number) {
    const v = this.view;
    this.set({ ...v, x: v.x - dx / v.z, y: v.y - dy / v.z });
  }

  zoomAround(sx: number, sy: number, z: number) {
    const [wx, wy] = this.toWorld(sx, sy);
    const nz = Math.min(this.maxZ, Math.max(this.minZ(), z));
    this.set({ z: nz, x: wx - (sx - this.vw / 2) / nz, y: wy - (sy - this.vh / 2) / nz });
  }

  // eased zoom toward a target scale, anchored at a screen point (wheel, buttons)
  smoothZoom(sx: number, sy: number, factor: number) {
    if (this.cancelFlight) this.stop();
    this.glide = null;
    const base = this.zoomTarget?.z ?? this.view.z;
    const z = Math.min(this.maxZ, Math.max(this.minZ(), base * factor));
    const running = this.zoomTarget !== null;
    this.zoomTarget = { z, sx, sy };
    if (running) return;
    const step = () => {
      const t = this.zoomTarget;
      if (!t) return;
      const cur = this.view.z;
      const next = cur + (t.z - cur) * 0.2;
      if (Math.abs(t.z - next) / t.z < 0.002) {
        this.zoomAround(t.sx, t.sy, t.z);
        this.zoomTarget = null;
        return;
      }
      this.zoomAround(t.sx, t.sy, next);
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  // momentum after a drag, velocity in screen px per ms
  fling(vx: number, vy: number) {
    if (Math.hypot(vx, vy) < 0.05) return;
    this.glide = { vx, vy, t: performance.now() };
    const step = (now: number) => {
      const g = this.glide;
      if (!g) return;
      const dt = Math.min(32, now - g.t);
      g.t = now;
      this.panBy(g.vx * dt, g.vy * dt);
      const decay = Math.pow(0.94, dt / 16);
      g.vx *= decay;
      g.vy *= decay;
      if (Math.hypot(g.vx, g.vy) < 0.01) {
        this.glide = null;
        return;
      }
      this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }
}
