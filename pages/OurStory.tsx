import React from 'react';
import { Link } from 'react-router-dom';

export const OurStory: React.FC = () => (
  <section className="home-story-section min-h-[60vh] bg-slate-950 px-4 py-16 text-white sm:px-8 sm:py-24">
    <div className="mx-auto max-w-4xl">
      <p className="home-story-eyebrow text-xs font-black uppercase tracking-[0.2em] text-cyan-300">About TheFutureX</p>
      <h1 className="home-story-heading mt-3 font-display text-4xl font-black sm:text-5xl">Our Story</h1>
      <div className="home-story-copy mt-8 space-y-5 text-sm leading-7 text-slate-200 sm:text-base">
        <p>It started with a simple frustration: most smart wearables in India either looked cheap or cost a fortune. We set out to build something different — AI-powered smart bands, smart rings, and connected wearables with health tracking, Bluetooth calling, and high-quality displays, priced for everyday people, not just early adopters. That is how TheFutureX (TFX) began.</p>
        <p>Today, TheFutureX is an emerging Indian smart wearables and connected lifestyle brand built around a simple promise: technology should make your day easier, not more complicated. Our smart bands and smart rings deliver real-time heart-rate monitoring, SpO2 tracking, sleep insights, and multi-day battery life, all synced to a companion app so you get answers, not noise.</p>
        <p>Our bladeless fan range brings that same everyday-smart thinking home, with safe, quiet, no-exposed-blade airflow, cooling and heating modes, and remote-control convenience for modern Indian homes. We work to keep premium features accessible, and every product is backed by clear <Link to="/info/warranty-policy" className="home-story-link font-bold text-cyan-300 underline underline-offset-4 hover:text-cyan-100">warranty</Link> support.</p>
      </div>
    </div>
  </section>
);
