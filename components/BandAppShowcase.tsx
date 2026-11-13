import React, { useEffect, useId, useRef, useState } from 'react';
import appAssistantScreen from '../assets/images/tfxvital-ai-assistant-screen.webp';
import appVitalAgeScreen from '../assets/images/tfxvital-vital-age-screen.webp';
import appExerciseScreen from '../assets/images/tfxvital-exercise-screen.webp';
import './BandAppShowcase.css';

const screens = [
  { title: 'AI Assistant', detail: 'Get insights from your daily wellness data.', image: appAssistantScreen },
  { title: 'Vital Age Estimate', detail: 'See your vital age estimate from activity and sleep.', image: appVitalAgeScreen },
  { title: 'Workout Tracking', detail: 'Track runs, distance and pace with GPS.', image: appExerciseScreen },
];

export function BandAppShowcase() {
  const [selected, setSelected] = useState(0);
  const [visible, setVisible] = useState(false);
  const section = useRef<HTMLElement>(null);
  const headingId = useId();
  const screen = screens[selected];

  useEffect(() => {
    if (!section.current) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(section.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    // Warm the browser cache without stacking multiple phone images in the DOM.
    screens.forEach(item => { const image = new Image(); image.src = item.image; });
  }, [visible]);

  useEffect(() => {
    if (!visible || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setSelected(current => (current + 1) % screens.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [visible]);

  return <section ref={section} className="band-app-showcase" aria-labelledby={headingId} aria-roledescription="carousel">
    <div className="band-app-showcase__layout">
      <div className="band-app-showcase__copy">
        <h2 id={headingId}>TFXVital app</h2>
        <div className="band-app-showcase__details">
          <h3>{screen.title}</h3>
          <p>{screen.detail}</p>
        </div>
      </div>
      <div className="band-app-showcase__phone">
        <div className="band-app-showcase__screens">
          <img src={screen.image} alt={`${screen.title} in the TFXVital app`} width={440} height={660} loading="lazy" decoding="async" />
        </div>
        <span className="band-app-showcase__counter" aria-hidden="true">0{selected + 1}<span> / 0{screens.length}</span></span>
      </div>
    </div>
  </section>;
}
