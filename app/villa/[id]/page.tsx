import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ZONE_UNITS } from '@/components/experience/siteplan';
import { asset } from '@/lib/asset';

export const dynamicParams = false;

// mirrors the live clusters in Experience.tsx so every villa gets a static page
export function generateStaticParams() {
  return (
    [
      ['A', 'clubside'],
      ['B', 'gateway'],
    ] as const
  ).flatMap(([cluster, zone]) => ZONE_UNITS[zone].map((_, i) => ({ id: `${cluster}-${String(i + 1).padStart(2, '0')}` })));
}

export default async function VillaDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#0b0d0c] px-6 text-center">
      <div className="absolute inset-0 bg-cover bg-center opacity-25 blur-sm" style={{ backgroundImage: `url(${asset('/media/townhouse.webp')})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0b0d0c]/80 to-[#0b0d0c]" />
      <div className="relative animate-[fade-up_0.9s_cubic-bezier(0.22,1,0.36,1)_both]">
        <p className="text-[12px] uppercase tracking-[0.4em] text-emerald-300/80">Villa {id}</p>
        <h1 className="mt-4 font-display text-[44px] leading-tight text-white sm:text-[64px]">Villa details are on the way</h1>
        <p className="mx-auto mt-4 max-w-md text-white/60">Floor plans, sections, interiors and the walkthrough for this home will live here.</p>
        <Link href={`/?unit=${id}`} className="glass mt-10 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium text-white transition hover:bg-white/15">
          <ArrowLeft className="size-4" /> Back to the master plan
        </Link>
      </div>
    </main>
  );
}
