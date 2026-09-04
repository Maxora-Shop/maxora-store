import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const baseUrl = 'https://maxora-store-ruby.vercel.app';
  let products: any[] = [];

  try {
    const dbPath = path.join(process.cwd(), 'maxora_db.json');
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      if (Array.isArray(data.products)) {
        products = data.products.filter((p: any) => p.active !== 0 && p.active !== false);
      }
    }
  } catch (err) {
    console.error('Error reading products for sitemap:', err);
  }

  // If no products read from db, use fallbacks
  if (products.length === 0) {
    products = [
      { id: 'prod-001', name: 'Maxora Ultra AMOLED Smartwatch Series 9', slug: 'maxora-ultra-amoled-smartwatch-series-9' },
      { id: 'prod-002', name: 'Acoustic Pro ANC Wireless Earbuds', slug: 'acoustic-pro-anc-wireless-earbuds' },
      { id: 'prod-003', name: 'Urban Explorer Anti-Theft Backpack', slug: 'urban-explorer-anti-theft-backpack' },
      { id: 'prod-004', name: 'ThermoGrip Double-Wall Vacuum Insulated Flask 750ml', slug: 'thermogrip-double-wall-vacuum-insulated-flask-750ml' },
      { id: 'prod-005', name: 'Classic Full-Grain Genuine Leather Bi-Fold Wallet', slug: 'classic-full-grain-genuine-leather-bi-fold-wallet' },
      { id: 'prod-006', name: 'MechWave RGB Mechanical Gaming Keyboard 75%', slug: 'mechwave-rgb-mechanical-gaming-keyboard-75' },
      { id: 'prod-007', name: 'Nordic Ceramic Pour-Over Coffee Dripper Set', slug: 'nordic-ceramic-pour-over-coffee-dripper-set' },
      { id: 'prod-008', name: 'Pure Organic Sylhet Sreemangal Whole-Leaf Black Tea 500g', slug: 'pure-organic-sylhet-sreemangal-whole-leaf-black-tea-500g' }
    ];
  }

  const today = new Date().toISOString().split('T')[0];

  const productXml = products
    .map((p) => {
      const slug =
        p.slug ||
        (p.name
          ? p.name
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '')
          : p.id);
      const lastMod = (p.updated_at || p.created_at || today).split('T')[0];
      return `  <url>
    <loc>${baseUrl}/product/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${productXml}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.statusCode = 200;
  res.end(sitemapXml);
}
