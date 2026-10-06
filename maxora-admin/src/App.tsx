import React, { useState, useEffect } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { StoreSettings } from './types';
import { storeService } from './services/storeService';
import { INITIAL_SETTINGS } from './data/initialData';

export default function App() {
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await storeService.getSettings();
      if (data) {
        setSettings(data);
      }
    } catch (e) {
      console.error('Failed to load store settings:', e);
    }
  };

  // Dynamically update Favicon in <head> based on database settings
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const faviconPath = settings?.favicon_url || settings?.logo_url || '/favicon.ico';
    let link: HTMLLinkElement | null =
      (document.getElementById('dynamic-favicon') as HTMLLinkElement) ||
      (document.querySelector("link[rel*='icon']") as HTMLLinkElement);
    if (!link) {
      link = document.createElement('link');
      link.id = 'dynamic-favicon';
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconPath;
    if (faviconPath.endsWith('.ico') || faviconPath.includes('image/x-icon') || faviconPath.includes('image/vnd.microsoft.icon')) {
      link.type = 'image/x-icon';
    } else if (faviconPath.endsWith('.svg') || faviconPath.includes('image/svg+xml')) {
      link.type = 'image/svg+xml';
    } else {
      link.type = 'image/png';
    }
  }, [settings?.favicon_url, settings?.logo_url]);

  const handleBackToStore = () => {
    window.location.href = 'https://maxorabd.com/';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      <AdminDashboard
        globalSettings={settings}
        onSettingsUpdated={() => fetchSettings()}
        onBackToStore={handleBackToStore}
      />
    </div>
  );
}

