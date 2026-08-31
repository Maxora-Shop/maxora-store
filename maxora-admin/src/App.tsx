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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      <AdminDashboard
        globalSettings={settings}
        onSettingsUpdated={() => fetchSettings()}
      />
    </div>
  );
}
