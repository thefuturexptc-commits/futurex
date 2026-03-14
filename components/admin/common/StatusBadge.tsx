import React from 'react';

type Status = 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned' | 'In Stock' | 'Low Stock' | 'Out of Stock';

interface Props {
  status: Status;
}

const styles: Record<Status, string> = {
  Processing: 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-200',
  Shipped: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200',
  Delivered: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200',
  Cancelled: 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200',
  Returned: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
  'In Stock': 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200',
  'Low Stock': 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
  'Out of Stock': 'bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200',
};

export const StatusBadge: React.FC<Props> = ({ status }) => {
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>{status}</span>;
};
