export const normalizeSeoKeywords = (value) => {
  const entries = typeof value === 'string' ? value.split(/[,\n]+/) : value;
  if (!Array.isArray(entries)) return [];
  return [...new Set(entries
    .filter((entry) => typeof entry === 'string')
    .map((entry) => entry.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean))];
};
