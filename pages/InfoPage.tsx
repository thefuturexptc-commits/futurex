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

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-10 text-gray-900 dark:text-white">
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-surface p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">{pageLabel || 'Information'}</h1>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
        <div className="whitespace-pre-wrap text-sm sm:text-base leading-7 sm:leading-8 text-gray-700 dark:text-gray-300">
          {content}
        </div>
      </div>
    </div>
  );
};
