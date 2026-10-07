'use client';

import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

export default function Sheet({
  title,
  subtitle,
  side = 'center',
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  side?: 'center' | 'right';
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const right = side === 'right';
  return (
    <motion.div
      data-ui
      className={`fixed inset-0 z-40 flex ${right ? 'items-end justify-end sm:items-stretch' : 'items-end justify-center sm:items-center sm:p-6'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.05 } }}
    >
      <motion.div className="modal-backdrop absolute inset-0" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.section
        className={`panel relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[28px] ${
          right ? 'sm:max-h-none sm:w-[440px] sm:rounded-none sm:rounded-l-[28px]' : 'sm:max-w-[920px] sm:rounded-[28px]'
        }`}
        initial={right ? { x: 60, opacity: 0 } : { y: 40, opacity: 0, scale: 0.97 }}
        animate={right ? { x: 0, opacity: 1 } : { y: 0, opacity: 1, scale: 1 }}
        exit={right ? { x: 60, opacity: 0 } : { y: 30, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
      >
        <header className="flex items-start justify-between gap-4 px-6 pb-4 pt-6 sm:px-8">
          <div>
            <h2 className="text-[24px] font-bold text-white">{title}</h2>
            {subtitle && <p className="mt-1 text-[14px] text-white/55">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="grid size-10 shrink-0 place-items-center rounded-full bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10">
            <X className="size-5" />
          </button>
        </header>
        <div className="panel-scroll flex-1 overflow-y-auto px-6 pb-8 sm:px-8">{children}</div>
      </motion.section>
    </motion.div>
  );
}
