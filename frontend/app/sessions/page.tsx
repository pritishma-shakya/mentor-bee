"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import HeaderBar from "@/components/header-bar";
import SessionCard from "@/components/session-card";

export default function SessionsPage() {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    const fetchData = async () => {
      try {
        const userRes = await fetch(
          "http://localhost:5000/api/auth/profile",
          { headers }
        );
        const userData = await userRes.json();

        if (userData.success) {
          setUser(userData.data.user);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const upcomingSessions = [
    {
      mentor: "Alice Smith",
      avatar: "AS",
      subject: "Mathematics",
      topic: "Introduction to Algebra",
      date: "Sun, Nov 9",
      time: "1:00 PM – 2:00 PM",
      link: "https://mentorb.ee/join-7e8xwk",
      goal: "To learn about basic principles of mathematics",
      notes: "So excited to learn more!",
    },
    {
      mentor: "Robert King",
      avatar: "RK",
      subject: "Physics",
      topic: "Newton's Laws of Motion",
      date: "Tue, Nov 11",
      time: "4:00 PM – 5:00 PM",
      link: "https://mentorb.ee/join-9f2mqp",
      goal: "Master foundational physics concepts",
      notes: "Bring notebook and questions",
    },
  ];

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
          title="Your Mentorship Sessions"
          subtitle="Keep learning and growing today!"
        />

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 mb-5">
          {["Upcoming", "Pending", "History"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium relative ${
                activeTab === tab
                  ? "text-orange-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Sessions */}
        <div className="space-y-4">
          {upcomingSessions.map((session, i) => (
            <SessionCard key={i} session={session} />
          ))}
        </div>
      </main>
    </div>
  );
}
