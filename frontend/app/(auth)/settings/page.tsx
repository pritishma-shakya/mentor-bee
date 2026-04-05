"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2, User, Lock, Briefcase } from "lucide-react";
import AuthLayout from "../layout";
import AccountSettings from "@/components/settings/AccountSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import MentorProfileSettings from "@/components/settings/MentorProfileSettings";

type TabType = "account" | "professional" | "security";

export default function SettingsPage() {
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
        toast.error("Failed to load settings");
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
    { id: "account" as TabType, label: "Profile Info", icon: User },
    ...(user?.role === "mentor"
      ? [{ id: "professional" as TabType, label: "Professional Profile", icon: Briefcase }]
      : []),
    { id: "security" as TabType, label: "Change Password", icon: Lock },
  ];

  return (
    <AuthLayout
      header={{
        title: "Settings",
        subtitle: "Manage your profile and account",
        user,
      }}
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
          {activeTab === "account" && (
            <AccountSettings user={user} onUpdate={(updated: any) => setUser({ ...user, ...updated })} />
          )}
          {activeTab === "professional" && user?.role === "mentor" && (
            <MentorProfileSettings user={user} />
          )}
          {activeTab === "security" && <SecuritySettings />}
        </div>
      </div>
    </AuthLayout>
  );
}
