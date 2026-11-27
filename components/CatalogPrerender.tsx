import React from 'react';
import { useLocation } from 'react-router-dom';

const initialPath = window.location.pathname;
const initialMarkup = document.querySelector('#root > .catalog-prerender')?.outerHTML;

export const hasCatalogPrerender = (path: string) => Boolean(initialMarkup && path === initialPath);

export function CatalogPrerender({ fallback = null }: { fallback?: React.ReactNode }) {
  const { pathname } = useLocation();
  return hasCatalogPrerender(pathname)
    ? <div dangerouslySetInnerHTML={{ __html: initialMarkup }} />
    : <>{fallback}</>;
}
