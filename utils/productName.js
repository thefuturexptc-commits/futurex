// Use one brand spelling across storefront names, metadata, and product feeds.
export const formatProductName = (value = '') => {
  const name = String(value || '').replace(/\s+/g, ' ').trim()
    .replace(/^(?:the\s*future\s*x\b[\s:|-]*)+/i, '')
    .replace(/^TFX\s*5\s+AI\s+Smart\s+Band\b/i, 'AI Smart Band TFX5');
  return name ? `The FutureX ${name}` : '';
};
