import React from 'react';
import { Button } from '../../ui/Button';
import { SectionHeader } from '../common/SectionHeader';

interface Props {
  primaryColor: string;
  logoUrl: string;
  onColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => Promise<void> | void;
  onSeed: () => void;
}

export const SettingsTab: React.FC<Props> = ({ primaryColor, logoUrl, onColorChange, onLogoChange, onSave, onSeed }) => {
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
          <div className="flex gap-2">
            <Button onClick={onSave}>Save Settings</Button>
            <Button variant="secondary" onClick={onSeed}>Seed Database</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
