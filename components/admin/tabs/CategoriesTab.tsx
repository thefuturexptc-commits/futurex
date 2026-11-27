import React, { useEffect, useState } from 'react';
import { Button } from '../../ui/Button';
import { SectionHeader } from '../common/SectionHeader';
import { getCatalogCategoryRows, updateCategorySeo } from '../../../services/backend';

interface Props {
  categories: string[];
  newCategory: string;
  setNewCategory: (value: string) => void;
  onAddCategory: () => void;
  onDeleteCategory: (category: string) => void;
}

export const CategoriesTab: React.FC<Props> = ({ categories, newCategory, setNewCategory, onAddCategory, onDeleteCategory }) => {
  const [seo, setSeo] = useState<Record<string, { seoTitle?: string; seoDescription?: string }>>({});
  const [saving, setSaving] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let active = true;
    getCatalogCategoryRows().then((rows) => {
      if (active) setSeo(Object.fromEntries(rows.map((row) => [row.name, row])));
    }).catch(() => { if (active) setStatus('Could not load saved category SEO.'); });
    return () => { active = false; };
  }, []);

  const saveSeo = async (name: string) => {
    setSaving(name);
    try {
      await updateCategorySeo(name, seo[name]?.seoTitle || '', seo[name]?.seoDescription || '');
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
        {categories.map((cat) => (
          <div key={cat} className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900 dark:text-white">{cat}</span>
              <Button size="sm" variant="danger" onClick={() => onDeleteCategory(cat)}>Delete</Button>
            </div>
            <details>
              <summary className="cursor-pointer text-sm">Category SEO</summary>
              <label className="mt-2 block text-sm">SEO title
                <input className="block w-full rounded border p-2 text-slate-900" maxLength={160} value={seo[cat]?.seoTitle || ''}
                  onChange={(e) => setSeo({ ...seo, [cat]: { ...seo[cat], seoTitle: e.target.value } })} />
              </label>
              <label className="my-2 block text-sm">Meta description
                <textarea className="block w-full rounded border p-2 text-slate-900" maxLength={320} value={seo[cat]?.seoDescription || ''}
                  onChange={(e) => setSeo({ ...seo, [cat]: { ...seo[cat], seoDescription: e.target.value } })} />
              </label>
              <Button size="sm" isLoading={saving === cat} onClick={() => void saveSeo(cat)}>Save SEO</Button>
            </details>
          </div>
        ))}
      </div>
      <p role="status" className="text-sm">{status}</p>
    </div>
  );
};
