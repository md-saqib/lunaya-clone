'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Heart, Scale, Trash2, X } from 'lucide-react';
import { formatArea, formatCr } from '../format';
import type { Cluster, Unit } from '../types';
import Sheet from './Sheet';

const statusText = { available: 'Available', reserved: 'Reserved', sold: 'Sold' };

export function FavoritesSheet({
  units,
  clusters,
  onOpen,
  onRemove,
  onClose,
}: {
  units: Unit[];
  clusters: Cluster[];
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const byId = Object.fromEntries(clusters.map((c) => [c.id, c]));
  return (
    <Sheet title="Favorites" subtitle={units.length ? `${units.length} saved homes` : undefined} side="right" onClose={onClose}>
      {!units.length && (
        <Empty icon={Heart} text="Tap the heart on any villa to save it here." />
      )}
      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {units.map((u) => (
            <motion.li key={u.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40, height: 0 }}>
              <div className="group flex items-center gap-4 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/[0.06] transition hover:bg-white/[0.07]">
                <button onClick={() => onOpen(u.id)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                  <img src={byId[u.clusterId]?.hero} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" />
                  <span className="min-w-0">
                    <span className="block text-[16px] font-semibold text-white">Villa {u.id}</span>
                    <span className="block truncate text-[13px] text-white/55">
                      {byId[u.clusterId]?.name} · {u.bedrooms} BHK · {statusText[u.status]}
                    </span>
                    <span className="block text-[14px] font-semibold text-emerald-300">{formatCr(u.price)}</span>
                  </span>
                </button>
                <button onClick={() => onRemove(u.id)} aria-label="Remove" className="grid size-9 place-items-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-rose-300">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </Sheet>
  );
}

export function CompareSheet({
  units,
  clusters,
  onOpen,
  onRemove,
  onClose,
}: {
  units: Unit[];
  clusters: Cluster[];
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const byId = Object.fromEntries(clusters.map((c) => [c.id, c]));
  const rows: { label: string; get: (u: Unit) => string; best?: (us: Unit[]) => string }[] = [
    { label: 'Price', get: (u) => formatCr(u.price), best: (us) => formatCr(Math.min(...us.map((u) => u.price))) },
    { label: 'Price / sq ft', get: (u) => `₹${Math.round(u.price / u.builtUp).toLocaleString('en-IN')}` },
    { label: 'Bedrooms', get: (u) => `${u.bedrooms} BHK` },
    { label: 'Built-up area', get: (u) => formatArea(u.builtUp), best: (us) => formatArea(Math.max(...us.map((u) => u.builtUp))) },
    { label: 'Plot area', get: (u) => formatArea(u.plot), best: (us) => formatArea(Math.max(...us.map((u) => u.plot))) },
    { label: 'Floors', get: (u) => u.floors },
    { label: 'Bathrooms', get: (u) => String(u.bathrooms) },
    { label: 'Facing', get: (u) => u.view },
    { label: 'Status', get: (u) => statusText[u.status] },
  ];
  return (
    <Sheet title="Compare" subtitle="Up to three homes side by side" onClose={onClose}>
      {units.length < 1 ? (
        <Empty icon={Scale} text="Add homes from the villa card using Compare." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                <th className="w-36" />
                {units.map((u) => (
                  <th key={u.id} className="px-3 pb-4 align-top font-normal">
                    <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
                      <img src={byId[u.clusterId]?.hero} alt="" className="h-28 w-full object-cover" />
                      <button onClick={() => onRemove(u.id)} aria-label="Remove" className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/50 text-white backdrop-blur">
                        <X className="size-4" />
                      </button>
                    </div>
                    <button onClick={() => onOpen(u.id)} className="mt-3 text-[18px] font-bold text-white hover:text-emerald-300">
                      Villa {u.id}
                    </button>
                    <p className="text-[13px] text-white/50">{byId[u.clusterId]?.name}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const best = r.best && units.length > 1 ? r.best(units) : null;
                return (
                  <tr key={r.label}>
                    <td className="border-t border-white/[0.06] py-3 pr-3 text-[14px] text-white/50">{r.label}</td>
                    {units.map((u) => {
                      const v = r.get(u);
                      return (
                        <td key={u.id} className={`border-t border-white/[0.06] px-3 py-3 text-[15px] ${best === v ? 'font-semibold text-emerald-300' : 'text-white/85'}`}>
                          {v}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Sheet>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Heart; text: string }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-white/5 text-white/40 ring-1 ring-white/10">
        <Icon className="size-7" />
      </span>
      <p className="mt-4 max-w-xs text-white/55">{text}</p>
    </div>
  );
}
