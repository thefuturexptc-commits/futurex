import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { generateSitemapXML } from '../utils/generateSitemap.js';
import { SITE_URL, coreRoutes, infoRoutes, sitemapRoutes } from '../utils/siteRoutes.js';

const htmlEscape = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const writeFileEnsured = (filePath, content) => {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf8');
};

const routeUrl = (route) => `${SITE_URL}${route.path === '/' ? '/' : route.path}`;

const blogRoutes = sitemapRoutes.filter((route) => route.path === '/blog' || route.path.startsWith('/blog/'));
const infoPageRoutes = infoRoutes.filter((route) => !route.path.startsWith('/blog'));
const shopRoutes = coreRoutes.filter((route) => route.path !== '/');

const buildSection = (title, routes) => `
<section>
  <h2>${htmlEscape(title)}</h2>
  <ul>
${routes
  .map((route) => `    <li><a href="${htmlEscape(routeUrl(route))}">${htmlEscape(route.label)}</a></li>`)
  .join('\n')}
  </ul>
</section>`;

const buildHtmlSitemap = () => `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TheFutureX Sitemap</title>
  <meta name="robots" content="index,follow" />
</head>
<body>
  <main>
    <h1>TheFutureX Sitemap</h1>
    ${buildSection('Core Pages', coreRoutes.filter((route) => route.path === '/'))}
    ${buildSection('Shop, Category and Support Pages', shopRoutes)}
    ${buildSection('Company and Policy Pages', infoPageRoutes)}
    ${buildSection(`Blogs and Guides (${blogRoutes.length})`, blogRoutes)}
  </main>
</body>
</html>
`;

const sitemapXml = await generateSitemapXML();
writeFileEnsured('sitemap.xml', sitemapXml);
writeFileEnsured('public/sitemap.xml', sitemapXml);
writeFileEnsured('public/sitemap.html', buildHtmlSitemap());

console.log(`Generated sitemap.xml with ${sitemapRoutes.length} base URL(s), including ${blogRoutes.length} blog URL(s).`);
process.exit(0);
