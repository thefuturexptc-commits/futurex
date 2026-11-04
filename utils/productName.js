// Use one brand spelling across storefront names, metadata, and product feeds.
export const formatProductName = (value = '') => {
  const name = String(value || '').replace(/\s+/g, ' ').trim()
    .replace(/^(?:the\s*future\s*x\b[\s:|-]*)+/i, '')
    .replace(/^TFX\s*5\s+AI\s+Smart\s+Band\b/i, 'AI Smart Band TFX5')
    .replace(/\bRing\s+Pro(?:\s+Smart\s+Ring)?\b/gi, 'Smart Ring')
    .replace(/\bSmart Ring\s*–\s*Smart Ring\b/gi, 'Smart Ring');
  return name ? `The FutureX ${name}` : '';
};
