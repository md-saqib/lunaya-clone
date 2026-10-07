// Static files need the Pages base path (e.g. /lunaya-clone) that next/link adds automatically.
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`;
