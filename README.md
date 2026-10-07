# Interactive Master Plan

An aerial, fly-through master plan: the page opens on a close-up of the clubhouse, pulls back to the full site, and lets visitors fly into a cluster, tap any home and open its villa card.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run preview   # static export in out/
```

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds a static export and publishes it on every push to `main` (or manually from the Actions tab). One-time setup: **Settings → Pages → Source: GitHub Actions**. The site is served at `https://md-saqib.github.io/lunaya-clone/`. The workflow passes that `/lunaya-clone` base path into the build, so links and assets resolve, and the base path drops away automatically if a custom domain is added.

Plain paths to files in `public/` must go through `asset()` from `lib/asset.ts` so they pick up the base path. A new cluster also needs its letter and zone added to `generateStaticParams` in `app/villa/[id]/page.tsx`.

## How it works

- **Aerial renders** live in `arial/` (`LANDING PAGE ZOOM-01…04.jpg`). They are crops of the same camera, so the app stacks them in one coordinate space (ZOOM-01 pixels) and draws them on a canvas. As you zoom in, the sharper render takes over with a feathered edge.
- `npm run assets` rebuilds `public/aerial/` (full-res AVIF plus 2000px WebP previews, with the feathered edges baked in) and the cropped photos in `public/media/` from those renders.
- **Clusters, units and amenity outlines** are in `components/experience/siteplan.ts`, in ZOOM-01 pixel coordinates. New renders with different framing need these re-mapped.
- **Which clusters are live** and their copy (names, types, descriptions, features) are set in `components/experience/Experience.tsx` (`CLUSTERS`). Outlines already exist for six zones (`parkside`, `meadow`, `woodland`, `central`, `clubside`, `gateway`). Adding an entry to `CLUSTERS` turns one on.
- Deep links: `/?cluster=A` flies straight into a cluster, and `/?unit=A-07` opens that villa.

## Placeholders to replace

Project name, villa type names (AURA, SOLACE), prices, areas, availability and the reserve/contact forms (they don't submit anywhere yet) are all demo content. `/villa/[id]` is a stub for the upcoming villa details page.
