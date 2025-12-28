"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "@/components/sidebar";
import HeaderBar from "@/components/header-bar";
import {
  Calendar,
  Clock,
  DollarSign,
  MessageCircle,
  Star,
  TrendingUp,
  Users,
  BookOpen,
  UserIcon,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "mentor";
  status?: "pending" | "accepted" | "rejected" | "suspended";
}

interface UpcomingSession {
  id: string;
  studentName: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
}

interface MentorStats {
  totalStudents: number;
  totalSessions: number;
  hoursTaught: number;
  earningsThisMonth: number;
  averageRating: number;
  responseRate: number;
  growth: number;
}

export default function MentorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const stats: MentorStats = {
    totalStudents: 28,
    totalSessions: 89,
    hoursTaught: 142,
    earningsThisMonth: 8900,
    averageRating: 4.9,
    responseRate: 98,
    growth: 15,
  };

  const upcomingSessions: UpcomingSession[] = [
    { id: "1", studentName: "Emma Johnson", subject: "Advanced React Patterns", date: "Wed, Dec 24", time: "2:00 PM – 3:00 PM", duration: "1 hour" },
    { id: "2", studentName: "Liam Chen", subject: "Python for Data Science", date: "Thu, Dec 25", time: "10:00 AM – 11:30 AM", duration: "1.5 hours" },
    { id: "3", studentName: "Sophia Martinez", subject: "System Design Interview Prep", date: "Fri, Dec 26", time: "4:00 PM – 5:00 PM", duration: "1 hour" },
  ];

  const recentReviews = [
    { student: "Emma Johnson", rating: 5, comment: "Amazing explanation of hooks and context!" },
    { student: "Noah Brown", rating: 4.8, comment: "Very patient and clear. Highly recommend!" },
    { student: "Ava Wilson", rating: 5, comment: "Helped me land my dream job. Thank you!" },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          method: "GET",
          credentials: "include", // <-- sends cookies
        });

        if (!res.ok) throw new Error("Failed to fetch user");

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Failed to load user:", err);
        toast.error("Please log in again");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  if (loadingUser) return <p className="text-center mt-10">Loading...</p>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1 px-6 py-5 ml-60">
        <HeaderBar
          user={user}
          title={`Welcome back, ${user.name.split(" ")[0]}!`}
          subtitle="Manage your sessions and grow your mentoring impact"
        />

        {user.role === "mentor" && user.status === "pending" ? (
          <div className="mt-5">
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
              Your mentor account is waiting for admin approval. You will have full access once verified.
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
              <StatCard icon={<Users className="w-5 h-5" />} label="Total Students" value={stats.totalStudents} color="from-blue-500 to-blue-600" />
              <StatCard icon={<Calendar className="w-5 h-5" />} label="Sessions This Month" value={stats.totalSessions} color="from-purple-500 to-purple-600" />
              <StatCard icon={<Clock className="w-5 h-5" />} label="Hours Taught" value={stats.hoursTaught} color="from-teal-500 to-teal-600" />
              <StatCard icon={<DollarSign className="w-5 h-5" />} label="Earnings This Month" value={`Rs. ${stats.earningsThisMonth.toLocaleString()}`} color="from-orange-500 to-orange-600" trend={`+${stats.growth}%`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-5">
                <UpcomingSessions sessions={upcomingSessions} />
                <RatingsCard averageRating={stats.averageRating} responseRate={stats.responseRate} />
                <RecentReviews reviews={recentReviews} />
              </div>

              <div className="space-y-5">
                <QuickActions />
                <EarningsSummary earnings={stats.earningsThisMonth} growth={stats.growth} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Components
function StatCard({ icon, label, value, color, trend }: { icon: React.ReactNode; label: string; value: string | number; color: string; trend?: string }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg bg-gradient-to-r ${color} text-white`}>{icon}</div>
        {trend && (
          <span className="text-xs font-medium text-green-600 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </div>
  );
}

function UpcomingSessions({ sessions }: { sessions: UpcomingSession[] }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Upcoming Sessions</h3>
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No upcoming sessions</p>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.studentName}</p>
                  <p className="text-xs text-gray-600">{s.subject}</p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-medium text-gray-900">{s.date}</p>
                <p className="text-gray-600">{s.time}</p>
                <p className="text-gray-500 mt-1">{s.duration}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RatingsCard({ averageRating, responseRate }: { averageRating: number; responseRate: number }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Your Ratings & Response</h3>
      <div className="grid grid-cols-2 gap-6 text-center">
        <div>
          <p className="text-2xl font-bold text-orange-600">★ {averageRating}</p>
          <p className="text-sm text-gray-600 mt-1">Average Rating</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">{responseRate}%</p>
          <p className="text-sm text-gray-600 mt-1">Response Rate</p>
        </div>
      </div>
    </div>
  );
}

function RecentReviews({ reviews }: { reviews: { student: string; rating: number; comment: string }[] }) {
  return (
    <div className="bg-white rounded-lg p-5 shadow border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Student Reviews</h3>
      <div className="space-y-4">
        {reviews.map((r, i) => (
          <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-900">{r.student}</p>
              <p className="text-sm text-orange-600 font-medium">★ {r.rating}</p>
            </div>
            <p className="text-xs text-gray-600 italic">"{r.comment}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="bg-white rounded-lg p-5 shadow border border-gray-100">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-2">
        <button className="w-full py-2.5 px-4 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
          <Calendar className="w-4 h-4" />
          Schedule New Session
        </button>
        <button className="w-full py-2.5 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Check Messages
        </button>
        <button className="w-full py-2.5 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
          <BookOpen className="w-4 h-4" />
          Update Availability
        </button>
      </div>
    </div>
  );
}

function EarningsSummary({ earnings, growth }: { earnings: number; growth: number }) {
  return (
    <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg p-5 text-white shadow-lg">
      <h3 className="text-base font-semibold mb-3">This Month's Earnings</h3>
      <p className="text-2xl font-bold mb-2">Rs. {earnings.toLocaleString()}</p>
      <p className="text-xs opacity-90 flex items-center gap-1">
        <TrendingUp className="w-4 h-4" />
        +{growth}% from last month
      </p>
      <button className="mt-5 w-full py-2.5 bg-white text-orange-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition">
        View Earnings Report
      </button>
    </div>
  );
}
