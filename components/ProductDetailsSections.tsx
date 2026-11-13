import React, { useId, useState } from 'react';
import './ProductDetailsSections.css';

interface SpecGroup {
  title: string;
  entries: Array<[string, unknown]>;
}

export const ProductSpecifications: React.FC<{
  groups: SpecGroup[];
  formatLabel: (key: string) => string;
  renderIcon: (title: string) => React.ReactNode;
}> = ({ groups, formatLabel, renderIcon }) => {
  const [query, setQuery] = useState('');
  const searchId = useId();
  const term = query.trim().toLowerCase();
  const count = groups.reduce((total, group) => total + group.entries.length, 0);
  const filteredGroups = groups.map(group => ({
    ...group,
    entries: group.entries.filter(([key, value]) => !term || `${group.title} ${formatLabel(key)} ${String(value ?? '')}`.toLowerCase().includes(term)),
  })).filter(group => group.entries.length);

  return (
    <div className="product-specifications">
      <div className="product-specifications-header">
        <div>
          <p className="product-details-eyebrow">The details that matter</p>
          <h2>Product specifications</h2>
          <p className="product-details-subtitle">Explore the build, performance, compatibility and care details.</p>
        </div>
        <span className="product-specifications-count">{count} specifications</span>
      </div>
      {count > 12 && (
        <div className="product-specifications-search">
          <label htmlFor={searchId}>Find a specification</label>
          <div>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
            <input id={searchId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search battery, material, Bluetooth…" />
            {query && <button type="button" onClick={() => setQuery('')}>Clear</button>}
          </div>
        </div>
      )}
      <div className="product-specifications-grid">
        {filteredGroups.map(group => (
          <details key={group.title} className={`product-specifications-group${group.title === 'Warranty & Support' ? ' product-specifications-support' : ''}`}>
            <summary>
              <span className="product-specifications-icon" aria-hidden="true">{renderIcon(group.title)}</span>
              <h3>{group.title}</h3>
              <span className="product-specifications-group-count">{group.entries.length}</span>
              <svg className="product-specifications-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <dl>
              {group.entries.map(([key, value]) => (
                <div key={key} className="product-specifications-row">
                  <dt>{formatLabel(key)}</dt>
                  <dd>{String(value ?? '')}</dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>
      {!filteredGroups.length && <p role="status" className="product-specifications-empty">{count ? 'No specifications match your search. Try another keyword.' : 'Specifications will be available soon.'}</p>}
    </div>
  );
};

export const ProductFeatureList: React.FC<{ features: string[] }> = ({ features }) => (
  <ul className="product-feature-list">
    {features.map((feature, index) => {
      const text = feature.replace(/^\s*(?:[-*\u2022]\s*|\d+[.)]\s*)/, '').trim();
      const separator = text.indexOf(':');
      return (
        <li key={`${text}-${index}`}>
          <span className="product-feature-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4L19 6" /></svg></span>
          <div>{separator > 0 ? <><h3>{text.slice(0, separator)}</h3><p>{text.slice(separator + 1).trim()}</p></> : <p className="product-feature-title">{text}</p>}</div>
        </li>
      );
    })}
  </ul>
);
