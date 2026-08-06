import React from 'react';
import { Link } from 'react-router-dom';
import brandLogo from '../assets/images/thefuturex-logo-header.png';

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

  return (
    <footer className="site-footer-dark tfx-footer">
      <div className="tfx-footer__inner">
        <div className="tfx-footer__brand">
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
          </div>
        </div>

        <nav className="tfx-footer__column" aria-label="Quick links">
          <h4>Quick Links</h4>
          <ul>
            {quickLinks.map((item) => (
              <li key={item.label}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="tfx-footer__column" aria-label="Company">
          <h4>Company</h4>
          <ul>
            {companyLinks.map((item) => (
              <li key={item.label}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="tfx-footer__column" aria-label="Support">
          <h4>Support</h4>
          <ul>
            {supportLinks.map((item) => (
              <li key={item.label}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="tfx-footer__column" aria-label="Associate partners">
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

        <div className="tfx-footer__contact">
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
            <div>
              <input id="footer-newsletter" type="email" placeholder="Your Email Address" />
              <button type="submit">Subscribe</button>
            </div>
          </form>

          <Link className="tfx-footer__complaint" to="/raise-complaint">
            Give Feedback
          </Link>
        </div>

        <div className="tfx-footer__mobile-sections" aria-label="Footer links">
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
    </footer>
  );
};
