const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export const formatINR = (n: number) => `₹ ${inr.format(Math.round(n))}`;

export const formatCr = (n: number) => `₹${(n / 1e7).toFixed(2)} Cr`;

export const formatArea = (n: number) => `${inr.format(n)} sq ft`;
