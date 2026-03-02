import React from 'react';
import { Button } from '../../ui/Button';
import { SectionHeader } from '../common/SectionHeader';

interface Props {
  primaryColor: string;
  logoUrl: string;
  footerSections: Array<{ title: string; items: string[] }>;
  pageContent: Record<string, string>;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFooterSectionsChange: (sections: Array<{ title: string; items: string[] }>) => void;
  onPageContentChange: (content: Record<string, string>) => void;
  onSave: () => Promise<void> | void;
  onSeed: () => void;
}

export const SettingsTab: React.FC<Props> = ({
  primaryColor,
  logoUrl,
  footerSections,
  pageContent,
  onColorChange,
  onLogoChange,
  onFooterSectionsChange,
  onPageContentChange,
  onSave,
  onSeed,
}) => {
  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const updateSectionTitle = (index: number, title: string) => {
    const next = footerSections.map((section, idx) => (idx === index ? { ...section, title } : section));
    onFooterSectionsChange(next);
  };

  const updateSectionItems = (index: number, value: string) => {
    const items = value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');
    const next = footerSections.map((section, idx) => (idx === index ? { ...section, items } : section));
    onFooterSectionsChange(next);
  };

  const addSection = () => {
    onFooterSectionsChange([...footerSections, { title: 'NEW SECTION', items: ['New Item'] }]);
  };

  const removeSection = (index: number) => {
    onFooterSectionsChange(footerSections.filter((_, idx) => idx !== index));
  };

  const allFooterItems = footerSections.flatMap((section) => section.items).filter((item) => item.trim() !== '');

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader title="Settings" subtitle="Theme, branding, and data controls" />
      <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-white/10 p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme Primary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={primaryColor} onChange={onColorChange} className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{primaryColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Custom Logo URL</label>
            <input
              type="text"
              value={logoUrl}
              onChange={onLogoChange}
              placeholder="e.g. https://cdn.example.com/logo.png"
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Footer Sections</label>
              <Button type="button" size="sm" variant="outline" onClick={addSection}>+ Add Section</Button>
            </div>
            {footerSections.map((section, index) => (
              <div key={`footer_section_${index}`} className="rounded-lg border border-gray-200 dark:border-white/10 p-3 space-y-2 bg-white dark:bg-dark-surface">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSectionTitle(index, e.target.value)}
                    className="h-10 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                    placeholder="Section title (e.g. COMPANY)"
                  />
                  <Button type="button" size="sm" variant="danger" onClick={() => removeSection(index)}>Remove</Button>
                </div>
                <textarea
                  value={section.items.join('\n')}
                  onChange={(e) => updateSectionItems(index, e.target.value)}
                  className="min-h-[92px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder={'One footer item per line\nAbout Us\nContact'}
                />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 bg-gray-50 dark:bg-white/5 space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Footer Page Content</label>
            {allFooterItems.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Add footer items first to edit their content.</p>
            ) : (
              allFooterItems.map((item, index) => {
                const slug = toSlug(item);
                return (
                  <div key={`${slug}_${index}`} className="rounded-lg border border-gray-200 dark:border-white/10 p-3 bg-white dark:bg-dark-surface space-y-2">
                    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">{item}</p>
                    <textarea
                      value={pageContent[slug] || ''}
                      onChange={(e) => onPageContentChange({ ...pageContent, [slug]: e.target.value })}
                      className="min-h-[110px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                      placeholder={`Write content for ${item}`}
                    />
                  </div>
                );
              })
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={onSave}>Save Settings</Button>
            <Button variant="secondary" onClick={onSeed}>Seed Database</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
