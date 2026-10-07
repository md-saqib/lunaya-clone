'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Hand, MousePointerClick, Move, Pause, X, ZoomIn } from 'lucide-react';
import { useEffect } from 'react';
import { asset } from '@/lib/asset';
import Sheet from './Sheet';

export function Loader({ progress, project }: { progress: number; project: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#070908]"
      exit={{ opacity: 0, transition: { duration: 1.1, ease: [0.4, 0, 0.2, 1] } }}
    >
      <div className="loader-bg absolute inset-0" style={{ backgroundImage: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(16,185,129,.12), transparent 70%), url(${asset('/aerial/zoom-1-lq.webp')})` }} />
      <motion.p
        initial={{ opacity: 0, letterSpacing: '0.6em' }}
        animate={{ opacity: 1, letterSpacing: '0.32em' }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative font-display text-[34px] uppercase text-white sm:text-[52px]"
      >
        {project}
      </motion.p>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }} className="relative mt-3 text-[12px] uppercase tracking-[0.4em] text-white/45">
        Interactive Master Plan
      </motion.p>
      <div className="relative mt-12 h-px w-56 overflow-hidden bg-white/10">
        <motion.div className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-200" animate={{ width: `${Math.round(progress * 100)}%` }} transition={{ ease: 'easeOut', duration: 0.4 }} />
      </div>
      <p className="relative mt-4 text-[12px] tabular-nums tracking-[0.2em] text-white/40">{Math.round(progress * 100)}%</p>
    </motion.div>
  );
}

export function IntroTitle({ project, tagline }: { project: string; tagline: string }) {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-center text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)', transition: { duration: 1.2 } }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,.45),rgba(0,0,0,.15)_60%,transparent)]" />
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative text-[12px] uppercase tracking-[0.5em] text-white/75"
      >
        Welcome to
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 24, letterSpacing: '0.4em' }}
        animate={{ opacity: 1, y: 0, letterSpacing: '0.18em' }}
        transition={{ duration: 1.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-3 font-display text-[44px] uppercase leading-none text-white drop-shadow-[0_4px_30px_rgba(0,0,0,.6)] sm:text-[84px]"
      >
        {project}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.6 }}
        className="relative mt-5 font-display text-[18px] italic text-white/85 sm:text-[24px]"
      >
        {tagline}
      </motion.p>
    </motion.div>
  );
}

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [message, onDone]);
  return (
    <motion.div
      data-ui
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      className="glass-strong pointer-events-none fixed left-1/2 top-6 z-[70] -translate-x-1/2 rounded-full px-5 py-3 text-[14px] font-medium text-white"
    >
      {message}
    </motion.div>
  );
}

export function Lightbox({ image, title, text, onClose }: { image: string; title: string; text?: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <motion.div data-ui className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="modal-backdrop absolute inset-0" onClick={onClose} />
      <motion.figure
        className="relative w-full max-w-5xl overflow-hidden rounded-[28px] ring-1 ring-white/10"
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 10 }}
        transition={{ type: 'spring', stiffness: 200, damping: 26 }}
      >
        <motion.img src={image} alt={title} className="aspect-[16/9] w-full object-cover" initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 6, ease: 'linear' }} />
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-6 pt-20 sm:p-8 sm:pt-24">
          <h3 className="text-[24px] font-bold text-white sm:text-[30px]">{title}</h3>
          {text && <p className="mt-1 max-w-xl text-[15px] text-white/75">{text}</p>}
        </figcaption>
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-black/40 text-white ring-1 ring-white/20 backdrop-blur">
          <X className="size-5" />
        </button>
      </motion.figure>
    </motion.div>
  );
}

export function InfoSheet({ onClose }: { onClose: () => void }) {
  const tips = [
    { icon: MousePointerClick, title: 'Click a cluster', text: 'Fly into any highlighted cluster to see every home.' },
    { icon: Move, title: 'Drag to look around', text: 'Pan across the master plan; it glides when you let go.' },
    { icon: ZoomIn, title: 'Scroll or pinch to zoom', text: 'Sharper renders fade in as you get closer.' },
    { icon: Hand, title: 'Tap a home', text: 'Open its price, areas and features, then reserve or compare.' },
  ];
  const legend = [
    { c: 'bg-emerald-400', t: 'Available' },
    { c: 'bg-amber-400', t: 'Reserved' },
    { c: 'bg-rose-400', t: 'Sold' },
  ];
  return (
    <Sheet title="How to explore" onClose={onClose} side="right">
      <ul className="space-y-3">
        {tips.map((t, i) => (
          <motion.li
            key={t.title}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="flex gap-4 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/[0.06]"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300">
              <t.icon className="size-5" />
            </span>
            <span>
              <span className="block text-[15px] font-semibold text-white">{t.title}</span>
              <span className="block text-[14px] text-white/60">{t.text}</span>
            </span>
          </motion.li>
        ))}
      </ul>
      <h3 className="mt-8 text-[13px] font-semibold uppercase tracking-[0.14em] text-white/45">Legend</h3>
      <div className="mt-3 flex flex-wrap gap-4">
        {legend.map((l) => (
          <span key={l.t} className="flex items-center gap-2 text-[14px] text-white/75">
            <span className={`size-2.5 rounded-full ${l.c}`} /> {l.t}
          </span>
        ))}
      </div>
    </Sheet>
  );
}

export function TourCaption({ step, total, title, text, onStop }: { step: number; total: number; title: string; text: string; onStop: () => void }) {
  return (
    <motion.div
      data-ui
      className="pointer-events-none fixed inset-x-0 top-0 z-20 flex flex-col items-center px-4 pt-6 sm:pt-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1 rounded-full transition-all duration-700 ${i === step ? 'w-8 bg-white' : i < step ? 'w-3 bg-white/60' : 'w-3 bg-white/25'}`} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 text-center"
        >
          <h2 className="font-display text-[34px] leading-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,.6)] sm:text-[52px]">{title}</h2>
          <p className="mt-2 text-[15px] text-white/85 drop-shadow-[0_1px_8px_rgba(0,0,0,.7)] sm:text-[17px]">{text}</p>
        </motion.div>
      </AnimatePresence>
      <button onClick={onStop} className="glass pointer-events-auto mt-6 flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium text-white transition hover:bg-white/15">
        <Pause className="size-4" /> End tour
      </button>
    </motion.div>
  );
}
