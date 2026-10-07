'use client';

import { AnimatePresence, animate, motion } from 'motion/react';
import {
  ArrowRight,
  Bath,
  BedDouble,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  Compass,
  Download,
  Eye,
  Heart,
  LandPlot,
  Phone,
  Ruler,
  Scale,
  Share2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { formatArea, formatCr, formatINR } from '../format';
import type { Cluster, Unit } from '../types';

type Form = null | 'customer' | 'broker' | 'contact';

const statusBadge = {
  available: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300',
  reserved: 'border-amber-400/50 bg-amber-500/15 text-amber-300',
  sold: 'border-rose-400/50 bg-rose-500/15 text-rose-300',
};

const statusText = { available: 'Available', reserved: 'Reserved', sold: 'Sold' };

const rise = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.12 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }),
};

export default function VillaModal({
  unit,
  cluster,
  favorite,
  comparing,
  onClose,
  onFavorite,
  onCompare,
  onShare,
  onToast,
}: {
  unit: Unit;
  cluster: Cluster;
  favorite: boolean;
  comparing: boolean;
  onClose: () => void;
  onFavorite: () => void;
  onCompare: () => void;
  onShare: () => void;
  onToast: (msg: string) => void;
}) {
  const [form, setForm] = useState<Form>(null);
  const priceRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setForm(null);
    const el = priceRef.current;
    if (!el) return;
    const controls = animate(unit.price * 0.82, unit.price, {
      duration: 1.1,
      delay: 0.25,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (el.textContent = formatINR(Math.round(v / 1000) * 1000)),
    });
    return () => controls.stop();
  }, [unit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (form ? setForm(null) : onClose());
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [form, onClose]);

  const stats = [
    { icon: BedDouble, label: 'Bedrooms', value: `${unit.bedrooms} BHK` },
    { icon: Ruler, label: 'Built-up Area', value: formatArea(unit.builtUp) },
    { icon: LandPlot, label: 'Plot Area', value: formatArea(unit.plot) },
    { icon: Building2, label: 'Floors', value: unit.floors },
    { icon: Bath, label: 'Bathrooms', value: unit.bathrooms },
    { icon: Compass, label: 'Facing', value: unit.view },
  ];
  const closed = unit.status === 'sold';

  return (
    <motion.div
      data-ui
      className="print-root fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.1 } }}
    >
      <motion.div
        className="modal-backdrop no-print absolute inset-0"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
      <motion.article
        className="villa-card relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[28px] sm:max-h-[min(92vh,980px)] sm:max-w-[600px] sm:rounded-[28px]"
        initial={{ opacity: 0, y: 48, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.97, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } }}
        transition={{ type: 'spring', stiffness: 210, damping: 26 }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="no-print absolute right-4 top-4 z-20 grid size-10 place-items-center rounded-full bg-black/35 text-white/90 ring-1 ring-white/20 backdrop-blur-md transition hover:bg-black/55"
        >
          <X className="size-5" />
        </button>

        <div className="panel-scroll overflow-y-auto">
          <div className="relative aspect-[16/9] overflow-hidden">
            <motion.img
              src={cluster.hero}
              alt={`${cluster.typeName} residence`}
              className="absolute inset-0 size-full object-cover"
              initial={{ scale: 1.18, filter: 'blur(8px)' }}
              animate={{ scale: 1.04, filter: 'blur(0px)' }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141716] via-transparent to-black/20" />
          </div>

          <div className="relative -mt-6 px-6 pb-7 sm:px-8">
            <motion.div custom={0} variants={rise} initial="hidden" animate="show" className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[26px] font-bold tracking-tight text-white sm:text-[30px]">Villa No. {unit.id}</h2>
              <span className="badge-type">{cluster.typeName}</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[12px] font-semibold ${statusBadge[unit.status]}`}>{statusText[unit.status]}</span>
            </motion.div>
            <motion.p custom={1} variants={rise} initial="hidden" animate="show" className="mt-2 flex items-center gap-2 text-[16px] text-white/70">
              <Eye className="size-4" /> {unit.view}
              {unit.corner && <span className="text-white/40">· Corner unit</span>}
            </motion.p>

            <motion.div custom={2} variants={rise} initial="hidden" animate="show" className="mt-6">
              <p className="text-[15px] text-white/55">Price</p>
              <p className="mt-1 flex items-baseline gap-3">
                <span ref={priceRef} className="price-glow text-[32px] font-bold tracking-tight text-emerald-300 sm:text-[36px]">
                  {formatINR(unit.price)}
                </span>
                <span className="text-[14px] text-white/45">{formatCr(unit.price)}</span>
              </p>
            </motion.div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {stats.map((s, i) => (
                <motion.div key={s.label} custom={3 + i * 0.6} variants={rise} initial="hidden" animate="show" className="stat-card">
                  <s.icon className="size-5 shrink-0 text-white/60" strokeWidth={1.6} />
                  <div className="min-w-0">
                    <p className="text-[12px] text-white/50">{s.label}</p>
                    <p className="truncate text-[17px] font-semibold text-white">{s.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div custom={7} variants={rise} initial="hidden" animate="show" className="mt-7">
              <h3 className="text-[17px] font-semibold text-white">Features</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {cluster.features.map((f) => (
                  <span key={f} className="chip">{f}</span>
                ))}
              </div>
            </motion.div>

            <motion.div custom={8} variants={rise} initial="hidden" animate="show" className="no-print mt-7 grid grid-cols-5 gap-2 sm:gap-3">
              <Action icon={Heart} label="Favorite" active={favorite} onClick={onFavorite} fill />
              <Action icon={Scale} label="Compare" active={comparing} onClick={onCompare} />
              <Action icon={Share2} label="Share" onClick={onShare} />
              <Action icon={Phone} label="Contact" onClick={() => setForm('contact')} />
              <Action icon={Download} label="PDF" onClick={() => window.print()} />
            </motion.div>

            <motion.div custom={9} variants={rise} initial="hidden" animate="show" className="no-print mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button disabled={closed} onClick={() => setForm('customer')} className="btn-reserve">
                <BookOpen className="size-5" /> {closed ? 'Sold out' : 'Reserve as Customer'}
              </button>
              <button disabled={closed} onClick={() => setForm('broker')} className="btn-ghost">
                <Briefcase className="size-5" /> Reserve as Broker
              </button>
            </motion.div>

            <motion.div custom={10} variants={rise} initial="hidden" animate="show" className="no-print mt-4">
              <Link href={`/villa/${unit.id}`} className="btn-details group">
                Villa Details <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {form && (
            <EnquiryForm
              key={form}
              kind={form}
              unit={unit}
              onClose={() => setForm(null)}
              onDone={(msg) => {
                setForm(null);
                onToast(msg);
              }}
            />
          )}
        </AnimatePresence>
      </motion.article>
    </motion.div>
  );
}

function Action({ icon: Icon, label, active, fill, onClick }: { icon: typeof Heart; label: string; active?: boolean; fill?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`action-card ${active ? 'is-active' : ''}`}>
      <motion.span key={String(active)} initial={{ scale: active ? 0.6 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }}>
        <Icon className="size-5" strokeWidth={1.7} fill={active && fill ? 'currentColor' : 'none'} />
      </motion.span>
      <span className="text-[11px] sm:text-[13px]">{label}</span>
    </button>
  );
}

const formCopy = {
  customer: { title: 'Reserve this home', sub: 'Share your details and our sales team will confirm availability and next steps.', cta: 'Request reservation' },
  broker: { title: 'Reserve as a broker', sub: 'Register the reservation on behalf of your client.', cta: 'Submit for client' },
  contact: { title: 'Talk to sales', sub: 'Request a call back about this home.', cta: 'Request call back' },
};

function EnquiryForm({ kind, unit, onClose, onDone }: { kind: Exclude<Form, null>; unit: Unit; onClose: () => void; onDone: (msg: string) => void }) {
  const [sent, setSent] = useState(false);
  const copy = formCopy[kind];
  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col bg-[#121514]/[0.97] backdrop-blur-xl"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between px-6 pt-6 sm:px-8">
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">Villa {unit.id}</span>
        <button onClick={onClose} aria-label="Back to villa" className="grid size-10 place-items-center rounded-full bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10">
          <X className="size-5" />
        </button>
      </div>
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
              className="grid size-16 place-items-center rounded-full bg-emerald-500 text-emerald-950"
            >
              <Check className="size-8" strokeWidth={3} />
            </motion.span>
            <h3 className="mt-5 text-2xl font-bold text-white">Request received</h3>
            <p className="mt-2 max-w-xs text-white/60">Our team will reach out within 24 hours about Villa {unit.id}.</p>
            <button onClick={() => onDone('Request sent — we will be in touch shortly')} className="btn-reserve mt-8 w-full max-w-xs">
              Back to villa
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            exit={{ opacity: 0, y: -10 }}
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="flex flex-1 flex-col px-6 pb-8 pt-4 sm:px-8"
          >
            <h3 className="text-[26px] font-bold text-white">{copy.title}</h3>
            <p className="mt-2 text-[15px] text-white/60">{copy.sub}</p>
            <div className="mt-7 space-y-4">
              {kind === 'broker' && <Field label="Agency / RERA number" name="agency" />}
              <Field label={kind === 'broker' ? 'Client name' : 'Full name'} name="name" />
              <Field label="Phone" name="phone" type="tel" />
              {kind !== 'contact' && <Field label="Email" name="email" type="email" />}
            </div>
            <button type="submit" className="btn-reserve mt-auto w-full">
              {copy.cta}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Field({ label, name, type = 'text' }: { label: string; name: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-[13px] text-white/55">{label}</span>
      <input
        required
        name={name}
        type={type}
        className="mt-1.5 h-12 w-full rounded-xl bg-white/[0.05] px-4 text-[16px] text-white outline-none ring-1 ring-white/10 transition placeholder:text-white/30 focus:bg-white/[0.08] focus:ring-emerald-400/60"
      />
    </label>
  );
}
