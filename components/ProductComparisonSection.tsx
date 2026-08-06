import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { getProductSlug } from '../services/backend';

interface ProductComparisonSectionProps {
  products: Product[];
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  className?: string;
  limit?: number;
}

const cleanText = (value: unknown): string =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getImage = (product: Product): string =>
  product.colors?.[0]?.images?.[0] || product.images?.[0] || product.variants?.[0]?.images?.[0] || '';

const getStock = (product: Product): number => {
  const firstColor = product.colors?.[0];
  if (firstColor) return Math.max(0, Number(firstColor.stock || 0) - Number(firstColor.reservedStock || 0));
  return Math.max(0, Number(product.stock || 0) - Number(product.reservedStock || 0));
};

const findSpec = (product: Product, pattern: RegExp): string => {
  const entries = Object.entries(product.specs || {});
  const exact = entries.find(([key]) => pattern.test(key));
  if (exact) return cleanText(exact[1]);

  const feature = (product.features || []).find((item) => pattern.test(item));
  return cleanText(feature);
};

const getFeatureSummary = (product: Product): string => {
  const features = (product.features || []).map(cleanText).filter(Boolean).slice(0, 5);
  if (features.length) return features.join(' | ');

  const specs = Object.values(product.specs || {}).map(cleanText).filter(Boolean).slice(0, 5);
  if (specs.length) return specs.join(' | ');

  return cleanText(product.description).split(/[.!?]/).map((item) => item.trim()).filter(Boolean).slice(0, 2).join(' | ');
};

const getProductFamily = (product: Product): 'band' | 'ring' | 'fan' | 'monitoring' | 'glasses' | 'other' => {
  const text = `${product.category} ${product.name} ${getFeatureSummary(product)}`.toLowerCase();
  if (/fan|air|cool|heat|hepa|bladeless/.test(text)) return 'fan';
  if (/ring/.test(text)) return 'ring';
  if (/band|bracelet|fitness|spo2|heart|sleep/.test(text)) return 'band';
  if (/monitor|chest|belt|recovery|sleep\s*tracker|bedside/.test(text)) return 'monitoring';
  if (/glass|camera|calling|voice/.test(text)) return 'glasses';
  return 'other';
};

const getBestFor = (product: Product): string => {
  const family = getProductFamily(product);
  if (family === 'fan') return 'Premium room comfort, airflow, and all-season convenience';
  if (family === 'ring') return 'Discreet health tracking with app-led wellness insights';
  if (family === 'band') return 'AI wellness, recovery, sleep, SpO2, and daily fitness tracking';
  if (family === 'monitoring') return 'Focused sleep, recovery, and performance monitoring';
  if (family === 'glasses') return 'Hands-free capture, calling, media, and smart utility';
  return 'Everyday connected living';
};

const getAdvancedFeatureStack = (product: Product): string => {
  const explicitFeatures = (product.features || []).map(cleanText).filter(Boolean);
  if (explicitFeatures.length >= 4) return explicitFeatures.slice(0, 6).join(' | ');

  const family = getProductFamily(product);
  if (family === 'band') return 'AI health reports | SpO2 | Heart rate | HRV/stress | Sleep insights | Recovery cues';
  if (family === 'ring') {
    const hasDisplay = /\b(display|screen)\b/i.test(product.name);
    return hasDisplay
      ? 'Built-in display | Sleep insights | HRV/stress | SpO2 | App reports | App sync'
      : 'Smart ring tracking | Sleep insights | HRV/stress | SpO2 | App reports | App sync';
  }
  if (family === 'fan') return 'Bladeless airflow | Quiet comfort | Remote control | Oscillation | Safety design | Selected heat/purifier modes';
  if (family === 'monitoring') return 'Sleep patterns | Recovery context | App reports | Long-term trends | Non-wearable comfort';
  if (family === 'glasses') return 'HD camera | Bluetooth calling | Music | Voice assistant | Hands-free controls';
  return getFeatureSummary(product) || 'Premium TheFutureX feature set';
};

const getSmartInsights = (product: Product): string => {
  const family = getProductFamily(product);
  const appSpec = findSpec(product, /app|bluetooth|connect|compatible|wifi|remote/i);

  if (family === 'band') return appSpec || 'TheFutureX app insights, AI reports, wellness trends, smart alerts, and habit guidance';
  if (family === 'ring') return appSpec || 'App-based wellness summaries, sleep reports, activity history, and trend tracking';
  if (family === 'fan') return appSpec || 'Remote controls, mode settings, timer support, and room comfort controls';
  if (family === 'monitoring') return appSpec || 'Sleep reports, recovery history, wellness trends, and simple app review';
  if (family === 'glasses') return appSpec || 'Bluetooth calling, media controls, voice assistant, and hands-free utility';
  return appSpec || 'Connected TheFutureX experience';
};

const formatPrice = (product: Product): string => {
  const price = Number(product.salePrice || product.price || 0);
  return price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'Check price';
};

const comparisonRows = [
  ['Price', (product: Product) => formatPrice(product)],
  ['Rating', (product: Product) => `${Number(product.rating || 4.8).toFixed(1)} / 5`],
  ['Reviews', (product: Product) => `${product.reviewCount || product.reviews?.length || 48}+ reviews`],
  ['Availability', (product: Product) => (getStock(product) > 0 ? 'In stock' : 'Notify me')],
  ['Warranty', (product: Product) => cleanText(product.warranty || findSpec(product, /warranty|guarantee/i)) || 'Brand support'],
  ['Advanced Features', (product: Product) => getAdvancedFeatureStack(product)],
  ['Smart Insights / Controls', (product: Product) => getSmartInsights(product)],
  ['Battery / Power', (product: Product) => findSpec(product, /battery|power|charging|runtime|watt|mah/i) || 'Everyday use ready'],
  ['Protection', (product: Product) => findSpec(product, /water|ip68|5atm|dust|filter|hepa|safety/i) || 'Built for daily handling'],
  ['Best For', (product: Product) => getBestFor(product)],
  ['Highlights', (product: Product) => getFeatureSummary(product) || getAdvancedFeatureStack(product)],
] as const;

export const ProductComparisonSection: React.FC<ProductComparisonSectionProps> = ({
  products,
  title = 'Compare Your Options',
  eyebrow = 'Comparison',
  subtitle = 'A quick side-by-side view to help you pick the model that fits your use case, budget, and daily routine.',
  className = '',
  limit = 4,
}) => {
  const comparisonProducts = useMemo(() => {
    return products
      .filter((product) => product && product.id)
      .sort((a, b) => {
        const aScore = Number(Boolean(a.isFeatured || a.isNewArrival)) + Number(Boolean(a.isBestSeller));
        const bScore = Number(Boolean(b.isFeatured || b.isNewArrival)) + Number(Boolean(b.isBestSeller));
        return bScore - aScore || Number(b.rating || 0) - Number(a.rating || 0) || a.name.localeCompare(b.name);
      })
      .slice(0, limit);
  }, [limit, products]);

  if (comparisonProducts.length === 0) return null;

  return (
    <section className={`product-comparison-section bg-white px-4 py-12 text-slate-950 sm:px-8 lg:px-10 lg:py-16 ${className}`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#1ca9a4]">{eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-black leading-tight text-slate-950 sm:text-5xl">{title}</h2>
          </div>
          <p className="mx-auto max-w-2xl text-sm font-medium leading-7 text-slate-600 lg:mx-0 lg:text-base">{subtitle}</p>
        </div>

        <div className="space-y-4 sm:hidden">
          {comparisonProducts.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_34px_rgba(15,63,70,0.08)]">
              <Link to={`/product/${getProductSlug(product)}`} className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 border-b border-slate-200 bg-[#fbfdfd] p-3">
                <div className="grid h-24 place-items-center rounded-lg bg-white p-2">
                  {getImage(product) ? (
                    <img src={getImage(product)} alt={product.name} className="h-full w-full object-contain" loading="lazy" decoding="async" />
                  ) : (
                    <span className="text-xs font-bold text-slate-400">TheFutureX</span>
                  )}
                </div>
                <div className="min-w-0 self-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1ca9a4]">Model</p>
                  <h3 className="mt-1 text-sm font-black leading-5 text-slate-950">{product.name}</h3>
                </div>
              </Link>
              <table className="w-full table-fixed border-collapse text-left text-xs">
                <tbody>
                  {comparisonRows.map(([label, getValue]) => (
                    <tr key={`${product.id}-${label}`} className="border-b border-slate-100 last:border-b-0">
                      <th className="w-[38%] bg-[#f3f8f8] px-3 py-3 align-top text-[10px] font-black uppercase tracking-[0.08em] text-slate-600">
                        {label}
                      </th>
                      <td className="break-words px-3 py-3 align-top font-semibold leading-5 text-slate-800">
                        {getValue(product)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-[#fbfdfd] shadow-[0_18px_55px_rgba(15,63,70,0.08)] sm:block">
          <div className="grid min-w-[760px]" style={{ gridTemplateColumns: `180px repeat(${comparisonProducts.length}, minmax(145px, 1fr))` }}>
            <div className="border-b border-r border-slate-200 bg-slate-950 p-4 text-xs font-black uppercase tracking-[0.2em] text-white">
              Models
            </div>
            {comparisonProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${getProductSlug(product)}`}
                className="group border-b border-r border-slate-200 bg-white p-4 transition hover:bg-[#f0fbfb]"
              >
                <div className="flex min-h-24 items-center justify-center rounded-lg bg-[#f7fbfb] p-2">
                  {getImage(product) ? (
                    <img src={getImage(product)} alt={product.name} className="h-20 w-full object-contain transition duration-300 group-hover:scale-[1.03]" loading="lazy" decoding="async" />
                  ) : (
                    <span className="text-xs font-bold text-slate-400">TheFutureX</span>
                  )}
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-black leading-5 text-slate-950 transition group-hover:text-[#117c78]">{product.name}</h3>
              </Link>
            ))}

            {comparisonRows.map(([label, getValue]) => (
              <React.Fragment key={label}>
                <div className="border-b border-r border-slate-200 bg-[#f3f8f8] p-4 text-xs font-black uppercase tracking-[0.12em] text-slate-600">
                  {label}
                </div>
                {comparisonProducts.map((product) => (
                  <div key={`${product.id}-${label}`} className="border-b border-r border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-800">
                    {getValue(product)}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
