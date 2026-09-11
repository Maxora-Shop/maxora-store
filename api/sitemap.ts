import type { IncomingMessage, ServerResponse } from 'http';
import { generateDynamicSitemapXml, SITEMAP_BASE_URL } from '../src/utils/sitemapGenerator';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const sitemapXml = await generateDynamicSitemapXml(SITEMAP_BASE_URL);

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    // Short 60s browser / 300s CDN cache with stale-while-revalidate for fast delivery while keeping fresh
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    res.statusCode = 200;
    res.end(sitemapXml);
  } catch (error) {
    console.error('Error generating dynamic Firestore sitemap in api/sitemap:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Failed to generate dynamic sitemap');
  }
}
