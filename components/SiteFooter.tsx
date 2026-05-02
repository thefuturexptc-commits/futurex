import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const CONTACT_EMAIL = 'thefuturex.ptc@gmail.com';
const CONTACT_PHONE = '8530340676';
const CONTACT_ADDRESS = [
  'Office No: 201-202, Hirubai Residency',
  'Besides Vedant Hospital',
  'Near Virar East-West Flyover, Virar West',
];

export const SiteFooter: React.FC = () => {
  const { footerSections, socialLinks } = useTheme();
  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  const toFooterLink = (item: string) => {
    const slug = toSlug(item);
    return slug === 'delete-account' ? '/delete-account' : `/info/${slug}`;
  };
  const visibleFooterSections = footerSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => toSlug(item) !== 'address'),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <footer className="site-footer-dark bg-dark-surface border-t border-white/10 py-10 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center sm:text-left">
          {visibleFooterSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs tracking-[0.2em] uppercase font-bold text-gray-400 mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item, idx) => (
                  <li key={`${section.title}_${idx}`} className="text-sm">
                    <Link to={toFooterLink(item)} className="text-gray-300 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase font-bold text-gray-400 mb-3">CONTACT</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <a href={`mailto:${CONTACT_EMAIL}`} className="block break-all hover:text-white transition-colors">
                {CONTACT_EMAIL}
              </a>
              <a href={`tel:${CONTACT_PHONE}`} className="block hover:text-white transition-colors">
                {CONTACT_PHONE}
              </a>
              <address className="not-italic leading-6">
                {CONTACT_ADDRESS.map((line) => (
                  <React.Fragment key={line}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </address>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 hover:text-white transition-colors">
              Gmail
            </a>
            {socialLinks.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 hover:text-white transition-colors">
                Instagram
              </a>
            )}
            {socialLinks.facebook && (
              <a href={socialLinks.facebook} target="_blank" rel="noreferrer" className="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 hover:text-white transition-colors">
                Facebook
              </a>
            )}
            {socialLinks.twitter && (
              <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 hover:text-white transition-colors">
                Twitter/X
              </a>
            )}
            {socialLinks.youtube && (
              <a href={socialLinks.youtube} target="_blank" rel="noreferrer" className="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 hover:text-white transition-colors">
                YouTube
              </a>
            )}
            {socialLinks.linkedin && (
              <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 hover:text-white transition-colors">
                LinkedIn
              </a>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-gray-400 space-y-1">
          <p>&copy; {new Date().getFullYear()} TheFutureX | Powered by PTCGRAM Private Limited</p>
        </div>
      </div>
    </footer>
  );
};
