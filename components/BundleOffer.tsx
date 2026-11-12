import React, { useEffect, useMemo, useState } from 'react';
import { Product } from '../types';
import { getProducts } from '../services/backend';
import { useCart } from '../context/CartContext';
import { formatInrAmount, getAutomaticOfferItemPricing } from '../utils/coupons';
import './StorefrontEngagement.css';
import { getBundleChoices } from '../utils/bundleChoices.js';

export function BundleOffer({ catalog }: { catalog?: Product[] }) {
  const [products, setProducts] = useState<Product[]>(catalog || []);
  const [band, setBand] = useState('');
  const [ring, setRing] = useState('');
  const { addToCart } = useCart();
  useEffect(() => { if (catalog) setProducts(catalog); else void getProducts().then(setProducts).catch(() => {}); }, [catalog]);
  const bands = useMemo(() => getBundleChoices(products, 'band'), [products]);
  const rings = useMemo(() => getBundleChoices(products, 'ring'), [products]);
  if (!bands.length || !rings.length) return null;
  const selected = [band === '' ? null : bands[Number(band)]?.product, ring === '' ? null : rings[Number(ring)]?.product].filter(Boolean) as Product[];
  const pricing = selected.map(product => getAutomaticOfferItemPricing(product));
  const total = pricing.reduce((sum, item) => sum + item.unitOfferPrice, 0);
  const savings = pricing.reduce((sum, item) => sum + item.unitDiscount, 0);
  return <section className="bundle-offer mx-auto my-8 max-w-6xl rounded-2xl border border-teal-200 bg-teal-50 p-5 text-slate-950 sm:p-8" aria-label="Bundle and save">
    <h2 className="text-2xl font-bold">Bundle and save: Smart Band + Smart Ring</h2>
    <p className="mt-2 text-sm text-slate-600">Choose your models, colours and ring size. Current catalog offers apply automatically in your cart.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">{[{ title: 'Smart band', value: band, set: setBand, options: bands }, { title: 'Smart ring', value: ring, set: setRing, options: rings }].map(field => <label key={field.title} className="text-sm font-semibold">{field.title}<select className="mt-2 w-full rounded-lg border bg-white p-3" value={field.value} onChange={event => field.set(event.target.value)}><option value="">Choose model and fit</option>{field.options.map((option, index) => <option key={index} value={index}>{option.label}</option>)}</select></label>)}</div>
    {selected.length === 2 && <p className="mt-4 font-bold">Bundle total: {formatInrAmount(total)} {savings > 0 && <span className="ml-2 text-teal-700">Save {formatInrAmount(savings)}</span>}</p>}
    <button type="button" disabled={selected.length !== 2} className="mt-5 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-40" onClick={() => { if (selected.length !== 2) return; addToCart(selected[0], 1, { openCart: false }); addToCart(selected[1], 1); setBand(''); setRing(''); }}>Add bundle to cart</button>
  </section>;
}
