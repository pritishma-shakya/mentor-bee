"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import AuthLayout from "../layout"; // adjust path if needed

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Unauthorized");

        const data = await res.json();
        setUser(data?.user || null);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        toast.error("Failed to fetch user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <AuthLayout header={{ title: "Settings", subtitle: "Manage your account preferences" }}>
      {/* Page Content */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Settings Page</h2>
        <p className="text-sm text-gray-600 mt-1">
          Account, privacy, and notification settings will appear here.
        </p>
      </div>
    </AuthLayout>
  );
}
