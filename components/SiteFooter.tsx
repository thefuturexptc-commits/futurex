import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import brandLogo from '../assets/images/thefuturex-logo-header.png';

/**
 * Fades a footer block up into view the first time it scrolls into the
 * viewport, mirroring the homepage's reveal treatment. Returns a ref/style/
 * className trio meant to be spread onto the *existing* footer element
 * rather than wrapping it, so the original grid/flex layout is untouched.
 * Respects prefers-reduced-motion.
 */
function useFooterReveal<T extends HTMLElement>(delayMs = 0) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof window === 'undefined') return undefined;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return {
    ref,
    style: { transitionDelay: visible ? `${delayMs}ms` : '0ms' } as React.CSSProperties,
    className: `tfx-footer-reveal transition-all duration-700 ease-out ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`,
  };
}

const trustBadges: Array<{ id: string; label: string; icon: React.ReactNode }> = [
  {
    id: 'secure',
    label: 'Secure Checkout',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
        <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      </svg>
    ),
  },
  {
    id: 'shipping',
    label: 'Pan-India Shipping',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <circle cx="7.5" cy="18" r="1.6" />
        <circle cx="17.5" cy="18" r="1.6" />
      </svg>
    ),
  },
  {
    id: 'verified',
    label: 'Verified Business',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m9 12 2 2 4-4" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
];

const CONTACT_EMAIL = 'thefuturex.ptc@gmail.com';
const CONTACT_PHONE = '8530340676';
const SALES_EMAIL = 'thefuturex.ptc@gmail.com';
const INSTAGRAM_URL = 'https://www.instagram.com/thefuturex.in/';
const FACEBOOK_URL = 'https://www.facebook.com/people/The-Future-X-India/61585558692279/';
const YOUTUBE_URL = 'https://www.youtube.com/@TheFutureXdotin';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.futurex.smartwear';
const CONTACT_ADDRESS = [
  'TheFutureX',
  'Office No: 201-202, Hirubai Residency',
  'Besides Vedant Hospital',
  'Near Virar East-West Flyover, Virar West',
];

const quickLinks = [
  { label: 'New Launches', to: '/new-arrivals' },
  { label: 'Best Sellers', to: '/best-sellers' },
  { label: 'Blog', to: '/blog' },
  { label: 'Smart Wearables', to: '/smart-bands' },
  { label: 'Smart Rings', to: '/smart-rings' },
  { label: 'Bladeless Fans', to: '/bladeless-fan' },
  { label: 'Smart Monitoring', to: '/smart-monitoring' },
];

const companyLinks = [
  { label: 'Our Story', to: '/our-story' },
  { label: 'About us', to: '/info/about-us' },
  { label: 'Why Choose The Future X', to: '/info/why-choose-the-future-x' },
  { label: 'Contact Us', to: '/info/contact' },
  { label: 'Shop All Products', to: '/shop/all' },
];

const supportLinks = [
  { label: 'Track Your Order', to: '/track-order' },
  { label: 'Give Feedback', to: '/raise-complaint' },
  { label: 'Register Your Product', to: '/register-warranty' },
  { label: 'Registration Policy', to: '/info/register-policy' },
  { label: 'Warranty Policy', to: '/info/warranty-policy' },
  { label: 'Shipping Policy', to: '/info/shipping' },
  { label: 'Return & Refund Policy', to: '/info/returns-refund' },
  { label: 'Privacy Policy', to: '/info/privacy' },
  { label: 'Terms of Service', to: '/info/terms' },
];

const associatePartnerLinks = [
  {
    label: 'Ilika',
    href: 'https://ilika.in/',
    logoSrc: 'https://www.google.com/s2/favicons?domain=ilika.in&sz=96',
  },
  {
    label: 'PTCGRAM',
    href: 'https://ptcgram.com/',
    logoSrc: 'https://www.google.com/s2/favicons?domain=ptcgram.com&sz=96',
  },
  {
    label: 'SS Packaging',
    href: 'https://www.sspackaging.co.in/',
    logoSrc: 'https://www.google.com/s2/favicons?domain=sspackaging.co.in&sz=96',
  },
];

const socialLinks = [
  {
    label: 'Instagram',
    href: INSTAGRAM_URL,
    icon: (
      <svg className="tfx-footer__social-icon tfx-footer__social-icon--instagram" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="instagramGradient" cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="5%" stopColor="#fdf497" />
            <stop offset="45%" stopColor="#fd5949" />
            <stop offset="60%" stopColor="#d6249f" />
            <stop offset="90%" stopColor="#285aeb" />
          </radialGradient>
        </defs>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="url(#instagramGradient)" />
        <circle cx="12" cy="12" r="4.1" fill="none" stroke="#ffffff" strokeWidth="1.8" />
        <circle cx="17.3" cy="6.8" r="1.2" fill="#ffffff" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: FACEBOOK_URL,
    icon: (
      <svg className="tfx-footer__social-icon tfx-footer__social-icon--facebook" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" fill="#1877f2" />
        <path fill="#ffffff" d="M14.8 12.6h-2v7.2H9.9v-7.2H8.4v-2.5h1.5V8.5c0-1.2.6-3.2 3.2-3.2h2.4v2.6h-1.7c-.3 0-1 .2-1 .9v1.3h2.6l-.6 2.5Z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: YOUTUBE_URL,
    icon: (
      <svg className="tfx-footer__social-icon tfx-footer__social-icon--youtube" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="#ff0000" d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.6 4.6 12 4.6 12 4.6s-5.6 0-7.5.5a3 3 0 0 0-2.1 2.1C2 9 2 12 2 12s0 3 .4 4.8a3 3 0 0 0 2.1 2.1c1.9.5 7.5.5 7.5.5s5.6 0 7.5-.5a3 3 0 0 0 2.1-2.1C22 15 22 12 22 12s0-3-.4-4.8Z" />
        <path fill="#ffffff" d="m10 15.5 6-3.5-6-3.5v7Z" />
      </svg>
    ),
  },
  {
    label: 'Play Store',
    href: PLAY_STORE_URL,
    icon: (
      <svg className="tfx-footer__social-icon tfx-footer__social-icon--play-store" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="#00a0ff" d="M4.2 2.7c-.4.3-.7.8-.7 1.5v15.6c0 .7.3 1.2.7 1.5l8.8-9.3-8.8-9.3Z" />
        <path fill="#00f076" d="m13.8 11.2 2.8-2.9L6 2.3c-.5-.3-1-.2-1.5.1l9.3 8.8Z" />
        <path fill="#ffce00" d="m13.8 12.8-9.3 8.8c.4.3 1 .4 1.5.1l10.6-6-2.8-2.9Z" />
        <path fill="#ff3a44" d="m17.8 9 3.1 1.8c.9.5.9 1.9 0 2.4L17.8 15 14.8 12l3-3Z" />
      </svg>
    ),
  },
];

export const SiteFooter: React.FC = () => {
  const mobileSections = [
    { title: 'Quick Links', items: quickLinks },
    { title: 'Company', items: companyLinks },
    { title: 'Support', items: supportLinks },
  ];

  const currentYear = new Date().getFullYear();

  const brandReveal = useFooterReveal<HTMLDivElement>(0);
  const quickLinksReveal = useFooterReveal<HTMLElement>(70);
  const companyReveal = useFooterReveal<HTMLElement>(100);
  const supportReveal = useFooterReveal<HTMLElement>(130);
  const partnersColumnReveal = useFooterReveal<HTMLElement>(160);
  const contactReveal = useFooterReveal<HTMLDivElement>(100);
  const mobileSectionsReveal = useFooterReveal<HTMLDivElement>(60);

  return (
    <footer className="site-footer-dark tfx-footer tfx-footer-premium">
      <style>{`
        .tfx-footer-premium {
          position: relative;
          overflow: hidden;
        }
        .tfx-footer-premium::before {
          content: '';
          position: absolute;
          inset: 0 0 auto 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #1ca9a4, #0ea5e9, #1ca9a4, transparent);
          background-size: 200% 100%;
          animation: tfx-footer-shimmer 6s linear infinite;
        }
        @keyframes tfx-footer-shimmer {
          from { background-position: 0% 0; }
          to { background-position: -200% 0; }
        }
        .tfx-footer-premium__trust {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 0.6rem 1.75rem;
          margin-top: 1.1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .tfx-footer-premium__trust-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.78);
        }
        .tfx-footer-premium__trust-item svg {
          color: #1ca9a4;
          flex-shrink: 0;
        }
        /* Secure Checkout: the padlock gives a little reassuring "click" */
        .tfx-footer-premium__trust-item--secure svg {
          transform-origin: 50% 85%;
          animation: tfx-lock-secure 3s ease-in-out infinite;
        }
        @keyframes tfx-lock-secure {
          0%, 55%, 100% { transform: rotate(0deg); }
          62% { transform: rotate(-9deg); }
          69% { transform: rotate(7deg); }
          76% { transform: rotate(-4deg); }
          83% { transform: rotate(0deg); }
        }
        /* Pan-India Shipping: the truck drives forward and resets */
        .tfx-footer-premium__trust-item--shipping svg {
          animation: tfx-truck-drive 2.4s ease-in-out infinite;
        }
        @keyframes tfx-truck-drive {
          0% { transform: translateX(0); }
          45% { transform: translateX(5px); }
          50% { transform: translateX(5px); }
          95% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }
        /* Verified Business: the check mark pops to confirm */
        .tfx-footer-premium__trust-item--verified svg {
          animation: tfx-verified-pop 3s ease-in-out infinite;
        }
        @keyframes tfx-verified-pop {
          0%, 50%, 100% { transform: scale(1); }
          58% { transform: scale(1.22); }
          66% { transform: scale(0.96); }
          74% { transform: scale(1.08); }
          82% { transform: scale(1); }
        }
        .tfx-footer-premium .tfx-footer__socials a {
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .tfx-footer-premium .tfx-footer__socials a:hover {
          transform: translateY(-3px) scale(1.06);
          box-shadow: 0 10px 22px rgba(14,165,233,0.25);
        }
        .tfx-footer-premium .tfx-footer__partners-list a {
          position: relative;
          border-radius: 999px;
          transition: transform 220ms ease, filter 220ms ease, opacity 220ms ease, box-shadow 220ms ease;
          filter: grayscale(100%);
          opacity: 0.78;
          box-shadow: 0 6px 16px rgba(15,23,42,0.1);
        }
        .tfx-footer-premium .tfx-footer__partners-list a:hover {
          filter: grayscale(0%);
          opacity: 1;
          transform: translateY(-3px);
          box-shadow: 0 14px 30px rgba(14,165,233,0.28);
        }
        .tfx-footer-premium .tfx-footer__partners-list a img {
          border-radius: 999px;
          box-shadow: 0 0 0 2px rgba(15,23,42,0.06);
          transition: transform 220ms ease, box-shadow 220ms ease;
        }
        .tfx-footer-premium .tfx-footer__partners-list a:hover img {
          transform: scale(1.1);
          box-shadow: 0 0 0 2px rgba(28,169,164,0.65);
        }
        .tfx-footer-premium .tfx-footer__partners-list a span {
          transition: color 220ms ease;
        }
        .tfx-footer-premium .tfx-footer__partners-list a:hover span {
          color: #1ca9a4;
        }
        .tfx-footer-premium .tfx-footer__column a,
        .tfx-footer-premium .tfx-footer__complaint {
          position: relative;
          transition: color 200ms ease, padding-left 200ms ease;
        }
        .tfx-footer-premium .tfx-footer__column a::before {
          content: '';
          position: absolute;
          left: -12px;
          top: 50%;
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #1ca9a4;
          transform: translateY(-50%) scale(0);
          transition: transform 200ms ease;
        }
        .tfx-footer-premium .tfx-footer__column a:hover::before {
          transform: translateY(-50%) scale(1);
        }
        .tfx-footer-premium .tfx-footer__column a:hover {
          padding-left: 4px;
        }
        .tfx-footer-premium__newsletter-row input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(28,169,164,0.35);
        }
        .tfx-footer-premium__newsletter-row button {
          position: relative;
          overflow: hidden;
          background: linear-gradient(120deg, #1ca9a4, #0ea5e9);
          transition: transform 200ms ease, box-shadow 200ms ease;
        }
        .tfx-footer-premium__newsletter-row button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(14,165,233,0.3);
        }
        .tfx-footer-premium__newsletter-row button:active {
          transform: translateY(0) scale(0.97);
        }
        .tfx-footer-premium__bottom {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 1.1rem 0 1.6rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: rgba(255,255,255,0.58);
        }
        .tfx-footer-premium__bottom a {
          color: rgba(255,255,255,0.58);
          text-decoration: none;
          transition: color 180ms ease;
        }
        .tfx-footer-premium__bottom a:hover { color: #ffffff; }
        .tfx-footer-premium__bottom-links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1.1rem;
        }
        .tfx-footer-premium__to-top {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          font-weight: 800;
          letter-spacing: 0.03em;
          color: rgba(255,255,255,0.58);
          transition: color 180ms ease, transform 180ms ease;
        }
        .tfx-footer-premium__to-top:hover {
          color: #1ca9a4;
          transform: translateY(-2px);
        }
        @media (prefers-reduced-motion: reduce) {
          .tfx-footer-premium::before { animation: none; }
          .tfx-footer-premium__trust-item--secure svg,
          .tfx-footer-premium__trust-item--shipping svg,
          .tfx-footer-premium__trust-item--verified svg {
            animation: none;
          }
        }
      `}</style>

      <div className="tfx-footer__inner">
        <div
          ref={brandReveal.ref}
          style={brandReveal.style}
          className={`tfx-footer__brand ${brandReveal.className}`}
        >
          <Link to="/" className="tfx-footer__logo" aria-label="TheFutureX home">
            <img src={brandLogo} alt="TheFutureX" />
          </Link>
          <div className="tfx-footer__brand-copy">
            <p>
              Discover smart wearables, rings, monitoring devices and comfort technology designed
 for everyday, connected living and modern homes.
            </p>
            <div className="tfx-footer__socials tfx-footer__socials--brand" aria-label="Social media links">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open TheFutureX on ${item.label}`}
                  title={item.label}
                >
                  {item.icon}
                </a>
              ))}
            </div>
            <div className="tfx-footer__partners" aria-label="Associate partner logos">
              <span className="tfx-footer__partners-title">Associate Partners</span>
              <div className="tfx-footer__partners-list">
                {associatePartnerLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${item.label}`}
                    title={item.label}
                  >
                    <img src={item.logoSrc} alt={`${item.label} logo`} loading="lazy" decoding="async" />
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="tfx-footer-premium__trust" aria-label="Store trust indicators">
              {trustBadges.map((badge) => (
                <span
                  key={badge.id}
                  className={`tfx-footer-premium__trust-item tfx-footer-premium__trust-item--${badge.id}`}
                >
                  {badge.icon}
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <nav
          ref={quickLinksReveal.ref}
          style={quickLinksReveal.style}
          className={`tfx-footer__column ${quickLinksReveal.className}`}
          aria-label="Quick links"
        >
          <h4>Quick Links</h4>
          <ul>
            {quickLinks.map((item) => (
              <li key={item.label}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav
          ref={companyReveal.ref}
          style={companyReveal.style}
          className={`tfx-footer__column ${companyReveal.className}`}
          aria-label="Company"
        >
          <h4>Company</h4>
          <ul>
            {companyLinks.map((item) => (
              <li key={item.label}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav
          ref={supportReveal.ref}
          style={supportReveal.style}
          className={`tfx-footer__column ${supportReveal.className}`}
          aria-label="Support"
        >
          <h4>Support</h4>
          <ul>
            {supportLinks.map((item) => (
              <li key={item.label}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav
          ref={partnersColumnReveal.ref}
          style={partnersColumnReveal.style}
          className={`tfx-footer__column ${partnersColumnReveal.className}`}
          aria-label="Associate partners"
        >
          <h4>Associate Partners</h4>
          <ul>
            {associatePartnerLinks.map((item) => (
              <li key={item.label}>
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div
          ref={contactReveal.ref}
          style={contactReveal.style}
          className={`tfx-footer__contact ${contactReveal.className}`}
        >
          <h4>Get In Touch</h4>
          <address>
            <strong>PTCGRAM PRIVATE LIMITED</strong>
            {CONTACT_ADDRESS.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>

          <div className="tfx-footer__support">
            <strong>For queries and feedback, write to us at:</strong>
            <span>
              Email:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </span>
            <span>
              Phone:{' '}
              <a href={`tel:${CONTACT_PHONE}`}>
                {CONTACT_PHONE}
              </a>
            </span>
            <span>(Monday - Saturday, 10:00 AM to 06:30 PM IST)</span>
          </div>

          <p className="tfx-footer__sales">
            <strong>Sales Enquiry:</strong>{' '}
            <a href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a>
          </p>

          <form
            className="tfx-footer__newsletter"
            onSubmit={(event) => event.preventDefault()}
          >
            <label htmlFor="footer-newsletter">Subscribe to Our Newsletter</label>
            <div className="tfx-footer-premium__newsletter-row">
              <input id="footer-newsletter" type="email" placeholder="Your Email Address" />
              <button type="submit">Subscribe</button>
            </div>
          </form>

          <Link className="tfx-footer__complaint" to="/raise-complaint">
            Give Feedback
          </Link>
        </div>

        <div
          ref={mobileSectionsReveal.ref}
          style={mobileSectionsReveal.style}
          className={`tfx-footer__mobile-sections ${mobileSectionsReveal.className}`}
          aria-label="Footer links"
        >
          {mobileSections.map((section) => (
            <details key={section.title} className="tfx-footer__mobile-section">
              <summary>{section.title}</summary>
              <ul>
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}

          <details className="tfx-footer__mobile-section">
            <summary>Associate Partners</summary>
            <ul>
              {associatePartnerLinks.map((item) => (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </details>

          <details className="tfx-footer__mobile-section">
            <summary>Get In Touch</summary>
            <div className="tfx-footer__mobile-contact">
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              <a href={`tel:${CONTACT_PHONE}`}>{CONTACT_PHONE}</a>
              <Link to="/raise-complaint">Give Feedback</Link>
              <div className="tfx-footer__socials tfx-footer__socials--mobile" aria-label="Social media links">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open TheFutureX on ${item.label}`}
                    title={item.label}
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>

      <div className="tfx-footer__inner">
        <div className="tfx-footer-premium__bottom">
          <span>&copy; {currentYear} PTCGRAM PRIVATE LIMITED. All rights reserved.</span>
          <div className="tfx-footer-premium__bottom-links">
            <Link to="/info/privacy">Privacy Policy</Link>
            <Link to="/info/terms">Terms of Service</Link>
            <button
              type="button"
              className="tfx-footer-premium__to-top"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Back to top
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
