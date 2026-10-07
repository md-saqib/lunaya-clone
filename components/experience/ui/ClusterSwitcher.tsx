'use client';

import { motion } from 'motion/react';
import { LayoutGrid } from 'lucide-react';

export default function ClusterSwitcher({
  items,
  activeId,
  onSelect,
}: {
  items: { id: string; name: string; count: number }[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div data-ui className="glass no-scrollbar flex max-w-[calc(100vw-24px)] items-center gap-1 overflow-x-auto rounded-2xl p-1.5">
      <button
        onClick={() => onSelect(null)}
        className="flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-[14px] text-white/70 transition hover:text-white sm:h-11 sm:px-4 sm:text-[15px]"
      >
        <LayoutGrid className="size-4" />
        Master Plan
      </button>
      <span className="mx-1 h-6 w-px shrink-0 bg-white/10" />
      {items.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`relative flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-[14px] transition sm:h-11 sm:px-4 sm:text-[15px] ${
              active ? 'text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            {active && (
              <motion.span
                layoutId="cluster-switch"
                className="absolute inset-0 rounded-xl bg-emerald-600/80 ring-1 ring-emerald-300/30"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative font-bold">{c.id}</span>
            <span className="relative">· {c.name}</span>
            <span className={`relative text-[12px] ${active ? 'text-emerald-100/80' : 'text-white/40'}`}>{c.count}</span>
          </button>
        );
      })}
    </div>
  );
}
