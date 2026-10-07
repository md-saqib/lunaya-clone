'use client';

import { motion } from 'motion/react';
import { ArrowDownUp, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatArea, formatCr } from '../format';
import type { Cluster, Unit, UnitStatus } from '../types';
import Sheet from './Sheet';

const dot: Record<UnitStatus, string> = { available: 'bg-emerald-400', reserved: 'bg-amber-400', sold: 'bg-rose-400' };
const label: Record<UnitStatus, string> = { available: 'Available', reserved: 'Reserved', sold: 'Sold' };

export default function ListView({
  units,
  clusters,
  initialCluster,
  onOpen,
  onClose,
}: {
  units: Unit[];
  clusters: Cluster[];
  initialCluster: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
}) {
  const [cluster, setCluster] = useState<string | null>(initialCluster);
  const [status, setStatus] = useState<'all' | UnitStatus>('all');
  const [asc, setAsc] = useState(true);

  const rows = useMemo(
    () =>
      units
        .filter((u) => (!cluster || u.clusterId === cluster) && (status === 'all' || u.status === status))
        .sort((a, b) => (asc ? a.price - b.price : b.price - a.price)),
    [units, cluster, status, asc],
  );
  const byId = Object.fromEntries(clusters.map((c) => [c.id, c]));

  return (
    <Sheet title="List View" subtitle={`${rows.length} homes`} onClose={onClose}>
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-2 bg-[#141716]/95 px-1 pb-4 backdrop-blur">
        <Chip active={!cluster} onClick={() => setCluster(null)}>All clusters</Chip>
        {clusters.map((c) => (
          <Chip key={c.id} active={cluster === c.id} onClick={() => setCluster(c.id)}>
            {c.id} · {c.name}
          </Chip>
        ))}
        <span className="mx-1 h-5 w-px bg-white/10" />
        {(['all', 'available', 'reserved', 'sold'] as const).map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
            {s === 'all' ? 'Any status' : label[s]}
          </Chip>
        ))}
        <button onClick={() => setAsc((v) => !v)} className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-white/70 ring-1 ring-white/10 transition hover:text-white">
          <ArrowDownUp className="size-3.5" /> Price {asc ? 'low → high' : 'high → low'}
        </button>
      </div>

      <div className="hidden grid-cols-[1.1fr_1.4fr_0.8fr_1.1fr_1.3fr_1fr_24px] gap-3 border-b border-white/[0.07] px-3 pb-2 text-[12px] uppercase tracking-[0.12em] text-white/40 md:grid">
        <span>Villa</span>
        <span>Cluster</span>
        <span>Type</span>
        <span>Built-up</span>
        <span>View</span>
        <span className="text-right">Price</span>
        <span />
      </div>
      <ul>
        {rows.map((u, i) => (
          <motion.li
            key={u.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 18) * 0.025, duration: 0.35 }}
          >
            <button
              onClick={() => onOpen(u.id)}
              className="group grid w-full grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-b border-white/[0.05] px-3 py-3.5 text-left transition hover:bg-white/[0.04] md:grid-cols-[1.1fr_1.4fr_0.8fr_1.1fr_1.3fr_1fr_24px]"
            >
              <span className="flex items-center gap-2.5 text-[15px] font-semibold text-white">
                <span className={`size-2 rounded-full ${dot[u.status]}`} title={label[u.status]} />
                {u.id}
              </span>
              <span className="text-right text-[15px] font-semibold text-emerald-300 md:hidden">{formatCr(u.price)}</span>
              <span className="text-[14px] text-white/65 md:text-white/75">{byId[u.clusterId]?.name}</span>
              <span className="text-right text-[13px] text-white/50 md:text-left md:text-[14px] md:text-white/75">{u.bedrooms} BHK</span>
              <span className="hidden text-[14px] text-white/75 md:block">{formatArea(u.builtUp)}</span>
              <span className="hidden text-[14px] text-white/75 md:block">{u.view}</span>
              <span className="hidden text-right text-[15px] font-semibold text-emerald-300 md:block">{formatCr(u.price)}</span>
              <ChevronRight className="hidden size-4 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/70 md:block" />
            </button>
          </motion.li>
        ))}
      </ul>
      {!rows.length && <p className="py-16 text-center text-white/50">No homes match these filters.</p>}
    </Sheet>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-[13px] transition ${active ? 'bg-emerald-500 text-emerald-950 font-semibold' : 'text-white/70 ring-1 ring-white/10 hover:text-white'}`}
    >
      {children}
    </button>
  );
}
