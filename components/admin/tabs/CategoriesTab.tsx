import React from 'react';
import { Button } from '../../ui/Button';
import { SectionHeader } from '../common/SectionHeader';

interface Props {
  categories: string[];
  newCategory: string;
  setNewCategory: (value: string) => void;
  onAddCategory: () => void;
  onDeleteCategory: (category: string) => void;
}

export const CategoriesTab: React.FC<Props> = ({ categories, newCategory, setNewCategory, onAddCategory, onDeleteCategory }) => {
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
          <div key={cat} className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-white/10 p-4 flex items-center justify-between">
            <span className="font-medium text-gray-900 dark:text-white">{cat}</span>
            <Button size="sm" variant="danger" onClick={() => onDeleteCategory(cat)}>Delete</Button>
          </div>
        ))}
      </div>
    </div>
  );
};
