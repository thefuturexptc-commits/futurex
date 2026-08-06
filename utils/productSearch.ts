import type { Product } from '../types';

const normalizeLoose = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const normalizeCompact = (value = '') => normalizeLoose(value).replace(/[^a-z0-9]+/g, '');

const pushUnique = (target: string[], value?: string | number | null) => {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean && !target.includes(clean)) target.push(clean);
};

const flattenTextValues = (value: unknown): string[] => {
  if (!value) return [];
  if (typeof value === 'string' || typeof value === 'number') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(flattenTextValues);
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).flatMap(flattenTextValues);
  return [];
};

const addModelAliases = (target: string[], value?: string | number | null) => {
  const compact = normalizeCompact(String(value || ''));
  if (!compact) return;

  pushUnique(target, compact);

  const match = compact.match(/^([a-z]{1,6})(0*\d{1,5}[a-z]?)$/i);
  if (!match) return;

  const [, prefix, suffix] = match;
  pushUnique(target, `${prefix}-${suffix}`);
  pushUnique(target, `${prefix} ${suffix}`);

  const noLeadingZero = suffix.replace(/^0+(?=\d)/, '');
  if (noLeadingZero && noLeadingZero !== suffix) {
    pushUnique(target, `${prefix}${noLeadingZero}`);
    pushUnique(target, `${prefix}-${noLeadingZero}`);
    pushUnique(target, `${prefix} ${noLeadingZero}`);
  }

  if (suffix.startsWith('0')) {
    pushUnique(target, `${prefix}0`);
  }
};

export const getProductModelIdentifiers = (product: Product): string[] => {
  const identifiers: string[] = [];

  pushUnique(identifiers, product.modelNumber);
  (product.modelNumbers || []).forEach((model) => pushUnique(identifiers, model));

  const specs = product.specs || {};
  Object.entries(specs).forEach(([key, value]) => {
    if (/(model|sku|serial|code|item\s*no|product\s*id|pid)/i.test(key)) {
      pushUnique(identifiers, value);
    }
  });

  const searchableText = [
    product.id,
    product.slug,
    product.name,
    product.description,
    ...(product.features || []),
    ...Object.values(specs),
  ].join(' ');

  const matches = searchableText.match(/\b[a-z]{1,6}[-\s]?\d{1,5}[a-z]?\b/gi) || [];
  matches.forEach((match) => pushUnique(identifiers, match));

  const slug = normalizeLoose(product.slug || product.name || product.id);
  if (/pureair|3\s*in\s*1|tp[-\s]?02/.test(slug)) {
    ['TP02', 'TP-02', 'TP 02', 'TP0'].forEach((alias) => pushUnique(identifiers, alias));
  }
  if (/tp[-\s]?09|hot.*cool|coolair|10x/.test(slug)) {
    ['TP09', 'TP-09', 'TP 09', 'TP0'].forEach((alias) => pushUnique(identifiers, alias));
  }

  const withAliases = [...identifiers];
  identifiers.forEach((identifier) => addModelAliases(withAliases, identifier));

  return Array.from(new Set(withAliases.map((item) => item.trim()).filter(Boolean)));
};

export const scoreProductSearch = (product: Product, rawQuery: string): number => {
  const query = normalizeLoose(rawQuery);
  const compactQuery = normalizeCompact(rawQuery);
  if (!query || !compactQuery) return 0;

  const name = normalizeLoose(product.name);
  const category = normalizeLoose(product.category);
  const description = normalizeLoose(product.description || '');
  const id = normalizeLoose(product.id);
  const slug = normalizeLoose(product.slug || '');
  const keywords = flattenTextValues(product.searchKeywords);
  const secondaryText = normalizeLoose(
    [
      description,
      id,
      slug,
      product.warranty,
      product.weight,
      product.bandType,
      ...(product.features || []),
      ...flattenTextValues(product.specs),
      ...keywords,
    ].join(' ')
  );
  const compactSecondary = normalizeCompact(secondaryText);
  const modelIdentifiers = getProductModelIdentifiers(product);
  const compactModels = modelIdentifiers.map(normalizeCompact).filter(Boolean);

  let score = 0;
  if (compactModels.some((model) => model === compactQuery)) score += 160;
  if (compactQuery.length >= 3 && compactModels.some((model) => model.startsWith(compactQuery))) score += 145;
  if (compactQuery.length >= 3 && compactModels.some((model) => model.includes(compactQuery))) score += 115;
  if (name === query) score += 120;
  if (name.startsWith(query)) score += 90;
  if (name.includes(query)) score += 70;
  if (category === query || category === `smart ${query}` || category.includes(query)) score += 100;
  if (secondaryText.includes(query)) score += 20;
  if (compactQuery.length >= 3 && compactSecondary.includes(compactQuery)) score += 18;

  return score;
};

export const productMatchesSearch = (product: Product, rawQuery: string): boolean =>
  scoreProductSearch(product, rawQuery) > 0;
