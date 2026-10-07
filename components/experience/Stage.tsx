'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import type { Camera, View } from './camera';
import { LAYERS, WORLD } from './siteplan';

export type Pin = { id: string; x: number; y: number; anchor?: 'bottom' | 'center'; delay?: number; content: ReactNode };

export type Shape = {
  id: string;
  points: number[];
  className: string;
  delay?: number;
  onEnter?: () => void;
  onLeave?: () => void;
  onClick?: () => void;
};

type Props = {
  camera: Camera;
  bitmaps: (ImageBitmap | null)[];
  shapes: Shape[];
  spotlight: number[][] | null;
  pins: Pin[];
  onInteract?: () => void;
  onBackgroundClick?: () => void;
};

const toPoints = (p: number[]) => {
  let s = '';
  for (let i = 0; i < p.length; i += 2) s += `${p[i]},${p[i + 1]} `;
  return s;
};

const toPath = (p: number[]) => {
  let s = `M${p[0]} ${p[1]}`;
  for (let i = 2; i < p.length; i += 2) s += `L${p[i]} ${p[i + 1]}`;
  return s + 'Z';
};

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function Stage({ camera, bitmaps, shapes, spotlight, pins, onInteract, onBackgroundClick }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pinEls = useRef(new Map<string, { el: HTMLDivElement; x: number; y: number; anchor: string }>());
  const frame = useRef(0);
  const dpr = useRef(1);
  const handlers = useRef({ onInteract, onBackgroundClick });
  useLayoutEffect(() => {
    handlers.current = { onInteract, onBackgroundClick };
  });

  const placePin = useCallback(
    (p: { el: HTMLDivElement; x: number; y: number; anchor: string }) => {
      const [sx, sy] = camera.toScreen(p.x, p.y);
      const shift = p.anchor === 'center' ? 'translate(-50%,-50%)' : 'translate(-50%,-100%)';
      p.el.style.transform = `translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0) ${shift}`;
    },
    [camera],
  );

  const draw = useCallback(() => {
    frame.current = 0;
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    if (!canvas || !svg) return;
    const v: View = camera.view;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const r = dpr.current;
      const cw = canvas.width, ch = canvas.height;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (!drawn.current[0]) ctx.clearRect(0, 0, cw, ch);
      let prevDensity = 0;
      LAYERS.forEach((l, i) => {
        const bmp = drawn.current[i];
        if (!bmp) return;
        const density = bmp.width / (l.width * l.scale);
        const alpha = i === 0 ? 1 : smooth(0.45, 0.85, (v.z * r) / prevDensity);
        prevDensity = density;
        if (alpha <= 0.001) return;
        const k = (l.scale * l.width * v.z * r) / bmp.width;
        const dx = ((l.x - v.x) * v.z + camera.vw / 2) * r;
        const dy = ((l.y - v.y) * v.z + camera.vh / 2) * r;
        const ix0 = Math.max(dx, 0), iy0 = Math.max(dy, 0);
        const ix1 = Math.min(dx + bmp.width * k, cw), iy1 = Math.min(dy + bmp.height * k, ch);
        if (ix1 <= ix0 || iy1 <= iy0) return;
        ctx.globalAlpha = alpha;
        ctx.drawImage(bmp, (ix0 - dx) / k, (iy0 - dy) / k, (ix1 - ix0) / k, (iy1 - iy0) / k, ix0, iy0, ix1 - ix0, iy1 - iy0);
      });
      ctx.globalAlpha = 1;
    }
    const w = camera.vw / v.z, h = camera.vh / v.z;
    svg.setAttribute('viewBox', `${v.x - w / 2} ${v.y - h / 2} ${w} ${h}`);
    svg.style.setProperty('--px', String(1 / v.z));
    for (const p of pinEls.current.values()) placePin(p);
  }, [camera, placePin]);

  const schedule = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(draw);
  }, [draw]);

  // new bitmaps are uploaded to the GPU only while the camera is idle, then swapped in
  const drawn = useRef<(ImageBitmap | null)[]>(LAYERS.map(() => null));
  const pending = useRef<{ i: number; b: ImageBitmap }[]>([]);
  const idleTimer = useRef(0);

  const warmNext = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    const job = pending.current.shift();
    if (!job || !ctx) return;
    ctx.globalAlpha = 0.01;
    ctx.drawImage(job.b, 0, 0, 2, 2);
    ctx.globalAlpha = 1;
    drawn.current[job.i] = job.b;
    schedule();
    if (pending.current.length) idleTimer.current = window.setTimeout(warmNext, 80);
  }, [schedule]);

  const armIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (pending.current.length) idleTimer.current = window.setTimeout(warmNext, 160);
  }, [warmNext]);

  useEffect(() => {
    bitmaps.forEach((b, i) => {
      if (!b || b === drawn.current[i] || pending.current.some((p) => p.b === b)) return;
      if (drawn.current[i]) pending.current.push({ i, b });
      else drawn.current[i] = b;
    });
    schedule();
    armIdle();
  }, [bitmaps, armIdle, schedule]);

  useEffect(() => () => clearTimeout(idleTimer.current), []);

  useLayoutEffect(() => {
    const root = rootRef.current, canvas = canvasRef.current;
    if (!root || !canvas) return;
    const resize = () => {
      const w = root.clientWidth, h = root.clientHeight;
      dpr.current = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr.current);
      canvas.height = Math.round(h * dpr.current);
      camera.resize(w, h);
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);
    const unsub = camera.subscribe(() => {
      schedule();
      armIdle();
    });
    return () => {
      ro.disconnect();
      unsub();
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [camera, draw, schedule, armIdle]);

  // drag, fling, pinch and wheel navigation
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let moved = false;
    let last = { x: 0, y: 0, t: 0 };
    let vel = { x: 0, y: 0 };
    let pinch: { d: number; z: number } | null = null;

    const isUi = (t: EventTarget | null) => t instanceof Element && !!t.closest('[data-ui]');

    const down = (e: PointerEvent) => {
      if (isUi(e.target) || e.button > 0) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        moved = false;
        last = { x: e.clientX, y: e.clientY, t: performance.now() };
        vel = { x: 0, y: 0 };
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: camera.view.z };
        moved = true;
      }
    };

    const move = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const prev = { ...p };
      p.x = e.clientX;
      p.y = e.clientY;
      if (pointers.size === 2 && pinch) {
        const [a, b] = [...pointers.values()];
        const rect = root.getBoundingClientRect();
        const mx = (a.x + b.x) / 2 - rect.left, my = (a.y + b.y) / 2 - rect.top;
        camera.stop();
        camera.panBy((e.clientX - prev.x) / 2, (e.clientY - prev.y) / 2);
        camera.zoomAround(mx, my, pinch.z * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d));
        return;
      }
      if (!moved && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 6) return;
      if (!moved) {
        moved = true;
        camera.stop();
        root.setPointerCapture(e.pointerId);
        root.classList.add('is-dragging');
        handlers.current.onInteract?.();
      }
      const now = performance.now();
      const dt = Math.max(1, now - last.t);
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      vel = { x: vel.x * 0.6 + (dx / dt) * 0.4, y: vel.y * 0.6 + (dy / dt) * 0.4 };
      last = { x: e.clientX, y: e.clientY, t: now };
      camera.panBy(dx, dy);
    };

    const up = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) {
        root.classList.remove('is-dragging');
        if (moved && performance.now() - last.t < 80) camera.fling(vel.x, vel.y);
        if (!moved && !isUi(e.target) && !(e.target instanceof SVGElement && e.target.dataset.shape)) handlers.current.onBackgroundClick?.();
      }
    };

    const wheel = (e: WheelEvent) => {
      if (isUi(e.target)) return;
      e.preventDefault();
      const rect = root.getBoundingClientRect();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const delta = Math.max(-120, Math.min(120, e.deltaY * unit));
      camera.smoothZoom(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-delta * (e.ctrlKey ? 0.01 : 0.0022)));
      handlers.current.onInteract?.();
    };

    const click = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    root.addEventListener('pointerdown', down);
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerup', up);
    root.addEventListener('pointercancel', up);
    root.addEventListener('wheel', wheel, { passive: false });
    root.addEventListener('click', click, true);
    return () => {
      root.removeEventListener('pointerdown', down);
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerup', up);
      root.removeEventListener('pointercancel', up);
      root.removeEventListener('wheel', wheel);
      root.removeEventListener('click', click, true);
    };
  }, [camera]);

  const pinRef = (pin: Pin) => (el: HTMLDivElement | null) => {
    if (!el) {
      pinEls.current.delete(pin.id);
      return;
    }
    const entry = { el, x: pin.x, y: pin.y, anchor: pin.anchor ?? 'bottom' };
    pinEls.current.set(pin.id, entry);
    placePin(entry);
  };

  // keep positions current when a pin's anchor changes without remounting
  useLayoutEffect(() => {
    for (const pin of pins) {
      const e = pinEls.current.get(pin.id);
      if (e && (e.x !== pin.x || e.y !== pin.y)) {
        e.x = pin.x;
        e.y = pin.y;
        placePin(e);
      }
    }
  }, [pins, placePin]);

  const dimPath = spotlight
    ? `M-10 -10H${WORLD.width + 10}V${WORLD.height + 10}H-10Z` + spotlight.map(toPath).join('')
    : `M-10 -10H${WORLD.width + 10}V${WORLD.height + 10}H-10Z`;

  return (
    <div ref={rootRef} className="stage fixed inset-0 overflow-hidden bg-[#0b0d0c] touch-none select-none">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <svg ref={svgRef} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
        <path d={dimPath} fillRule="evenodd" className={`stage-dim ${spotlight ? 'is-on' : ''}`} />
        {shapes.map((s) => (
          <polygon
            key={s.id}
            data-shape={s.id}
            points={toPoints(s.points)}
            pathLength={1}
            className={s.className}
            style={s.delay !== undefined ? ({ '--d': `${s.delay}ms` } as React.CSSProperties) : undefined}
            onPointerEnter={s.onEnter}
            onPointerLeave={s.onLeave}
            onClick={s.onClick}
          />
        ))}
      </svg>
      <div className="stage-vignette pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {pins.map((pin) => (
            <div key={pin.id} ref={pinRef(pin)} className="absolute left-0 top-0 will-change-transform">
              <motion.div
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 6, filter: 'blur(4px)', transition: { duration: 0.25 } }}
                transition={{ duration: 0.6, delay: pin.delay ?? 0, ease: [0.22, 1, 0.36, 1] }}
              >
                {pin.content}
              </motion.div>
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
