"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, easeInOutQuint, polyBox, type Box, type Inset, type View } from "./camera";
import { AMENITY_SHAPES, WORLD, ZONE_OUTLINES, ZONE_UNITS, type AmenityZoneId } from "./siteplan";
import Stage, { type Pin, type Shape } from "./Stage";
import type { Cluster, ClusterAmenity, Mode, Sheet, Unit } from "./types";
import AmenitiesPanel from "./ui/AmenitiesPanel";
import BottomNav, { type NavKey } from "./ui/BottomNav";
import ClusterPanel from "./ui/ClusterPanel";
import ClusterSwitcher from "./ui/ClusterSwitcher";
import { CompareSheet, FavoritesSheet } from "./ui/Collections";
import { BackButton, Compass, FullscreenButton, InfoButton, ZoomControl } from "./ui/Controls";
import { ClusterLabel, ExploreHint, PlaceLabel, UnitPill } from "./ui/Labels";
import ListView from "./ui/ListView";
import { InfoSheet, IntroTitle, Lightbox, Loader, Toast, TourCaption } from "./ui/Overlays";
import VillaModal from "./ui/VillaModal";
import { useAerialAssets } from "./useAerialAssets";
import { asset } from "@/lib/asset";

const PROJECT = "Demo Master Plan";
const TAGLINE = "Townhomes and villas wrapped in green";

const CLUSTERS: Cluster[] = [
  {
    id: "A",
    zone: "clubside",
    name: "Clubside",
    typeName: "AURA",
    typeLabel: "4 BHK Townhouse",
    unitNoun: "Townhouses",
    labelAt: [1760, 770],
    description:
      "41 AURA townhouses wrapped around the clubhouse. Four-bedroom homes over three levels with private terraces and pergola decks, steps from the rooftop pool and sports arena.",
    features: ["Private Terrace", "Pergola Deck", "Double-height Living", "Covered Parking", "Modular Kitchen", "Smart Home Ready"],
    hero: asset("/media/townhouse.webp"),
    amenities: [
      { title: "Clubhouse & Rooftop Pool", image: asset("/media/clubhouse.webp"), zone: "clubhouse" },
      { title: "Sports Arena", image: asset("/media/sports.webp"), zone: "sports" },
      { title: "Commercial Hub", image: asset("/media/commercial.webp"), zone: "commercial" },
    ],
  },
  {
    id: "B",
    zone: "gateway",
    name: "Gateway Villas",
    typeName: "SOLACE",
    typeLabel: "5 BHK Villa",
    unitNoun: "Villas",
    labelAt: [2560, 1490],
    description:
      "8 standalone SOLACE villas along the entrance boulevard. Five-bedroom homes over four levels with private lifts, landscaped setbacks and rooftop lounges.",
    features: ["Private Lift", "Rooftop Lounge", "Home Theatre", "Landscaped Setback", "3-Car Parking", "Smart Home System"],
    hero: asset("/media/villas.webp"),
    amenities: [
      { title: "Grand Entrance", image: asset("/media/entrance.webp") },
      { title: "Villa Boulevard", image: asset("/media/villas.webp") },
    ],
  },
];

const AMENITIES: { id: AmenityZoneId; title: string; text: string; image: string }[] = [
  {
    id: "clubhouse",
    title: "Clubhouse & Rooftop Pool",
    text: "A rooftop pool and sun deck crowning the residents’ clubhouse.",
    image: asset("/media/clubhouse.webp"),
  },
  { id: "sports", title: "Sports Arena", text: "Turf football pitch, pickleball court and cricket practice nets.", image: asset("/media/sports.webp") },
  { id: "park", title: "Kids’ Play Park", text: "Themed play zones, open lawns and shaded seating.", image: asset("/media/park.webp") },
  { id: "commercial", title: "Commercial Hub", text: "Everyday retail and services inside the community.", image: asset("/media/commercial.webp") },
];

const SURROUNDINGS: { title: string; at: [number, number] }[] = [
  { title: "Main Road", at: [3660, 1500] },
  { title: "Entrance Gate", at: [3130, 1790] },
  { title: "Access Road", at: [1880, 1290] },
  { title: "Green Reserve", at: [1050, 1500] },
  { title: "Woodland", at: [2950, 330] },
];

const TOUR: { title: string; text: string; amenity?: AmenityZoneId; cluster?: string }[] = [
  { title: PROJECT, text: TAGLINE },
  { title: "The Clubhouse", text: "A rooftop pool and sun deck above the residents’ clubhouse.", amenity: "clubhouse" },
  { title: "Sports Arena", text: "Turf football, pickleball and cricket practice nets.", amenity: "sports" },
  { title: "Clubside Townhouses", text: "41 four-bedroom AURA homes beside the clubhouse.", cluster: "A" },
  { title: "Kids’ Play Park", text: "Themed play zones and open lawns for little ones.", amenity: "park" },
  { title: "Gateway Villas", text: "Eight standalone SOLACE villas at the entrance.", cluster: "B" },
  { title: "Welcome Home", text: "Explore the master plan at your own pace." },
];

const SITE: Box = { x0: 430, y0: 230, x1: 3600, y1: 1900 };

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
};

function buildUnits(c: Cluster): Unit[] {
  return ZONE_UNITS[c.zone].map((s, i) => {
    const id = `${c.id}-${String(i + 1).padStart(2, "0")}`;
    const r = hash(id),
      r2 = hash(`${id}:area`),
      r3 = hash(`${id}:plot`);
    let cx = 0,
      cy = 0,
      top: [number, number] = [0, Infinity];
    for (let k = 0; k < s.poly.length; k += 2) {
      cx += s.poly[k];
      cy += s.poly[k + 1];
      if (s.poly[k + 1] < top[1]) top = [s.poly[k], s.poly[k + 1]];
    }
    cx /= s.poly.length / 2;
    cy /= s.poly.length / 2;
    const status = r < 0.62 ? "available" : r < 0.8 ? "reserved" : "sold";
    const base = { id, clusterId: c.id, poly: s.poly, cx, cy, top: [cx, top[1]] as [number, number], status, order: i } as const;
    if (s.kind === "V") {
      const builtUp = 4200 + Math.round(r2 * 6) * 100;
      const front = [0, 4, 5, 7].includes(i);
      return {
        ...base,
        view: front ? "Boulevard View" : "Garden View",
        corner: false,
        builtUp,
        plot: 2400 + Math.round(r3 * 6) * 100,
        bedrooms: 5,
        bathrooms: 6,
        floors: "G + 3",
        price: Math.round((builtUp * 8150 * (front ? 1.03 : 1)) / 10000) * 10000,
      };
    }
    const corner = s.end;
    const view = s.col >= 15 ? "Clubhouse View" : s.kind === "B" ? "Courtyard View" : "Avenue View";
    const builtUp = 2150 + Math.round(r2 * 6) * 50 + (corner ? 180 : 0);
    return {
      ...base,
      view,
      corner,
      builtUp,
      plot: 1180 + Math.round(r3 * 5) * 30 + (corner ? 140 : 0),
      bedrooms: 4,
      bathrooms: corner ? 5 : 4,
      floors: "G + 2",
      price: Math.round((builtUp * 7650 * (view === "Clubhouse View" ? 1.05 : 1) * (corner ? 1.04 : 1)) / 10000) * 10000,
    };
  });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function readList(key: string): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, v: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}

export default function Experience() {
  const camera = useMemo(() => new Camera(), []);
  const [mode, setMode] = useState<Mode>("loading");
  const { progress, ready, bitmaps } = useAerialAssets(mode !== "loading" && mode !== "intro");
  const [clusterId, setClusterId] = useState<string | null>(null);
  const [arrived, setArrived] = useState(false);
  const [hoverCluster, setHoverCluster] = useState<string | null>(null);
  const [hoverUnit, setHoverUnit] = useState<string | null>(null);
  const [hintUnit, setHintUnit] = useState<string | null>(null);
  const [unitId, setUnitId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [navOpen, setNavOpen] = useState(true);
  const [amenityFocus, setAmenityFocus] = useState<AmenityZoneId | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [compare, setCompare] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ image: string; title: string; text?: string } | null>(null);
  const [tourStep, setTourStep] = useState(-1);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [titleCard, setTitleCard] = useState(false);

  const flightId = useRef(0);
  const tourId = useRef(0);
  const amenitiesRef = useRef<HTMLDivElement>(null);

  const units = useMemo(() => CLUSTERS.flatMap(buildUnits), []);
  const unitById = useMemo(() => new Map(units.map((u) => [u.id, u])), [units]);
  const clusterById = useMemo(() => new Map(CLUSTERS.map((c) => [c.id, c])), []);
  const cluster = clusterId ? (clusterById.get(clusterId) ?? null) : null;
  const clusterUnits = useMemo(() => units.filter((u) => u.clusterId === clusterId), [units, clusterId]);
  const selected = unitId ? (unitById.get(unitId) ?? null) : null;

  useEffect(() => setFavorites(readList("vg:favorites")), []);

  const insets = useCallback(
    (kind: "master" | "panel"): Inset => {
      const mobile = camera.vw < 768;
      if (kind === "master") return mobile ? { top: 70, right: 12, bottom: 120, left: 12 } : { top: 80, right: 60, bottom: 150, left: 110 };
      return mobile
        ? { top: 120, right: 12, bottom: 250, left: 12 }
        : { top: 90, right: (camera.vw >= 1024 ? 420 : 400) + 30, bottom: 210, left: 110 };
    },
    [camera],
  );

  const masterView = useCallback(() => camera.frame(SITE, insets("master"), { pad: 0.02 }), [camera, insets]);
  const zoomLevels = useCallback(() => {
    const z = masterView().z;
    return [z, Math.min(camera.maxZ, z * 1.9), Math.min(camera.maxZ, z * 3.4)];
  }, [camera, masterView]);

  useEffect(
    () =>
      camera.subscribe((v) => {
        const lv = zoomLevels();
        let best = 0;
        lv.forEach((z, i) => {
          if (Math.abs(Math.log(v.z / z)) < Math.abs(Math.log(v.z / lv[best]))) best = i;
        });
        setZoomLevel((p) => (p === best ? p : best));
      }),
    [camera, zoomLevels],
  );

  const fly = useCallback(
    async (view: View, opts?: Parameters<Camera["flyTo"]>[1]) => {
      const id = ++flightId.current;
      await camera.flyTo(view, opts);
      return id === flightId.current;
    },
    [camera],
  );

  const resetFocus = () => {
    setSheet(null);
    setUnitId(null);
    setHoverUnit(null);
    setHoverCluster(null);
    setHintUnit(null);
    setArrived(false);
    tourId.current++;
    setTourStep(-1);
  };

  const enterCluster = useCallback(
    async (id: string, openUnit?: string) => {
      const c = clusterById.get(id);
      if (!c) return;
      resetFocus();
      setAmenityFocus(null);
      setAvailableOnly(false);
      setMode("cluster");
      setClusterId(id);
      const ok = await fly(camera.frame(polyBox(ZONE_OUTLINES[c.zone]), insets("panel"), { pad: 0.08, maxZ: 2.2 }), { duration: 2100 });
      if (!ok) return;
      setArrived(true);
      if (openUnit) setTimeout(() => setUnitId(openUnit), 300);
    },
    [camera, clusterById, fly, insets],
  );

  const goMaster = useCallback(() => {
    resetFocus();
    setAmenityFocus(null);
    setClusterId(null);
    setMode("master");
    fly(masterView(), { duration: 1700 });
  }, [fly, masterView]);

  const openAmenities = useCallback(
    (focus: AmenityZoneId | null = null) => {
      resetFocus();
      setClusterId(null);
      setMode("amenities");
      setAmenityFocus(focus);
      const box = focus ? polyBox([AMENITY_SHAPES[focus]]) : polyBox([AMENITY_SHAPES.clubhouse, AMENITY_SHAPES.sports, AMENITY_SHAPES.commercial]);
      fly(camera.frame(box, insets("panel"), { pad: focus ? 0.3 : 0.12, maxZ: 2.2 }), { duration: 1900 });
    },
    [camera, fly, insets],
  );

  const openSurroundings = useCallback(() => {
    resetFocus();
    setClusterId(null);
    setAmenityFocus(null);
    setMode("surroundings");
    fly({ x: WORLD.width / 2, y: WORLD.height / 2, z: camera.minZ() });
  }, [camera, fly]);

  const runTour = useCallback(async () => {
    resetFocus();
    setClusterId(null);
    setAmenityFocus(null);
    setMode("tour");
    const id = ++tourId.current;
    for (let i = 0; i < TOUR.length; i++) {
      if (id !== tourId.current) return;
      const stop = TOUR[i];
      setTourStep(i);
      const view = stop.amenity
        ? camera.frame(polyBox([AMENITY_SHAPES[stop.amenity]]), insets("master"), { pad: 0.35, maxZ: 2.4 })
        : stop.cluster
          ? camera.frame(polyBox(ZONE_OUTLINES[clusterById.get(stop.cluster)!.zone]), insets("master"), { pad: 0.12, maxZ: 2.2 })
          : masterView();
      const ok = await fly(view, { duration: 3400, ease: easeInOutQuint, rho: 1.1 });
      if (!ok || id !== tourId.current) return;
      await sleep(i === TOUR.length - 1 ? 1800 : 2800);
    }
    if (id === tourId.current) {
      setTourStep(-1);
      setMode("master");
    }
  }, [camera, clusterById, fly, insets, masterView]);

  const stopTour = useCallback(() => {
    tourId.current++;
    setTourStep(-1);
    setMode("master");
    camera.stop();
  }, [camera]);

  const openUnit = useCallback(
    (id: string) => {
      const u = unitById.get(id);
      if (!u) return;
      setSheet(null);
      if (mode === "cluster" && clusterId === u.clusterId) setUnitId(id);
      else enterCluster(u.clusterId, id);
    },
    [unitById, mode, clusterId, enterCluster],
  );

  // intro: hold on the clubhouse close-up, then pull back to the full master plan
  useEffect(() => {
    if (!ready || mode !== "loading") return;
    const params = new URLSearchParams(window.location.search);
    const deepUnit = params.get("unit");
    const deepCluster = params.get("cluster");
    if (deepUnit && unitById.has(deepUnit)) {
      camera.set(masterView());
      setMode("master");
      enterCluster(unitById.get(deepUnit)!.clusterId, deepUnit);
      return;
    }
    if (deepCluster && clusterById.has(deepCluster)) {
      camera.set(masterView());
      setMode("master");
      enterCluster(deepCluster);
      return;
    }
    setMode("intro");
    camera.set(camera.frame(polyBox([AMENITY_SHAPES.clubhouse]), { top: 0, right: 0, bottom: 0, left: 0 }, { pad: -0.2, maxZ: 3 }));
    setTitleCard(true);
    (async () => {
      await sleep(2300);
      setTitleCard(false);
      const ok = await fly(masterView(), { duration: 4600, ease: easeInOutQuint, rho: 1.05 });
      if (ok) setMode((m) => (m === "intro" ? "master" : m));
    })();
  }, [ready, mode, camera, masterView, fly, enterCluster, unitById, clusterById]);

  const skipIntro = useCallback(() => {
    setTitleCard(false);
    setMode("master");
    fly(masterView(), { duration: 1200 });
  }, [fly, masterView]);

  const onInteract = useCallback(() => {
    setHintUnit(null);
    if (mode === "intro") skipIntro();
    else if (mode === "tour") stopTour();
  }, [mode, skipIntro, stopTour]);

  // "Tap to explore" nudge on a home near the middle of the cluster
  useEffect(() => {
    if (!arrived || !cluster) return;
    const b = polyBox(ZONE_OUTLINES[cluster.zone]);
    const mx = (b.x0 + b.x1) / 2,
      my = (b.y0 + b.y1) / 2;
    const pick = clusterUnits
      .filter((u) => u.status === "available")
      .sort((a, b2) => Math.hypot(a.cx - mx, a.cy - my) - Math.hypot(b2.cx - mx, b2.cy - my))[0];
    if (!pick) return;
    const show = setTimeout(() => setHintUnit(pick.id), 1100);
    const hide = setTimeout(() => setHintUnit(null), 6500);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [arrived, cluster, clusterUnits]);

  useEffect(() => {
    if (mode === "loading" || mode === "intro") return;
    const url = new URL(window.location.href);
    url.search = "";
    if (unitId) url.searchParams.set("unit", unitId);
    else if (mode === "cluster" && clusterId) url.searchParams.set("cluster", clusterId);
    window.history.replaceState(null, "", url);
  }, [mode, clusterId, unitId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || unitId || sheet || lightbox) return;
      if (mode === "tour") stopTour();
      else if (mode === "cluster" || mode === "amenities" || mode === "surroundings") goMaster();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, unitId, sheet, lightbox, goMaster, stopTour]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeList("vg:favorites", next);
      setToast(next.includes(id) ? `Villa ${id} saved to favorites` : `Villa ${id} removed from favorites`);
      return next;
    });
  }, []);

  const toggleCompare = useCallback((id: string) => {
    setCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        setToast("Compare holds up to three homes");
        return prev;
      }
      setToast(`Villa ${id} added to compare`);
      return [...prev, id];
    });
  }, []);

  const share = useCallback(async (id: string) => {
    const url = new URL(window.location.href);
    url.search = `?unit=${id}`;
    try {
      if (navigator.share) await navigator.share({ title: `${PROJECT} · Villa ${id}`, url: url.toString() });
      else {
        await navigator.clipboard.writeText(url.toString());
        setToast("Link copied to clipboard");
      }
    } catch {}
  }, []);

  const onNav = (key: NavKey) => {
    if (key === "home") goMaster();
    else if (key === "back") goMaster();
    else if (key === "amenities") openAmenities();
    else if (key === "surroundings") openSurroundings();
    else if (key === "tour") runTour();
    else if (key === "list") setSheet("list");
    else if (key === "favorites") setSheet("favorites");
    else if (key === "compare") setSheet("compare");
    else if (key === "cluster-amenities") amenitiesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showAmenityZone = (a: ClusterAmenity) => setLightbox({ image: a.image, title: a.title, text: AMENITIES.find((x) => x.id === a.zone)?.text });

  // ---- map shapes ----
  const shapes: Shape[] = useMemo(() => {
    const out: Shape[] = [];
    const outlines = (c: Cluster, className: string, extra: Partial<Shape> = {}) =>
      ZONE_OUTLINES[c.zone].forEach((p, i) => {
        if (className.startsWith("shape-outline")) out.push({ id: `${c.id}-g${i}`, points: p, className: `${className} is-glow` });
        out.push({ id: `${c.id}-o${i}`, points: p, className, ...extra });
      });

    if (mode === "master" || mode === "surroundings") {
      for (const c of CLUSTERS) {
        if (mode === "surroundings") outlines(c, "shape-cluster is-muted");
        else
          outlines(c, `shape-cluster${hoverCluster === c.id ? " is-hover" : ""}`, {
            onEnter: () => setHoverCluster(c.id),
            onLeave: () => setHoverCluster((h) => (h === c.id ? null : h)),
            onClick: () => enterCluster(c.id),
          });
      }
      if (mode === "master")
        for (const a of AMENITIES)
          out.push({
            id: `am-${a.id}`,
            points: AMENITY_SHAPES[a.id],
            className: `shape-amenity ${hoverCluster === "amenities" ? "is-hover" : "is-ghost"}`,
          });
    }

    if (mode === "cluster" && cluster) {
      for (const c of CLUSTERS) if (c.id !== cluster.id) outlines(c, "shape-cluster is-muted is-clickable", { onClick: () => enterCluster(c.id) });
      outlines(cluster, "shape-outline");
      if (arrived) {
        const b = polyBox(ZONE_OUTLINES[cluster.zone]);
        const mx = (b.x0 + b.x1) / 2,
          my = (b.y0 + b.y1) / 2;
        const far = Math.hypot(b.x1 - b.x0, b.y1 - b.y0) / 2;
        for (const u of clusterUnits) {
          const cls = [
            "shape-unit",
            `status-${u.status}`,
            hoverUnit === u.id || hintUnit === u.id ? "is-hover" : "",
            unitId === u.id ? "is-selected" : "",
            availableOnly && u.status !== "available" ? "is-dim" : "",
          ].join(" ");
          out.push({
            id: u.id,
            points: u.poly,
            className: cls,
            delay: Math.round(60 + (Math.hypot(u.cx - mx, u.cy - my) / far) * 650),
            onEnter: () => {
              setHoverUnit(u.id);
              setHintUnit(null);
            },
            onLeave: () => setHoverUnit((h) => (h === u.id ? null : h)),
            onClick: () => setUnitId(u.id),
          });
        }
      }
    }

    if (mode === "amenities")
      for (const a of AMENITIES)
        out.push({
          id: `am-${a.id}`,
          points: AMENITY_SHAPES[a.id],
          className: `shape-amenity is-clickable ${amenityFocus === a.id ? "is-focus" : "is-hover"}`,
          onClick: () => openAmenities(a.id),
        });

    if (mode === "tour" && tourStep >= 0) {
      const stop = TOUR[tourStep];
      if (stop.amenity) {
        out.push({ id: `tour-g${tourStep}`, points: AMENITY_SHAPES[stop.amenity], className: "shape-outline is-gold is-glow" });
        out.push({ id: `tour-${tourStep}`, points: AMENITY_SHAPES[stop.amenity], className: "shape-outline is-gold" });
      }
      if (stop.cluster) outlines(clusterById.get(stop.cluster)!, "shape-outline");
    }
    return out;
  }, [
    mode,
    cluster,
    arrived,
    clusterUnits,
    hoverCluster,
    hoverUnit,
    hintUnit,
    unitId,
    availableOnly,
    amenityFocus,
    tourStep,
    clusterById,
    enterCluster,
    openAmenities,
  ]);

  const spotlight = useMemo(() => {
    if (mode === "cluster" && cluster) return ZONE_OUTLINES[cluster.zone];
    if (mode === "amenities") return amenityFocus ? [AMENITY_SHAPES[amenityFocus]] : AMENITIES.map((a) => AMENITY_SHAPES[a.id]);
    if (mode === "tour" && tourStep >= 0) {
      const stop = TOUR[tourStep];
      if (stop.amenity) return [AMENITY_SHAPES[stop.amenity]];
      if (stop.cluster) return ZONE_OUTLINES[clusterById.get(stop.cluster)!.zone];
    }
    return null;
  }, [mode, cluster, amenityFocus, tourStep, clusterById]);

  // ---- floating labels ----
  const pins: Pin[] = useMemo(() => {
    const out: Pin[] = [];
    if (mode === "master") {
      CLUSTERS.forEach((c, i) => {
        const count = units.filter((u) => u.clusterId === c.id).length;
        out.push({
          id: `cl-${c.id}`,
          x: c.labelAt[0],
          y: c.labelAt[1],
          delay: 0.15 + i * 0.12,
          content: (
            <ClusterLabel
              code={`Cluster ${c.id}`}
              name={c.name}
              meta={`${count} ${c.unitNoun}`}
              cta="Explore Villas"
              active={hoverCluster === c.id}
              onClick={() => enterCluster(c.id)}
              onEnter={() => setHoverCluster(c.id)}
              onLeave={() => setHoverCluster((h) => (h === c.id ? null : h))}
            />
          ),
        });
      });
      out.push({
        id: "amenities",
        x: 2560,
        y: 985,
        delay: 0.45,
        content: (
          <ClusterLabel
            code="Project Amenities"
            name="Clubhouse · Sports · Park"
            meta={`${AMENITIES.length} spaces`}
            cta="Explore Amenities"
            active={hoverCluster === "amenities"}
            onClick={() => openAmenities()}
            onEnter={() => setHoverCluster("amenities")}
            onLeave={() => setHoverCluster((h) => (h === "amenities" ? null : h))}
          />
        ),
      });
    }
    if (mode === "cluster" && arrived) {
      const u = (hoverUnit && unitById.get(hoverUnit)) || (hintUnit && unitById.get(hintUnit)) || null;
      if (u && !unitId)
        out.push({
          id: `unit-${u.id}`,
          x: u.top[0],
          y: u.top[1],
          content:
            hintUnit === u.id && !hoverUnit ? (
              <ExploreHint />
            ) : (
              <UnitPill id={u.id} status={u.status} hint={u.status === "available" ? undefined : u.status === "sold" ? "Sold" : "Reserved"} />
            ),
        });
    }
    if (mode === "amenities")
      AMENITIES.forEach((a, i) => {
        const b = polyBox([AMENITY_SHAPES[a.id]]);
        out.push({
          id: `am-${a.id}`,
          x: (b.x0 + b.x1) / 2,
          y: b.y0 + (b.y1 - b.y0) * 0.35,
          delay: 0.2 + i * 0.08,
          content: <PlaceLabel title={a.title} onClick={() => openAmenities(a.id)} />,
        });
      });
    if (mode === "surroundings")
      SURROUNDINGS.forEach((s, i) =>
        out.push({ id: `sr-${s.title}`, x: s.at[0], y: s.at[1], delay: 0.3 + i * 0.1, content: <PlaceLabel title={s.title} tone="white" /> }),
      );
    return out;
  }, [mode, arrived, hoverUnit, hintUnit, unitId, unitById, hoverCluster, units, enterCluster, openAmenities]);

  const panelOpen = (mode === "cluster" && arrived && !!cluster) || mode === "amenities";
  const navVariant = mode === "cluster" ? "cluster" : "master";
  const navActive: NavKey | null =
    sheet === "list"
      ? "list"
      : sheet === "favorites"
        ? "favorites"
        : sheet === "compare"
          ? "compare"
          : mode === "amenities"
            ? "amenities"
            : mode === "surroundings"
              ? "surroundings"
              : mode === "tour"
                ? "tour"
                : mode === "master"
                  ? "home"
                  : null;
  const uiVisible = mode !== "loading" && mode !== "intro" && mode !== "tour";

  return (
    <main className="fixed inset-0 overflow-hidden bg-[#0b0d0c] text-white">
      <Stage
        camera={camera}
        bitmaps={bitmaps}
        shapes={shapes}
        spotlight={spotlight}
        pins={uiVisible || mode === "tour" ? pins : []}
        onInteract={onInteract}
      />

      <AnimatePresence>{mode === "loading" && <Loader key="loader" progress={progress} project={PROJECT} />}</AnimatePresence>
      <AnimatePresence>{titleCard && <IntroTitle key="title" project={PROJECT} tagline={TAGLINE} />}</AnimatePresence>
      {mode === "intro" && (
        <button
          data-ui
          onClick={skipIntro}
          className="fixed bottom-8 left-1/2 z-30 -translate-x-1/2 text-[12px] uppercase tracking-[0.3em] text-white/60 transition hover:text-white"
        >
          Skip intro
        </button>
      )}

      <AnimatePresence>
        {mode === "tour" && tourStep >= 0 && (
          <TourCaption key="tour" step={tourStep} total={TOUR.length} title={TOUR[tourStep].title} text={TOUR[tourStep].text} onStop={stopTour} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uiVisible && (
          <motion.div
            key="chrome"
            className="pointer-events-none fixed inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="pointer-events-auto absolute left-4 top-4 flex flex-col items-start gap-3 sm:left-6 sm:top-6">
              <AnimatePresence>
                {mode !== "master" && <BackButton key="back" label={mode === "cluster" ? "Back" : "Master Plan"} onClick={goMaster} />}
              </AnimatePresence>
              <Compass />
            </div>

            <AnimatePresence>
              {(mode === "master" || mode === "surroundings") && (
                <motion.div
                  key="brand"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-1/2 top-6 hidden -translate-x-1/2 text-center md:block"
                >
                  <p className="font-display text-[26px] uppercase tracking-[0.3em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.5)]">{PROJECT}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.4em] text-white/70 drop-shadow">
                    {mode === "surroundings" ? "Surroundings" : "Master Plan"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 sm:left-6">
              <ZoomControl
                level={zoomLevel}
                onIn={() => camera.smoothZoom(camera.vw / 2, camera.vh / 2, 1.7)}
                onOut={() => camera.smoothZoom(camera.vw / 2, camera.vh / 2, 1 / 1.7)}
                onLevel={(i) => fly({ ...camera.view, z: zoomLevels()[i] }, { duration: 1100 })}
              />
            </div>

            <div className="pointer-events-auto absolute right-4 top-4 z-40 flex gap-2 sm:right-6 sm:top-6">
              <FullscreenButton />
            </div>

            <div className="pointer-events-auto absolute bottom-5 left-4 hidden sm:left-6 sm:block">
              <InfoButton active={sheet === "info"} onClick={() => setSheet((s) => (s === "info" ? null : "info"))} />
            </div>

            <div
              className={`absolute inset-x-0 bottom-3 flex flex-col items-center gap-3 px-3 transition-[right] duration-700 sm:bottom-5 ${
                panelOpen ? "max-md:bottom-[140px] md:right-[400px] lg:right-[420px]" : ""
              }`}
            >
              <AnimatePresence>
                {mode === "cluster" && (
                  <motion.div
                    key="switcher"
                    className="pointer-events-auto max-md:fixed max-md:left-3 max-md:right-3 max-md:top-[124px] max-md:flex max-md:justify-center"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ClusterSwitcher
                      items={CLUSTERS.map((c) => ({ id: c.id, name: c.name, count: units.filter((u) => u.clusterId === c.id).length }))}
                      activeId={clusterId}
                      onSelect={(id) => (id ? id !== clusterId && enterCluster(id) : goMaster())}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="pointer-events-auto">
                <BottomNav
                  variant={navVariant}
                  active={navActive}
                  open={navOpen}
                  badges={{ favorites: favorites.length, compare: compare.length }}
                  onToggle={() => setNavOpen((v) => !v)}
                  onSelect={onNav}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mode === "cluster" && arrived && cluster && (
          <ClusterPanel
            key={`panel-${cluster.id}`}
            cluster={cluster}
            units={clusterUnits}
            availableOnly={availableOnly}
            onAvailableOnly={setAvailableOnly}
            onAmenity={showAmenityZone}
            amenitiesRef={amenitiesRef}
          />
        )}
        {mode === "amenities" && (
          <AmenitiesPanel key="amenities" items={AMENITIES} focus={amenityFocus} onFocus={(id) => openAmenities(id as AmenityZoneId)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && clusterById.get(selected.clusterId) && (
          <VillaModal
            key="villa"
            unit={selected}
            cluster={clusterById.get(selected.clusterId)!}
            favorite={favorites.includes(selected.id)}
            comparing={compare.includes(selected.id)}
            onClose={() => setUnitId(null)}
            onFavorite={() => toggleFavorite(selected.id)}
            onCompare={() => toggleCompare(selected.id)}
            onShare={() => share(selected.id)}
            onToast={setToast}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sheet === "list" && (
          <ListView
            key="list"
            units={units}
            clusters={CLUSTERS}
            initialCluster={mode === "cluster" ? clusterId : null}
            onOpen={openUnit}
            onClose={() => setSheet(null)}
          />
        )}
        {sheet === "favorites" && (
          <FavoritesSheet
            key="fav"
            units={favorites.map((id) => unitById.get(id)).filter((u): u is Unit => !!u)}
            clusters={CLUSTERS}
            onOpen={openUnit}
            onRemove={toggleFavorite}
            onClose={() => setSheet(null)}
          />
        )}
        {sheet === "compare" && (
          <CompareSheet
            key="cmp"
            units={compare.map((id) => unitById.get(id)).filter((u): u is Unit => !!u)}
            clusters={CLUSTERS}
            onOpen={openUnit}
            onRemove={toggleCompare}
            onClose={() => setSheet(null)}
          />
        )}
        {sheet === "info" && <InfoSheet key="info" onClose={() => setSheet(null)} />}
      </AnimatePresence>

      <AnimatePresence>{lightbox && <Lightbox key="lb" {...lightbox} onClose={() => setLightbox(null)} />}</AnimatePresence>
      <AnimatePresence>{toast && <Toast key={toast} message={toast} onDone={() => setToast(null)} />}</AnimatePresence>
    </main>
  );
}
