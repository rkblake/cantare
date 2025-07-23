'use client';
import React, { useState, useEffect } from 'react';
import SettingsForm from '@/components/SettingsForm'; // Implement SettingsForm component
import type { Settings } from '@/types';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    // Fetch current settings on mount
    fetchSettings().catch((e) => {
      console.error("Failed to fetch settings: ", e);
    })
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error(`Error fetching settings: ${res.status}`);
      const data: Settings = await res.json() as Settings;
      setSettings(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Fetch settings error:", err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      const result: unknown = await res.json();
      if (!res.ok) throw new Error(`Error saving settings: ${res.status} - ${(result as { error: string }).error}`);
      setSettings(result as Settings); // Update with potentially saved settings
      setMessage('Settings saved successfully!');
    } catch (err: unknown) {
      console.error("Save settings error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScanMusic = async (musicDirectory: string) => {
    if (!musicDirectory) {
      setError('Music directory is not set.');
      return;
    }
    setLoading(true);
    setMessage('Scanning music directory...');
    setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan', settingsData: { musicDirectory } }),
      });
      const result = await res.json() as { message: string } | { error: string, message: string };
      if (!res.ok) throw new Error(`Scan failed: ${res.status} - ${(result as { error: string }).error}`);

      // setMessage(`Scan complete! Found ${(result as { counts: { tracks: number } }).counts.tracks} tracks.`);
      setMessage('Scan complete!');
      // Optionally refetch settings or update local state if scan returned settings
      await fetchSettings(); // Refetch to ensure latest settings/db state

    } catch (err: unknown) {
      console.error("Scan error:", err);
      console.trace();
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      setMessage(null); // Clear scanning message on error
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {message && <p className="text-green-500">{message}</p>}

      {settings && (
        <SettingsForm
          settings={settings}
          onSave={handleSaveSettings}
          onScan={handleScanMusic}
          disabled={loading} // Disable form while loading/scanning
        />
      )}
    </div>
  );
};

export default SettingsPage;
