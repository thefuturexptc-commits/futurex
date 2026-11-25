import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './StorefrontEngagement.css';

const comparisons = [
  ['How you wear it', 'On your wrist', 'On your finger'],
  ['Style', 'Sporty wrist accessory', 'Discreet jewellery style'],
  ['Fit', 'Choose a compatible strap', 'Choose your ring size carefully'],
  ['Features and battery', 'Vary by model; compare specifications', 'Vary by model; compare specifications'],
];

export function WearableFinder() {
  const [preference, setPreference] = useState('');
  const [routine, setRoutine] = useState('');
  const [showResult, setShowResult] = useState(false);
  const ring = preference === 'discreet' || (preference === 'either' && routine === 'sleep');
  return <section className="wearable-finder mx-auto max-w-6xl px-4 py-12 text-slate-950" aria-labelledby="finder-title">
    <h2 id="finder-title" className="text-2xl font-bold">Which one is right for me?</h2>
    <p className="mt-2 text-slate-600">Compare smart bands and rings, then find your preferred fit.</p>
    <table className="mt-5 w-full table-fixed break-words text-left text-xs leading-5 [&_td]:p-2 [&_td]:align-top [&_th]:p-2 [&_th]:align-top sm:table-auto sm:text-sm sm:[&_td]:p-3 sm:[&_th]:p-3">
      <caption className="sr-only">Smart band and smart ring comparison</caption>
      <thead>
        <tr className="border-b">
          <th scope="col">Consideration</th>
          <th scope="col">Smart band</th>
          <th scope="col">Smart ring</th>
        </tr>
      </thead>
      <tbody>
        {comparisons.map(([consideration, band, ring]) => (
          <tr key={consideration} className="border-b">
            <th scope="row">{consideration}</th>
            <td>{band}</td>
            <td>{ring}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <form className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-2" onChange={() => setShowResult(false)} onSubmit={event => { event.preventDefault(); setShowResult(true); }}>
      <label className="text-sm font-semibold">How do you like to wear technology?<select required value={preference} onChange={event => setPreference(event.target.value)} className="mt-2 w-full rounded-lg border bg-white p-3"><option value="">Choose your preference</option><option value="wrist">On my wrist</option><option value="discreet">As discreet jewellery</option><option value="either">Either works</option></select></label>
      <label className="text-sm font-semibold">What matters most in your routine?<select required value={routine} onChange={event => setRoutine(event.target.value)} className="mt-2 w-full rounded-lg border bg-white p-3"><option value="">Choose your priority</option><option value="activity">Everyday activity</option><option value="sleep">Sleep and overnight comfort</option><option value="style">Style and everyday convenience</option></select></label>
      <button className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white sm:col-span-2">Find my fit</button>
      {showResult && <div role="status" className="sm:col-span-2"><p className="font-semibold">Start with a smart {ring ? 'ring' : 'band'}.</p><p className="mt-1 text-sm text-slate-600">Based on your wearing preference and routine. Check each model’s specifications and fit before ordering.</p><Link className="mt-3 inline-block font-semibold text-teal-700 underline" to={ring ? '/smart-rings' : '/smart-bands'}>Explore smart {ring ? 'rings' : 'bands'}</Link></div>}
    </form>
  </section>;
}
