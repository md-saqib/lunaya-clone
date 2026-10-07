'use client';

import { useEffect, useRef, useState } from 'react';
import { asset } from '@/lib/asset';
import { LAYERS } from './siteplan';

type State = { progress: number; ready: boolean; bitmaps: (ImageBitmap | null)[] };

async function fetchBitmap(url: string, onBytes: (n: number, total: number) => void) {
  const res = await fetch(asset(url));
  if (!res.ok || !res.body) throw new Error(`Failed to load ${url}`);
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    onBytes(value.byteLength, total);
  }
  const blob = new Blob(chunks, { type: res.headers.get('content-type') ?? undefined });
  return createImageBitmap(blob);
}

export function useAerialAssets(startBackground: boolean): State {
  const [state, setState] = useState<State>({ progress: 0, ready: false, bitmaps: LAYERS.map(() => null) });
  const release = useRef<() => void>(() => {});
  const started = useRef(false);

  useEffect(() => {
    if (startBackground && !started.current) {
      started.current = true;
      release.current();
    }
  }, [startBackground]);

  useEffect(() => {
    let alive = true;
    const preview: (ImageBitmap | null)[] = LAYERS.map(() => null);
    const full: (ImageBitmap | null)[] = LAYERS.map(() => null);
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;

    const gate = [
      ...LAYERS.map((l, i) => ({ url: l.preview, i, kind: 'preview' as const })),
      { url: LAYERS[3].src, i: 3, kind: 'full' as const },
    ];
    const background = LAYERS.map((l, i) => ({ url: l.src, i, kind: 'full' as const })).filter(
      (a) => a.i !== 3 && !(small && a.i < 2),
    );

    const expected = new Map<string, number>();
    const received = new Map<string, number>();
    const publish = (ready?: boolean) => {
      if (!alive) return;
      let got = 0, want = 0;
      for (const a of gate) {
        const t = expected.get(a.url) || 600_000;
        want += t;
        got += Math.min(t, received.get(a.url) ?? 0);
      }
      setState((s) => ({
        progress: Math.max(s.progress, want ? got / want : 0),
        ready: s.ready || !!ready,
        bitmaps: LAYERS.map((_, i) => full[i] ?? preview[i]),
      }));
    };

    const load = async (a: { url: string; i: number; kind: 'preview' | 'full' }) => {
      try {
        const bmp = await fetchBitmap(a.url, (n, total) => {
          if (total) expected.set(a.url, total);
          received.set(a.url, (received.get(a.url) ?? 0) + n);
          publish();
        });
        if (!alive) return bmp.close();
        (a.kind === 'full' ? full : preview)[a.i] = bmp;
      } catch {
        received.set(a.url, expected.get(a.url) ?? 600_000);
      }
      publish();
    };

    const go = new Promise<void>((resolve) => {
      release.current = resolve;
      if (started.current) resolve();
    });

    (async () => {
      await Promise.all(gate.map(load));
      publish(true);
      await go;
      for (const a of background) await load(a);
    })();

    return () => {
      alive = false;
    };
  }, []);

  return state;
}
