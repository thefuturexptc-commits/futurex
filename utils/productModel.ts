import type { Product } from '../types';

export const correctRingModel = (product: Product): Product => {
  if (!/\bring\b/i.test(`${product.category} ${product.name}`)) return product;
  const replaceR11 = (value: string) => value.replace(/\bR11\b/gi, 'Q11');
  const isMetalRing = product.slug === 'tfx-ring-pro-smart-ring-with-app-control-and-gesture-features'
    || /\b(?:ring\s+pro|metal(?:\s+smart)?\s+ring)\b/i.test(product.name);
  const specs = Object.fromEntries(Object.entries(product.specs || {}).map(([key, value]) => [
    key,
    /\bmodel\b/i.test(key) ? replaceR11(value) : value,
  ]));
  return {
    ...product,
    name: replaceR11(product.name),
    ...(product.modelNumber ? { modelNumber: replaceR11(product.modelNumber) } : {}),
    ...(product.modelNumbers ? { modelNumbers: product.modelNumbers.map(replaceR11) } : {}),
    specs,
    ...(isMetalRing ? { modelNumber: 'Q10', specs: { ...specs, 'Model Number': 'Q10' } } : {}),
  };
};

export const getProductModelNumbers = (product: Product): string[] => {
  const values = [
    product.modelNumber,
    ...(product.modelNumbers || []),
    ...Object.entries(product.specs || {})
      .filter(([key]) => /^model(?:[\s_-]*(?:number|no\.?|name))?$/i.test(key.trim()))
      .map(([, value]) => value),
  ];
  const seen = new Set<string>();
  return values.flatMap((value) => {
    const model = String(value || '').trim();
    const key = model.toLowerCase().replace(/[\s_-]+/g, '');
    if (!key || seen.has(key)) return [];
    seen.add(key);
    return [model];
  });
};

export const getProductTitleWithModel = (product: Product): string => {
  const models = getProductModelNumbers(product);
  let name = product.name.trim();
  const suffix = `(${models.join(', ')})`;
  if (models.length && name.toLowerCase().endsWith(suffix.toLowerCase())) {
    name = name.slice(0, -suffix.length).trim();
  }
  for (const model of models) {
    const escaped = model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Move an existing model into the suffix instead of displaying it twice.
    name = name.replace(new RegExp(`\\(\\s*${escaped}\\s*\\)|\\[\\s*${escaped}\\s*\\]|(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'gi'), ' ');
  }
  name = name.replace(/\s+/g, ' ').trim();
  return models.length ? `${name} (${models.join(', ')})` : name;
};
