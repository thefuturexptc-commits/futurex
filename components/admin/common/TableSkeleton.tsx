import React from 'react';

interface Props {
  rows?: number;
  cols?: number;
}

export const TableSkeleton: React.FC<Props> = ({ rows = 8, cols = 5 }) => {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="h-12 bg-gray-100 dark:bg-white/5 animate-pulse" />
      <div className="divide-y divide-gray-100 dark:divide-white/10">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid gap-3 p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((__, j) => (
              <div key={j} className="h-4 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
