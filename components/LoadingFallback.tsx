import React from 'react';

export const LoadingFallback: React.FC<{ label?: string; minHeightClassName?: string }> = ({
  label = 'Loading TheFutureX',
  minHeightClassName = 'min-h-[50vh]',
}) => (
  <div className={`${minHeightClassName} flex items-center justify-center px-4 text-gray-100`}>
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-300/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-300 border-r-white animate-spin" />
        <div className="absolute inset-3 rounded-full bg-cyan-300/15 shadow-[0_0_28px_rgba(34,211,238,0.35)]" />
      </div>
      <div>
        <p className="font-display text-sm font-bold uppercase tracking-[0.28em] text-cyan-100">{label}</p>
        <p className="mt-1 text-xs text-gray-400">Getting things ready...</p>
      </div>
    </div>
  </div>
);
