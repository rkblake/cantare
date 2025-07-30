'use client';
import React, { useState, useEffect } from 'react';
import SettingsForm from '@/components/SettingsForm';
import type { Settings } from '@/types';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<{ total: number, processed: number } | null>(null);

  useEffect(() => {
    // Fetch current settings on mount
    void fetchSettings();
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
    setMessage('Initiating scan...');
    setError(null);
    setScanProgress(null);

    try {
      // First, tell the server to start the scan
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan', settingsData: { musicDirectory } }),
      });

      if (!res.ok) {
        const result = await res.json() as { error: string };
        throw new Error(`Failed to start scan: ${res.status} - ${result.error}`);
      }

      setMessage('Scanning music directory...');
      setScanProgress({ total: 0, processed: 0 }); // Reset progress

      // Now, connect to the event stream for progress updates
      const eventSource = new EventSource('/api/settings/scan');

      eventSource.onmessage = (event) => {
        const progress = JSON.parse(event.data as string) as { total: number, processed: number };
        setScanProgress(progress);
        setMessage(`Scanning... ${progress.processed} / ${progress.total}`);
      };

      eventSource.onerror = () => {
        setError('Failed to get scan updates. The connection was closed.');
        eventSource.close();
        setLoading(false);
        setScanProgress(null);
      };

      eventSource.addEventListener('close', () => {
        setMessage('Scan complete!');
        eventSource.close();
        setLoading(false);
        setScanProgress(null);
        void fetchSettings(); // Refetch settings after scan is complete
      });

    } catch (err: unknown) {
      console.error("Scan initiation error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during scan initiation');
      }
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {message && <p className="text-green-500">{message}</p>}
      {scanProgress && (
        <div>
          <progress value={scanProgress.processed} max={scanProgress.total} className="w-full" />
        </div>
      )}

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
