export const homeImageSrcSet = (name: string) =>
  [480, 768, 1280].map((width) => `/images/optimized/${name}-${width}.webp ${width}w`).join(', ');
