import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App';
import { TaxonomyProvider } from '../src/context/TaxonomyContext';

// Mock window and document for SSR simulation
(global as any).window = {
  location: {
    hostname: 'localhost',
    pathname: '/',
    hash: '',
    search: '',
    origin: 'http://localhost:3000'
  },
  history: {
    pushState: () => {},
    replaceState: () => {}
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  scrollTo: () => {},
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  }
};
(global as any).document = {
  location: (global as any).window.location,
  visibilityState: 'visible',
  addEventListener: () => {},
  removeEventListener: () => {},
  getElementById: () => null
};
(global as any).localStorage = (global as any).window.localStorage;

console.log('--- Testing 20 Simulation Cycles ---');

for (let i = 1; i <= 20; i++) {
  try {
    const html = renderToString(
      React.createElement(TaxonomyProvider, null, React.createElement(App))
    );
    const hasSkeletons = html.includes('animate-pulse') && html.includes('aspect-square bg-zinc-200');
    const hasProducts = html.includes('ProductCard') || html.includes('Featured Collections') || html.includes('Showing 29 products');
    const debugMatch = html.match(/Products:.*?Filtered:.*?Loading:.*?Error:.*?</);
    console.log(`Cycle ${i}: rendered HTML length ${html.length}. Skeletons: ${hasSkeletons}. Products shown: ${hasProducts}. ${debugMatch ? debugMatch[0] : ''}`);
  } catch (err: any) {
    console.error(`Cycle ${i} failed:`, err);
  }
}
