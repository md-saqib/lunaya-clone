'use client';

import { motion } from 'motion/react';
import { ChevronLeft, Info, Maximize, Minimize, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Compass() {
  return (
    <div className="glass flex size-14 flex-col items-center justify-center rounded-2xl sm:size-[72px]">
      <span className="h-0 w-0 border-x-[6px] border-b-[9px] border-x-transparent border-b-rose-500" />
      <span className="mt-0.5 text-lg font-bold leading-none text-white sm:text-xl">N</span>
    </div>
  );
}

export function BackButton({ label = 'Back', onClick }: { label?: string; onClick: () => void }) {
  return (
    <motion.button
      data-ui
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="glass group flex h-11 items-center gap-1.5 rounded-full pl-3 pr-5 text-[15px] font-medium text-white transition-colors hover:bg-white/15"
    >
      <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      {label}
    </motion.button>
  );
}

export function ZoomControl({ level, onIn, onOut, onLevel }: { level: number; onIn: () => void; onOut: () => void; onLevel: (i: number) => void }) {
  const active = Math.round(level);
  return (
    <div data-ui className="glass flex w-12 flex-col items-center gap-1 rounded-2xl py-2 sm:w-14">
      <button onClick={onIn} aria-label="Zoom in" className="grid size-10 place-items-center rounded-xl text-white/90 transition hover:bg-white/10">
        <Plus className="size-5" />
      </button>
      {[2, 1, 0].map((i) => (
        <button key={i} onClick={() => onLevel(i)} aria-label={`Zoom level ${i + 1}`} className="grid size-8 place-items-center">
          <span
            className={`rounded-full transition-all duration-500 ${active === i ? 'size-3 bg-white shadow-[0_0_12px_rgba(255,255,255,.8)]' : 'size-1.5 bg-white/45'}`}
          />
        </button>
      ))}
      <button onClick={onOut} aria-label="Zoom out" className="grid size-10 place-items-center rounded-xl text-white/90 transition hover:bg-white/10">
        <Minus className="size-5" />
      </button>
    </div>
  );
}

export function FullscreenButton() {
  const [full, setFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };
  return (
    <button data-ui onClick={toggle} aria-label="Toggle fullscreen" className="glass grid size-12 place-items-center rounded-2xl text-white transition hover:bg-white/15">
      {full ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
    </button>
  );
}

export function InfoButton({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button
      data-ui
      onClick={onClick}
      aria-label="How to explore"
      className={`info-ring grid size-12 place-items-center rounded-full border-2 text-emerald-300 transition sm:size-14 ${
        active ? 'border-emerald-300 bg-emerald-500/30' : 'border-emerald-400/70 bg-emerald-500/15 hover:bg-emerald-500/25'
      }`}
    >
      <Info className="size-5 sm:size-6" />
    </button>
  );
}
