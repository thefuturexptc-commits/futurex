import React from 'react';
import { Button } from '../../ui/Button';

interface Props {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}

export const ConfirmModal: React.FC<Props> = ({ open, title, message, onCancel, onConfirm, confirmLabel = 'Confirm' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-white/10 p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{message}</p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
};
