"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { User, Shield, Settings, Loader2 } from "lucide-react";
import AuthLayout from "../../layout";
import AccountSettings from "@/components/settings/AccountSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import { Bell, Globe, Sparkles } from "lucide-react";

type TabType = "account" | "security" | "system" | "notifications" | "preferences";

export default function AdminSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("account");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load admin settings");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const tabs = [
    { id: "account", label: "Admin Account", icon: User },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <AuthLayout 
      header={{ 
        title: "System Settings", 
        subtitle: "Manage administrative account and platform configuration", 
        user 
      }}
    >
      <div className="space-y-6">
        {/* Horizontal Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-100 mb-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 pb-4 px-1 text-sm font-medium relative transition-all whitespace-nowrap
                  ${isActive ? "text-orange-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? "text-orange-500" : "text-gray-400"}`} />
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm min-h-[500px]">
          {activeTab === "account" && <AccountSettings user={user} onUpdate={(updated: any) => setUser({...user, ...updated})} />}
          {activeTab === "security" && <SecuritySettings />}
          {activeTab === "system" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-gray-900">System Configuration</h3>
                <p className="text-sm text-gray-500">Platform-wide settings and management tools.</p>
              </div>
              <div className="p-10 border border-dashed border-gray-200 rounded-2xl text-center">
                <p className="text-sm text-gray-500 italic">Advanced system configuration modules coming soon.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
