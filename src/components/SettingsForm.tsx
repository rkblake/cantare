import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import type { Settings } from '@/types';

interface SettingsFormProps {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onScan: (musicDirectory: string) => void;
  disabled?: boolean;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ settings, onSave, onScan, disabled }) => {
  const [musicDirectory, setMusicDirectory] = useState(settings.musicDirectory);
  const [databasePath, setDatabasePath] = useState(settings.databasePath); // Database path might not be user configurable easily in a web app

  useEffect(() => {
    // Update form state if settings prop changes (e.g., after a save or initial load)
    setMusicDirectory(settings.musicDirectory);
    setDatabasePath(settings.databasePath);
  }, [settings]);


  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({ musicDirectory, databasePath }); // Pass updated settings
  };

  const handleScan = () => {
    onScan(musicDirectory); // Trigger scan with the current directory from the form
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <label htmlFor="musicDirectory" className="block text-sm font-medium text-gray-300">
          Music Directory
        </label>
        <input
          type="text"
          id="musicDirectory"
          value={musicDirectory}
          onChange={(e) => setMusicDirectory(e.target.value)}
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
          disabled={disabled}
          placeholder="/path/to/your/music" // Example path (adjust for OS)
        />
        <p className="mt-1 text-xs text-gray-500">The absolute path to the folder containing your music files.</p>
      </div>

      {/* Database path field might be read-only or hidden */}
      <div>
        <label htmlFor="databasePath" className="block text-sm font-medium text-gray-300">
          Database Path
        </label>
        <input
          type="text"
          id="databasePath"
          value={settings.databasePath} // Display actual path from settings
          readOnly // Prevent user editing easily
          className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm sm:text-sm p-2 cursor-not-allowed"
          disabled={true}
        />
        <p className="mt-1 text-xs text-gray-500">Location where the music library data is stored.</p>
      </div>


      <div className="flex space-x-4">
        <Link href="/" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
          Back
        </Link>
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled ?? musicDirectory === settings.musicDirectory} // Disable save if no changes
        >
          Save Settings
        </button>

        <button
          type="button" // Important: use type="button" to prevent form submission
          onClick={handleScan}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled ?? !musicDirectory} // Disable scan if no directory set
        >
          Scan Music Library
        </button>
      </div>

    </form>
  );
};

export default SettingsForm;
