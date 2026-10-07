'use client';

import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ChevronDown,
  Clapperboard,
  Heart,
  Home,
  Landmark,
  List,
  MapPinned,
  Scale,
  Trees,
  type LucideIcon,
} from 'lucide-react';

export type NavKey = 'home' | 'amenities' | 'tour' | 'surroundings' | 'list' | 'back' | 'cluster-amenities' | 'favorites' | 'compare';

const masterItems: { key: NavKey; label: string; icon: LucideIcon }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'amenities', label: 'Project Amenities', icon: Landmark },
  { key: 'tour', label: 'Aerial Tour', icon: Clapperboard },
  { key: 'surroundings', label: 'Surroundings', icon: MapPinned },
  { key: 'list', label: 'List View', icon: List },
];

const clusterItems: { key: NavKey; label: string; icon: LucideIcon }[] = [
  { key: 'back', label: 'Back', icon: ArrowLeft },
  { key: 'cluster-amenities', label: 'Cluster Amenities', icon: Trees },
  { key: 'list', label: 'List View', icon: List },
  { key: 'favorites', label: 'Favorites', icon: Heart },
  { key: 'compare', label: 'Compare', icon: Scale },
];

export default function BottomNav({
  variant,
  active,
  open,
  badges,
  onToggle,
  onSelect,
}: {
  variant: 'master' | 'cluster';
  active: NavKey | null;
  open: boolean;
  badges: Partial<Record<NavKey, number>>;
  onToggle: () => void;
  onSelect: (key: NavKey) => void;
}) {
  const items = variant === 'master' ? masterItems : clusterItems;
  return (
    <div data-ui className="pointer-events-none flex flex-col items-center">
      <button
        onClick={onToggle}
        aria-label={open ? 'Hide menu' : 'Show menu'}
        className="glass pointer-events-auto mb-2 grid h-9 w-16 place-items-center rounded-full text-white/90 transition hover:bg-white/15 sm:h-10 sm:w-[88px]"
      >
        <ChevronDown className={`size-5 transition-transform duration-500 ${open ? '' : 'rotate-180'}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            key="nav"
            initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="glass pointer-events-auto rounded-[22px] p-1.5"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.ul
                key={variant}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="flex items-stretch"
              >
                {items.map(({ key, label, icon: Icon }) => {
                  const isActive = active === key;
                  const badge = badges[key];
                  return (
                    <li key={key}>
                      <button
                        onClick={() => onSelect(key)}
                        className={`relative flex h-[58px] min-w-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-2.5 text-[11px] font-medium transition-colors sm:h-[72px] sm:min-w-[84px] sm:px-4 sm:text-[13px] ${
                          isActive ? 'text-white' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId={`nav-active-${variant}`}
                            className="absolute inset-0 rounded-2xl bg-emerald-900/70 ring-1 ring-emerald-400/30"
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          />
                        )}
                        <span className="relative">
                          <Icon className="size-[22px] sm:size-6" strokeWidth={1.6} />
                          {!!badge && (
                            <span className="absolute -right-2.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-emerald-400 px-1 text-[10px] font-bold leading-4 text-emerald-950">
                              {badge}
                            </span>
                          )}
                        </span>
                        <span className="relative hidden whitespace-nowrap sm:block">{label}</span>
                      </button>
                    </li>
                  );
                })}
              </motion.ul>
            </AnimatePresence>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
