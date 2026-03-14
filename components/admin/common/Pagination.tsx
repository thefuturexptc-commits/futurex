import React from 'react';
import { Button } from '../../ui/Button';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onChange: (next: number) => void;
}

export const Pagination: React.FC<Props> = ({ page, pageSize, total, onChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}>Prev</Button>
        <Button size="sm" variant="outline" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>Next</Button>
      </div>
    </div>
  );
};
