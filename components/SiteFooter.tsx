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
  const { footerSections } = useTheme();
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
      items: section.items.filter((item) => {
        const slug = toSlug(item);
        return !['address', 'delete-account', 'shipping', 'returns-refund'].includes(slug);
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <footer className="site-footer-dark bg-slate-950 border-t border-slate-200 py-6 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-4">
          {visibleFooterSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">{section.title}</h4>
              <ul className="space-y-1.5">
                {section.items.map((item, idx) => (
                  <li key={`${section.title}_${idx}`} className="text-xs sm:text-sm">
                    <Link to={toFooterLink(item)} className="text-slate-300 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">CONTACT</h4>
            <div className="space-y-1.5 text-xs text-slate-300 sm:text-sm">
              <a href={`mailto:${CONTACT_EMAIL}`} className="block break-all hover:text-white transition-colors">
                {CONTACT_EMAIL}
              </a>
              <a href={`tel:${CONTACT_PHONE}`} className="block hover:text-white transition-colors">
                {CONTACT_PHONE}
              </a>
              <address className="not-italic leading-5">
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

        <div className="mt-5 border-t border-white/10 pt-4 text-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} TheFutureX | Powered by PTCGRAM Private Limited</p>
        </div>
      </div>
    </footer>
  );
};
