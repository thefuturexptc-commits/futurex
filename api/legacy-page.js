// Remove WordPress's page_id rather than forwarding it into a redirect loop.
export const getLegacyPageDestination = (requestUrl) => {
  const url = new URL(requestUrl, 'https://thefuturex.in');
  if (url.searchParams.get('page_id') !== '5') return null;
  url.searchParams.delete('page_id');
  const query = url.searchParams.toString();
  return `https://thefuturex.in/${query ? `?${query}` : ''}`;
};

export default function handler(req, res) {
  const destination = getLegacyPageDestination(req.url);
  if (!destination) {
    res.status(404).end('Unknown legacy page.');
    return;
  }
  res.setHeader('Location', destination);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(301).end();
}
