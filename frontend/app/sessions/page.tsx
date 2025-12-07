"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import { Bell, User } from "lucide-react";
import SessionCard from "@/components/session-card";

export default function SessionsPage() {
  const [activeTab, setActiveTab] = useState("Upcoming");

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <main className="flex-1 ml-64 px-6 py-4 max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Your Mentorship Sessions
            </h1>
            <p className="text-gray-600 mt-0.5 text-sm">
              Keep learning and growing today!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-1.5 hover:bg-gray-200 rounded-full transition">
              <Bell className="w-4 h-4 text-gray-800" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </header>

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

        <div className="space-y-4">
          {upcomingSessions.map((session, i) => (
            <SessionCard key={i} session={session} />
          ))}
        </div>
      </main>
    </div>
  );
}
