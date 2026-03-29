"use client";

import { useState } from "react";
import { Globe, Moon, Sun, Clock, Save, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface PreferenceSettingsProps {
  user: any;
  onUpdate: (updated: any) => void;
}

export default function PreferenceSettings({ user, onUpdate }: PreferenceSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState({
    language: user?.language || "en",
    theme: user?.theme || "light",
    timezone: user?.timezone || "UTC",
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/update-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Preferences updated");
        onUpdate(data.user);
        // In a real app, you might trigger a theme change or language reload here
      } else {
        toast.error(data.message || "Failed to update preferences");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { code: "en", label: "English (US)" },
    { code: "np", label: "Nepali (नेपाली)" },
    { code: "hi", label: "Hindi (हिन्दी)" },
  ];

  const timezones = [
    { value: "UTC", label: "UTC (Coordinated Universal Time)" },
    { value: "Asia/Kathmandu", label: "Nepal Standard Time (GMT+5:45)" },
    { value: "Asia/Kolkata", label: "India Standard Time (GMT+5:30)" },
    { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Display & Regional</h2>
        <p className="text-sm text-gray-500">Customize how the platform looks and behaves for you.</p>
      </div>

      <div className="grid gap-6">
        {/* Language */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">System Language</p>
              <p className="text-xs text-gray-500">Select your preferred language</p>
            </div>
          </div>
          <select 
            value={prefs.language}
            onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>
        </div>

        {/* Theme */}
        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Appearance Mode</p>
              <p className="text-xs text-gray-500">Switch between light and dark themes</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setPrefs({ ...prefs, theme: "light" })}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${prefs.theme === "light" ? "bg-white border-orange-500 ring-2 ring-orange-500/10 shadow-sm" : "bg-white/50 border-gray-200 text-gray-400 hover:bg-white"}`}
            >
              <Sun className={`w-4 h-4 ${prefs.theme === "light" ? "text-orange-500" : ""}`} />
              <span className="text-sm font-medium">Light Mode</span>
            </button>
            <button 
              onClick={() => setPrefs({ ...prefs, theme: "dark" })}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${prefs.theme === "dark" ? "bg-white border-orange-500 ring-2 ring-orange-500/10 shadow-sm" : "bg-white/50 border-gray-200 text-gray-400 hover:bg-white"}`}
            >
              <Moon className={`w-4 h-4 ${prefs.theme === "dark" ? "text-orange-500" : ""}`} />
              <span className="text-sm font-medium">Dark Mode</span>
            </button>
          </div>
        </div>

        {/* Timezone */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Time Zone</p>
              <p className="text-xs text-gray-500">Matches schedules and reminders to your local time</p>
            </div>
          </div>
          <select 
            value={prefs.timezone}
            onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
            className="max-w-[200px] px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
          >
            {timezones.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Preferences
        </button>
      </div>
    </div>
  );
}
