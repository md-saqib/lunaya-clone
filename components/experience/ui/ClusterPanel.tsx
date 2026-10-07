'use client';

import { motion } from 'motion/react';
import { ChevronUp, Expand, MapPin } from 'lucide-react';
import { useState } from 'react';
import { formatCr } from '../format';
import type { Cluster, ClusterAmenity, Unit } from '../types';

const item = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.18 + i * 0.07, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } }),
};

export default function ClusterPanel({
  cluster,
  units,
  availableOnly,
  onAvailableOnly,
  onAmenity,
  amenitiesRef,
}: {
  cluster: Cluster;
  units: Unit[];
  availableOnly: boolean;
  onAvailableOnly: (v: boolean) => void;
  onAmenity: (a: ClusterAmenity) => void;
  amenitiesRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [expanded, setExpanded] = useState(false);
  const count = (s: Unit['status']) => units.filter((u) => u.status === s).length;
  const from = Math.min(...units.filter((u) => u.status !== 'sold').map((u) => u.price));

  return (
    <motion.aside
      data-ui
      initial={{ x: '104%', opacity: 0.4 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '104%', opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: 'spring', stiffness: 170, damping: 26, mass: 0.9 }}
      className={`panel fixed inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-3xl md:inset-x-auto md:bottom-0 md:right-0 md:top-0 md:w-[400px] md:rounded-none md:rounded-l-3xl lg:w-[420px] ${
        expanded ? 'h-[72vh]' : 'h-[132px]'
      } transition-[height] duration-500 md:h-auto`}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-center pt-2 text-white/50 md:hidden"
        aria-label={expanded ? 'Collapse details' : 'Expand details'}
      >
        <ChevronUp className={`size-5 transition-transform duration-500 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <div className="px-6 pb-4 pt-2 md:pt-7 md:pr-28">
        <motion.h2 custom={0} variants={item} initial="hidden" animate="show" className="text-[22px] font-bold leading-tight text-white md:text-[26px]">
          Cluster {cluster.id} — {cluster.name}
        </motion.h2>
        <motion.div custom={1} variants={item} initial="hidden" animate="show" className="mt-2 flex flex-wrap items-center gap-2">
          <span className="badge-type">{cluster.typeName}</span>
          <span className="text-[13px] text-white/55">{cluster.typeLabel}</span>
        </motion.div>
      </div>

      <div className="panel-scroll flex-1 overflow-y-auto px-6 pb-28 md:pb-10">
        <motion.dl custom={2} variants={item} initial="hidden" animate="show" className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
          <Row label="Units" value={units.length} strong />
          <Row label="Available" value={count('available')} tone="text-emerald-300" />
          <Row label="Reserved" value={count('reserved')} tone="text-amber-300" />
          <Row label="Sold" value={count('sold')} tone="text-rose-300" />
          {Number.isFinite(from) && <Row label="Starting from" value={formatCr(from)} strong />}
        </motion.dl>

        <motion.p custom={3} variants={item} initial="hidden" animate="show" className="mt-5 text-[15px] leading-7 text-white/70">
          {cluster.description}
        </motion.p>

        <motion.label custom={4} variants={item} initial="hidden" animate="show" className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/[0.06]">
          <span className="text-[14px] text-white/80">Show available homes only</span>
          <input type="checkbox" className="peer sr-only" checked={availableOnly} onChange={(e) => onAvailableOnly(e.target.checked)} />
          <span className="relative h-6 w-11 rounded-full bg-white/15 transition peer-checked:bg-emerald-500 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
        </motion.label>

        <motion.div custom={5} variants={item} initial="hidden" animate="show" className="mt-6">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/45">Home features</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {cluster.features.map((f) => (
              <span key={f} className="chip">{f}</span>
            ))}
          </div>
        </motion.div>

        <div ref={amenitiesRef} className="scroll-mt-4 pt-7">
          <motion.h3 custom={6} variants={item} initial="hidden" animate="show" className="flex items-center gap-2 text-[17px] font-semibold text-white">
            <MapPin className="size-[18px] text-white/70" />
            Cluster Amenities
          </motion.h3>
          <div className="mt-4 space-y-4">
            {cluster.amenities.map((a, i) => (
              <motion.button
                key={a.title}
                custom={7 + i}
                variants={item}
                initial="hidden"
                animate="show"
                onClick={() => onAmenity(a)}
                className="group relative block aspect-[16/9] w-full overflow-hidden rounded-2xl ring-1 ring-white/10"
              >
                <img src={a.image} alt={a.title} className="absolute inset-0 size-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white ring-1 ring-white/30 backdrop-blur-sm transition group-hover:scale-110 group-hover:bg-black/60">
                  <Expand className="size-5" />
                </span>
                <span className="absolute bottom-3 left-4 text-[15px] font-semibold text-white">{a.title}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

function Row({ label, value, tone, strong }: { label: string; value: string | number; tone?: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <dt className="text-[16px] text-white/65">{label}</dt>
      <dd className={`text-[17px] ${strong ? 'font-semibold text-white' : tone ?? 'text-white'}`}>{value}</dd>
    </div>
  );
}
