import { useState } from 'react';
import { Save, Shield, Bell, Zap } from 'lucide-react';
import { useSystemSettings, useUpdateSettings } from '../../hooks/useAdmin';

export default function SystemSettings() {
  const { data: settingsData } = useSystemSettings();
  const updateSettings = useUpdateSettings();
  const [settings, setSettings] = useState(settingsData?.data || {});

  const handleSave = async () => {
    await updateSettings.mutateAsync(settings);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Save className="h-5 w-5 mr-2" />
          {updateSettings.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Shield className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold">Security</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Password Min Length</label>
              <input type="number" className="mt-1 w-full border rounded-md px-3 py-2" defaultValue={8} />
            </div>
            <div>
              <label className="flex items-center">
                <input type="checkbox" className="rounded mr-2" />
                <span className="text-sm">Require Special Character</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Bell className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center">
              <input type="checkbox" className="rounded mr-2" />
              <span className="text-sm">Email Notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded mr-2" />
              <span className="text-sm">Slack Integration</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Zap className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold">Features</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center">
              <input type="checkbox" className="rounded mr-2" defaultChecked />
              <span className="text-sm">AI Insights</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded mr-2" defaultChecked />
              <span className="text-sm">ML Predictions</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded mr-2" />
              <span className="text-sm">Real-time Sync</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
