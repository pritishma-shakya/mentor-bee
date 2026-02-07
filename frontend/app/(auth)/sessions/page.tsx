"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import AuthLayout from "../layout"; // adjust path if needed
import SessionCard from "@/components/session-card";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor";
  profile_picture?: string;
}

interface Session {
  mentor: string;
  avatar?: string;
  subject?: string;
  topic?: string;
  date: string;
  time: string;
  link?: string;
  goal?: string;
  notes?: string;
}

export default function SessionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile
        const profileRes = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });
        if (!profileRes.ok) throw new Error("Unauthorized");
        const profileData = await profileRes.json();
        setUser(profileData?.user || null);

        // Fetch sessions
        const sessionsRes = await fetch("http://localhost:5000/api/students/sessions", {
          credentials: "include",
        });
        const sessionsData = await sessionsRes.json();
        if (sessionsData.success && sessionsData.data) {
          setSessions(sessionsData.data);
        } else {
          setSessions([]);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        toast.error("Failed to fetch user or sessions");
        setUser(null);
        setSessions([]);
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
    <AuthLayout header={{ title: "Your Mentorship Sessions", subtitle: "Keep learning and growing today!", user }}>
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-5">
        {["Upcoming", "Pending", "History"].map((tab) => (
          <button
            key={tab}
            onClick={() => console.log("Switch tab to", tab)}
            className={`pb-2 text-sm font-medium relative ${
              tab === "Upcoming"
                ? "text-orange-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab}
            {tab === "Upcoming" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Sessions */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-10">No sessions available.</p>
        ) : (
          sessions.map((session, i) => <SessionCard key={i} session={session} />)
        )}
      </div>
    </AuthLayout>
  );
}
