import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Activity } from 'lucide-react';
import { Button } from '../components/Button';
import { ProductCard } from '../components/ProductCard';
import { MOCK_PRODUCTS } from '../constants';

export const Home: React.FC = () => {
  const featuredProducts = MOCK_PRODUCTS.filter(p => p.isBestSeller || p.isNew).slice(0, 4);
  const bandProducts = MOCK_PRODUCTS.filter(p => p.category === 'bands').slice(0, 2);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/50 to-transparent"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 mb-6 animate-fade-in-up">
            THE FUTURE OF <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              CONNECTED LIVING
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Experience the next generation of smart wearables and home devices. 
            Seamlessly integrated, beautifully designed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products/bands">
              <Button size="lg" className="group shadow-xl shadow-cyan-500/20">
                Shop Wearables
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/products/fans">
                <Button variant="outline" size="lg" className="bg-white/80 backdrop-blur">Explore Home</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-lg hover:border-primary/50 transition-colors">
              <Activity className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Advanced Health Monitoring</h3>
              <p className="text-slate-500">Clinical-grade sensors for heart rate, SpO2, and sleep tracking.</p>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-lg hover:border-secondary/50 transition-colors">
              <Zap className="w-12 h-12 text-secondary mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Long-Lasting Battery</h3>
              <p className="text-slate-500">Weeks of battery life with our proprietary energy-efficient chips.</p>
            </div>
            <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-lg hover:border-accent/50 transition-colors">
              <ShieldCheck className="w-12 h-12 text-accent mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-3">Premium Build Quality</h3>
              <p className="text-slate-500">Aerospace-grade titanium and sapphire glass materials.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Trending Now</h2>
              <p className="text-slate-500">Our most popular devices this week.</p>
            </div>
            <Link to="/products/bands" className="text-primary hover:text-cyan-700 font-medium flex items-center">
              View All <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Category Showcase: Bands */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/3">
              <h2 className="text-4xl font-display font-bold text-slate-900 mb-6">Smart Bands Series</h2>
              <p className="text-lg text-slate-600 mb-8">
                Lightweight, powerful, and stylish. The perfect companion for your fitness journey.
              </p>
              <Link to="/products/bands">
                 <Button size="lg" variant="secondary">Explore Series</Button>
              </Link>
            </div>
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
                {bandProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};