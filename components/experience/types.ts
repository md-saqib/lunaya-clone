import type { AmenityZoneId, ZoneId } from './siteplan';

export type UnitStatus = 'available' | 'reserved' | 'sold';

export type Unit = {
  id: string;
  clusterId: string;
  poly: number[];
  cx: number;
  cy: number;
  top: [number, number];
  status: UnitStatus;
  price: number;
  bedrooms: number;
  bathrooms: number;
  floors: string;
  builtUp: number;
  plot: number;
  view: string;
  corner: boolean;
  order: number;
};

export type ClusterAmenity = { title: string; image: string; zone?: AmenityZoneId };

export type Cluster = {
  id: string;
  zone: ZoneId;
  name: string;
  typeName: string;
  typeLabel: string;
  description: string;
  features: string[];
  hero: string;
  amenities: ClusterAmenity[];
  unitNoun: string;
  labelAt: [number, number];
};

export type Mode = 'loading' | 'intro' | 'master' | 'cluster' | 'amenities' | 'surroundings' | 'tour';

export type Sheet = null | 'list' | 'favorites' | 'compare' | 'info';
