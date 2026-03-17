import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export const SiteFooter: React.FC = () => {
  const { footerSections, socialLinks } = useTheme();
  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  return (
    <footer className="bg-dark-surface border-t border-white/10 py-10 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs tracking-[0.2em] uppercase font-bold text-gray-400 mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item, idx) => (
                  <li key={`${section.title}_${idx}`} className="text-sm">
                    <Link to={`/info/${toSlug(item)}`} className="text-gray-300 hover:text-white transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {socialLinks.email && (
              <a href={`mailto:${socialLinks.email}`} className="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 hover:text-white transition-colors">
                Gmail
              </a>
            )}
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
