"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import HeaderBar from "@/components/header-bar";
import { toast } from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor";
  profile_picture?: string;
}

export default function MessagesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Unauthorized");

        const profileData = await res.json();

        if (profileData?.user) {
          setUser(profileData.user);
        } else {
          setUser(null);
          console.warn("User data missing or not authenticated", profileData);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        toast.error("Failed to fetch user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <main className="flex-1 ml-64 px-6 py-5 max-w-7xl mx-auto">
        <HeaderBar
          user={user}
          title="Messages"
          subtitle="Chat with mentors and stay connected"
        />

        {/* Page Content */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Messages Page
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Your conversations will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
