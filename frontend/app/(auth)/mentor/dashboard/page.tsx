"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Calendar, Clock, DollarSign, Users } from "lucide-react";
import AuthLayout from "../../layout"; // adjust path if needed

interface User {
  id: string;
  name: string;
  email: string;
  role: "mentor";
  status?: "pending" | "accepted" | "rejected" | "suspended";
}

interface Session {
  id: string;
  studentName: string;
  subject: string;
  date: string;
  time: string;
}

interface MentorStats {
  totalStudents: number;
  totalSessions: number;
  hoursTaught: number;
  earningsThisMonth: number;
  growth: number;
}

export default function MentorDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const stats: MentorStats = {
    totalStudents: 28,
    totalSessions: 89,
    hoursTaught: 142,
    earningsThisMonth: 8900,
    growth: 15,
  };

  const dummySessions: Session[] = [
    { id: "1", studentName: "Emma Johnson", subject: "Advanced React Patterns", date: "Wed, Dec 24", time: "2:00 PM – 3:00 PM"},
    { id: "2", studentName: "Liam Chen", subject: "Python for Data Science", date: "Thu, Dec 25", time: "10:00 AM – 11:30 AM" },
    { id: "3", studentName: "Sophia Martinez", subject: "System Design Interview Prep", date: "Fri, Dec 26", time: "4:00 PM – 5:00 PM"},
    { id: "4", studentName: "Noah Brown", subject: "JavaScript Interview Questions", date: "Sat, Dec 27", time: "1:00 PM – 2:00 PM"},
    { id: "5", studentName: "Ava Wilson", subject: "AWS Basics", date: "Sun, Dec 28", time: "11:00 AM – 12:30 PM"},
  ];

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
    setRecentSessions(dummySessions); // dummy sessions
  }, []);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!user) return null;

  return (
    <AuthLayout
      header={{
        title: `Welcome back, ${user.name.split(" ")[0]}!`,
        subtitle: "Manage your sessions and track your performance",
        showSearch: false,
      }}
    >
      <Toaster position="top-right" />

      {/* ---------- Pending or Rejected Status ---------- */}
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
          {/* ---------- Stats Cards ---------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={<Users className="w-5 h-5" />} label="Total Students" value={stats.totalStudents} />
            <StatCard icon={<Calendar className="w-5 h-5" />} label="Sessions This Month" value={stats.totalSessions} />
            <StatCard icon={<Clock className="w-5 h-5" />} label="Hours Taught" value={stats.hoursTaught} />
            <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Revenue" value={`Rs. ${stats.earningsThisMonth.toLocaleString()}`}/>
          </div>

          {/* ---------- Recent Sessions ---------- */}
          <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Sessions</h3>
            <div className="space-y-3">
              {recentSessions.map(s => (
                <div key={s.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.studentName}</p>
                    <p className="text-xs text-gray-600">{s.subject}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{s.date}</p>
                    <p>{s.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AuthLayout>
  );
}

/* ---------------- Components ---------------- */
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
