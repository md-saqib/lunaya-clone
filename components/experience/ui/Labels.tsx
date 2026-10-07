'use client';

import { ArrowRight, Home, MapPin } from 'lucide-react';
import type { UnitStatus } from '../types';

export function ClusterLabel({
  code,
  name,
  meta,
  cta,
  active,
  onClick,
  onEnter,
  onLeave,
}: {
  code: string;
  name: string;
  meta: string;
  cta: string;
  active: boolean;
  onClick: () => void;
  onEnter?: () => void;
  onLeave?: () => void;
}) {
  return (
    <button
      data-ui
      onClick={onClick}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      className="pointer-events-auto group flex flex-col items-center gap-1.5 pb-2 outline-none"
    >
      <span className="map-title text-[15px] sm:text-[22px]">{code}</span>
      <span className="map-sub hidden text-[10px] sm:block sm:text-[11px]">{name} · {meta}</span>
      <span
        className={`mt-1 flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_6px_24px_-6px_rgba(16,185,129,.8)] transition-all duration-300 sm:text-[10px] ${
          active ? 'bg-emerald-400 text-emerald-950 scale-105' : 'bg-emerald-500/90 group-hover:bg-emerald-400 group-hover:text-emerald-950'
        }`}
      >
        {cta}
        <ArrowRight className="size-3 transition-transform duration-300 group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

const pillTone: Record<UnitStatus, string> = {
  available: 'bg-emerald-500 text-white shadow-[0_8px_24px_-6px_rgba(16,185,129,.9)]',
  reserved: 'bg-amber-400 text-amber-950 shadow-[0_8px_24px_-6px_rgba(251,191,36,.8)]',
  sold: 'bg-rose-500 text-white shadow-[0_8px_24px_-6px_rgba(244,63,94,.8)]',
};

export function UnitPill({ id, status, hint }: { id: string; status: UnitStatus; hint?: string }) {
  return (
    <div className="flex flex-col items-center pb-1.5">
      <div className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold tracking-wide ${pillTone[status]}`}>
        <Home className="size-3.5" strokeWidth={2.4} />
        {id}
        {hint && <span className="font-medium opacity-80">· {hint}</span>}
      </div>
      <span className={`mt-[-3px] size-2 rotate-45 ${pillTone[status].split(' ')[0]}`} />
    </div>
  );
}

export function ExploreHint() {
  return (
    <div className="glass-strong rounded-full px-4 py-2 text-[13px] font-semibold text-white">
      <span className="hint-pulse mr-2 inline-block size-1.5 rounded-full bg-emerald-400 align-middle" />
      Tap to Explore
    </div>
  );
}

export function PlaceLabel({ title, tone = 'gold', onClick }: { title: string; tone?: 'gold' | 'white'; onClick?: () => void }) {
  return (
    <button
      data-ui
      onClick={onClick}
      className={`flex flex-col items-center ${onClick ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
    >
      <span className="glass-strong flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold tracking-wide text-white">
        <MapPin className={`size-3.5 ${tone === 'gold' ? 'text-amber-300' : 'text-white/80'}`} />
        {title}
      </span>
      <span className="h-5 w-px bg-gradient-to-b from-white/70 to-white/0" />
      <span className={`size-2 rounded-full ring-4 ${tone === 'gold' ? 'bg-amber-300 ring-amber-300/25' : 'bg-white ring-white/25'}`} />
    </button>
  );
}
