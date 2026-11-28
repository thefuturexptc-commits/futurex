import React from 'react';
import { useLocation } from 'react-router-dom';

const initialPath = window.location.pathname;
const initialMarkup = document.querySelector('#root > .catalog-prerender')?.outerHTML;

export const hasCatalogPrerender = (path: string) => Boolean(initialMarkup && path === initialPath);

export function CatalogPrerender() {
  const { pathname } = useLocation();
  return hasCatalogPrerender(pathname)
    ? <div dangerouslySetInnerHTML={{ __html: initialMarkup }} />
    : null;
}
