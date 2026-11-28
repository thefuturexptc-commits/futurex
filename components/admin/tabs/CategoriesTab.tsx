import React, { useEffect, useState } from 'react';
import { Button } from '../../ui/Button';
import { SectionHeader } from '../common/SectionHeader';
import { getCatalogCategoryRows, updateCategorySeo } from '../../../services/backend';
import { getCatalogCategoryPages } from '../../../utils/categorySeo.js';

interface Props {
  categories: string[];
  newCategory: string;
  setNewCategory: (value: string) => void;
  onAddCategory: () => void;
  onDeleteCategory: (category: string) => void;
}

export const CategoriesTab: React.FC<Props> = ({ categories, newCategory, setNewCategory, onAddCategory, onDeleteCategory }) => {
  const [seo, setSeo] = useState<Record<string, { seoTitle?: string; seoDescription?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [status, setStatus] = useState('');
  const storefrontPages = Object.entries(getCatalogCategoryPages(categories.map((name) => ({ name }))));

  useEffect(() => {
    let active = true;
    getCatalogCategoryRows().then((rows) => {
      if (active) setSeo(Object.fromEntries(rows.map((row) => [String(row.name || '').trim().toLowerCase(), row])));
    }).catch(() => {
      if (active) setStatus('Could not load saved category SEO.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const saveSeo = async (name: string) => {
    const fields = seo[name.trim().toLowerCase()];
    setSaving(name);
    setStatus('');
    try {
      await updateCategorySeo(name, fields?.seoTitle || '', fields?.seoDescription || '');
      setStatus(name + ' SEO saved.');
    } catch {
      setStatus('Could not save SEO for ' + name + '.');
    } finally {
      setSaving('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader title="Categories" subtitle="Manage storefront taxonomy" />
      <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-white/10 p-4 flex gap-3">
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="e.g. Smart Watches"
          className="h-10 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
        <Button onClick={onAddCategory}>Add Category</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const key = cat.trim().toLowerCase();
          const storefrontPage = storefrontPages.find(([, page]) => page.category.toLowerCase() === key);
          return (
            <div key={cat} className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">{cat}</span>
                <Button size="sm" variant="danger" onClick={() => onDeleteCategory(cat)}>Delete</Button>
              </div>
              {storefrontPage && (
                <details>
                  <summary className="cursor-pointer text-sm">Category SEO</summary>
                  <fieldset disabled={loading || Boolean(saving)}>
                    <label className="mt-2 block text-sm">SEO title
                      <input className="block w-full rounded border p-2 text-slate-900" maxLength={160}
                        placeholder={storefrontPage[1].title} value={seo[key]?.seoTitle || ''}
                        onChange={(e) => setSeo({ ...seo, [key]: { ...seo[key], seoTitle: e.target.value } })} />
                    </label>
                    <label className="my-2 block text-sm">Meta description
                      <textarea className="block w-full rounded border p-2 text-slate-900" maxLength={320}
                        placeholder={storefrontPage[1].description} value={seo[key]?.seoDescription || ''}
                        onChange={(e) => setSeo({ ...seo, [key]: { ...seo[key], seoDescription: e.target.value } })} />
                    </label>
                    <Button size="sm" isLoading={saving === cat} onClick={() => void saveSeo(cat)}>Save SEO</Button>
                  </fieldset>
                  <a className="mt-2 inline-block text-sm underline" href={`/${storefrontPage[0]}`} target="_blank" rel="noreferrer">View category page</a>
                </details>
              )}
            </div>
          );
        })}
      </div>
      <p role="status" className="text-sm">{status}</p>
    </div>
  );
};
