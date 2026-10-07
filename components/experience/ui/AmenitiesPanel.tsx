'use client';

import { motion } from 'motion/react';
import { ChevronUp } from 'lucide-react';
import { useState } from 'react';

export type AmenityCard = { id: string; title: string; text: string; image: string };

export default function AmenitiesPanel({ items, focus, onFocus }: { items: AmenityCard[]; focus: string | null; onFocus: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.aside
      data-ui
      initial={{ x: '104%', opacity: 0.4 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '104%', opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: 'spring', stiffness: 170, damping: 26 }}
      className={`panel fixed inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-3xl transition-[height] duration-500 md:inset-x-auto md:right-0 md:top-0 md:h-auto md:w-[400px] md:rounded-none md:rounded-l-3xl lg:w-[420px] ${
        expanded ? 'h-[72vh]' : 'h-[132px]'
      }`}
    >
      <button onClick={() => setExpanded((v) => !v)} className="flex w-full justify-center pt-2 text-white/50 md:hidden" aria-label="Toggle amenities">
        <ChevronUp className={`size-5 transition-transform duration-500 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <div className="px-6 pb-4 pt-2 md:pr-28 md:pt-7">
        <h2 className="text-[24px] font-bold text-white md:text-[26px]">Project Amenities</h2>
        <p className="mt-1 text-[14px] text-white/55">Tap an amenity to fly to it</p>
      </div>
      <div className="panel-scroll flex-1 space-y-4 overflow-y-auto px-6 pb-28 md:pb-10">
        {items.map((a, i) => {
          const active = focus === a.id;
          return (
            <motion.button
              key={a.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => onFocus(a.id)}
              className={`group block w-full overflow-hidden rounded-2xl text-left ring-1 transition ${active ? 'ring-amber-300/70' : 'ring-white/10 hover:ring-white/25'}`}
            >
              <span className="relative block aspect-[16/8] overflow-hidden">
                <img src={a.image} alt={a.title} className="absolute inset-0 size-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-3 left-4 text-[16px] font-semibold text-white">{a.title}</span>
              </span>
              <span className={`block px-4 py-3 text-[14px] transition-colors ${active ? 'bg-amber-300/10 text-white/85' : 'bg-white/[0.03] text-white/60'}`}>{a.text}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.aside>
  );
}
