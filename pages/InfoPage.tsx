import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';

export const InfoPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { footerSections, pageContent } = useTheme();

  const pageLabel = useMemo(() => {
    for (const section of footerSections) {
      for (const item of section.items) {
        const itemSlug = item
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        if (itemSlug === slug) return item;
      }
    }
    return slug
      .split('-')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(' ');
  }, [footerSections, slug]);

  const content = pageContent[slug] || 'Content will be updated soon.';
  const showBusinessAddress = slug === 'about-us' || slug === 'contact';
  const businessAddress = [
    'Office No: 201-202, Hirubai Residency',
    'Besides Vedant Hospital',
    'Near Virar East-West Flyover',
    'Virar West',
  ];
  const supportEmail = 'thefuturex.ptc@gmail.com';
  const supportPhone = '8530340676';

  return (
    <div className="info-page-dark min-h-screen max-w-5xl mx-auto px-4 py-10 text-white">
      <div className="rounded-2xl border border-white/10 bg-dark-surface p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">{pageLabel || 'Information'}</h1>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
        <div className="whitespace-pre-wrap text-sm sm:text-base leading-7 sm:leading-8 text-gray-300">
          {content}
        </div>
        {showBusinessAddress && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold text-white">Business Address</h2>
            <address className="mt-3 not-italic text-sm leading-7 text-gray-300">
              {businessAddress.map((line) => (
                <React.Fragment key={line}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </address>
            <div className="mt-4 space-y-1 text-sm text-gray-300">
              <p>Email: <a href={`mailto:${supportEmail}`} className="hover:text-white">{supportEmail}</a></p>
              <p>Contact No: <a href={`tel:${supportPhone}`} className="hover:text-white">{supportPhone}</a></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
