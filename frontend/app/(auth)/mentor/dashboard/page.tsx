"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Calendar, DollarSign, Users, BookOpen } from "lucide-react";
import Link from "next/link";
import AuthLayout from "../../layout";

interface User {
  id: string;
  name: string;
  email: string;
  role: "mentor";
  status?: "pending" | "accepted" | "rejected" | "suspended";
}

interface RecentSession {
  id: string;
  date: string;
  time: string;
  course: string;
  status: string;
  type: string;
  student_name: string;
  student_picture: string | null;
}

interface DashboardStats {
  totalSessions: number;
  totalStudents: number;
  recentSessions: RecentSession[];
}

interface EarningsData {
  totalRevenue: number;
  totalPayments: number;
}

export default function MentorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    totalStudents: 0,
    recentSessions: [],
  });
  const [earnings, setEarnings] = useState<EarningsData>({
    totalRevenue: 0,
    totalPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
        toast.error("Please log in again");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user || user.status !== "accepted") return;

    // Fetch session stats + earnings in parallel
    const fetchStats = async () => {
      try {
        const [statsRes, earningsRes] = await Promise.all([
          fetch("http://localhost:5000/api/mentors/dashboard-stats", { credentials: "include" }),
          fetch("http://localhost:5000/api/mentors/earnings", { credentials: "include" }),
        ]);

        const [statsData, earningsData] = await Promise.all([
          statsRes.json(),
          earningsRes.json(),
        ]);

        if (statsData.success) setStats(statsData.data);
        if (earningsData.success) {
          setEarnings({
            totalRevenue: earningsData.data.totalRevenue,
            totalPayments: earningsData.data.totalPayments,
          });
        }
      } catch (err) {
        console.error("Failed to fetch mentor stats:", err);
      }
    };

    fetchStats();
  }, [user]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${suffix}`;
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!user) return null;

  return (
    <AuthLayout
      header={{
        title: `Welcome back, ${user.name.split(" ")[0]}!`,
        subtitle: "Manage your sessions and track your performance",
        showSearch: false,
        user: user,
      }}
    >
      <Toaster position="top-right" />

      {user.status === "pending" && (
        <div className="mt-5">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
            Your mentor account is waiting for admin approval.
          </div>
        </div>
      )}
      {user.status === "rejected" && (
        <div className="mt-5">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
            Your mentor account has been rejected. Please contact admin.
          </div>
        </div>
      )}
      {user.status === "suspended" && (
        <div className="mt-5">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
            Your mentor account has been suspended. Please contact admin.
          </div>
        </div>
      )}

      {user.status === "accepted" && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Total Students"
              value={stats.totalStudents}
            />
            <StatCard
              icon={<BookOpen className="w-5 h-5" />}
              label="Total Sessions"
              value={stats.totalSessions}
            />
            <StatCard
              icon={<Calendar className="w-5 h-5" />}
              label="Paid Sessions"
              value={earnings.totalPayments}
            />
            <StatCard
              icon={<DollarSign className="w-5 h-5" />}
              label="Total Earnings"
              value={`Rs. ${earnings.totalRevenue.toLocaleString()}`}
            />
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Recent Sessions</h3>
              <Link href="/mentor/bookings" className="text-xs text-orange-600 font-medium hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recentSessions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No sessions yet.</p>
              ) : (
                stats.recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      {s.student_picture ? (
                        <img
                          src={s.student_picture}
                          alt={s.student_name}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold">
                          {s.student_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{s.student_name}</p>
                        <p className="text-xs text-gray-600">{s.course}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatDate(s.date)}</p>
                      <p className="text-xs text-gray-400">{formatTime(s.time)}</p>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block ${
                          s.status === "Accepted"
                            ? "bg-green-100 text-green-700"
                            : s.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : s.status === "Cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </AuthLayout>
  );
}

function StatCard({ icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-100 flex items-center gap-4">
      <div className="p-3 bg-orange-100 rounded-lg text-orange-600">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
