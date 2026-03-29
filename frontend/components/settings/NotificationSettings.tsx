"use client";

import { useState } from "react";
import { Bell, Mail, Smartphone, MessageSquare, Calendar, Gift, Save, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface NotificationSettingsProps {
  user: any;
  onUpdate: (updated: any) => void;
}

export default function NotificationSettings({ user, onUpdate }: NotificationSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    email_notifications: user?.email_notifications ?? true,
    push_notifications: user?.push_notifications ?? true,
    sms_alerts: user?.sms_alerts ?? false,
  });

  const handleToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !(prev as any)[key] }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/update-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Notification preferences updated");
        onUpdate(data.user);
      } else {
        toast.error(data.message || "Failed to update settings");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: "messages", icon: MessageSquare, label: "Messages & Chats", desc: "Get notified when someone sends you a message" },
    { id: "bookings", icon: Calendar, label: "Booking Updates", desc: "Reminders for upcoming sessions and schedule changes" },
    { id: "rewards", icon: Gift, label: "Rewards & News", desc: "Alerts for new points, badges, and platform updates" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Notification Preferences</h2>
        <p className="text-sm text-gray-500">Choose how and when you want to be notified.</p>
      </div>

      <div className="grid gap-6">
        {/* Main Channels */}
        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notification Channels
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                  <p className="text-xs text-gray-500">Receive summaries and important alerts</p>
                </div>
              </div>
              <button 
                onClick={() => handleToggle("email_notifications")}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.email_notifications ? "bg-orange-500" : "bg-gray-200"}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.email_notifications ? "translate-x-6" : ""}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                  <p className="text-xs text-gray-500">Real-time alerts on your browser/mobile</p>
                </div>
              </div>
              <button 
                onClick={() => handleToggle("push_notifications")}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.push_notifications ? "bg-orange-500" : "bg-gray-200"}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.push_notifications ? "translate-x-6" : ""}`} />
              </button>
            </div>

            <div className="flex items-center justify-between opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">SMS Alerts (Beta)</p>
                  <p className="text-xs text-gray-500">Direct text messages for critical items</p>
                </div>
              </div>
              <button 
                disabled
                className="w-12 h-6 rounded-full bg-gray-200 relative cursor-not-allowed"
              >
                <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Activity Alerts</h3>
          <div className="grid gap-3">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                    <cat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cat.label}</p>
                    <p className="text-xs text-gray-500">{cat.desc}</p>
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 accent-orange-500" />
              </div>
            ))}
          </div>
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
          Save Notification Settings
        </button>
      </div>
    </div>
  );
}
