"use client";

import Sidebar from "@/components/sidebar";
import SessionCard from "@/components/session-card";
import MentorCard from "@/components/mentor-card";
import { Bell, Plus, User} from "lucide-react";

export default function HomePage() {
  const sessions = [
    { mentor: "Alice Smith", date: "Sun, Nov 9", time: "1:00 PM – 2:00 PM" },
    { mentor: "Robert King", date: "Tue, Nov 11", time: "4:00 PM – 5:00 PM" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 px-6 py-5 ml-60">
        <HeaderBar />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {sessions.map((s, i) => (
              <SessionCard key={i} session={s} />
            ))}
            <RecommendedMentors />
          </div>

          <div className="space-y-5 w-full">
            <Summary />
            <Rewards />
            <LearningGoals />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderBar() {
  return (
    <header className="flex justify-between items-center mb-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Welcome Back, Alex!</h1>
        <p className="text-gray-800 mt-1 text-sm">Keep learning and growing today!</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-200 rounded-full transition" aria-label="Notifications">
          <Bell className="w-5 h-5 text-gray-800" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center overflow-hidden">
          <User className="w-6 h-6 text-white" />
        </div>
      </div>
    </header>
  );
}

function RecommendedMentors() {
  const mentors = [
    {
      name: "Sarah Johnson",
      expertise: "Web Development",
      rating: 4.9,
      tags: ["React", "Next.js"],
      price: 15,
    },
    {
      name: "John Carter",
      expertise: "UI/UX Design",
      rating: 4.8,
      tags: ["Figma", "Prototyping"],
      price: 18,
    },
    {
      name: "Emily Davis",
      expertise: "Data Science",
      rating: 4.7,
      tags: ["Pandas", "ML"],
      price: 22,
    },
    {
      name: "Michael Lee",
      expertise: "Cloud Computing",
      rating: 4.9,
      tags: ["AWS", "Kubernetes"],
      price: 25,
    },
    {
      name: "Ava Brown",
      expertise: "Machine Learning",
      rating: 4.8,
      tags: ["TensorFlow", "NLP"],
      price: 20,
    },
    {
      name: "David Wilson",
      expertise: "Cybersecurity",
      rating: 4.7,
      tags: ["Pentesting", "Networking"],
      price: 19,
    },
  ];

  return (
    <section>
      <h3 className="text-base font-semibold text-gray-900 mb-3">
        Recommended Mentors
      </h3>

      <div className="grid grid-cols-3 gap-4">
        {mentors.map((m, i) => (
          <MentorCard key={i} mentor={m} />
        ))}
      </div>
    </section>
  );
}

function Summary() {
  const items = [
    { label: "Sessions", value: "5" },
    { label: "Hours", value: "45" },
    { label: "Points", value: "128" },
  ];

  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">This Week</h3>

      <div className="grid grid-cols-3 gap-3">
        {items.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-xl font-bold text-orange-600">{s.value}</p>
            <p className="text-[11px] text-gray-800">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Rewards() {
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Rewards</h3>

      <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg p-4 text-white text-center shadow-md">
        <p className="text-2xl font-bold">1250</p>
        <p className="text-[11px] mt-1">Points</p>

        <button className="mt-3 px-4 py-2 bg-white text-orange-600 text-xs rounded-lg font-medium">View All</button>
      </div>
    </div>
  );
}

function LearningGoals() {
  const goals = [
    { text: "Complete 15 sessions", progress: 75 },
    { text: "Attend meetings", progress: 60 },
    { text: "Finish courses", progress: 40 },
  ];

  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Learning Goals</h3>
        <button className="p-2 bg-orange-100 rounded-full text-orange-600">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {goals.map((g, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] font-medium text-gray-900">{g.text}</span>
              <span className="font-semibold text-orange-600 text-[11px]">{g.progress}%</span>
            </div>

            <div className="h-2 bg-gray-200 rounded-full">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${g.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
