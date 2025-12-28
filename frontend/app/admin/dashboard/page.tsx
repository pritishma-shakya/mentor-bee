"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import HeaderBar from "@/components/header-bar";
import { Users, UserCheck, Calendar, DollarSign } from "lucide-react";

/* ---------------- Types ---------------- */
interface AdminSummary {
  totalUsers: number;
  mentors: number;
  sessions: number;
  revenue: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor";
  created_at?: string;
}

/* ---------------- Page ---------------- */
export default function AdminDashboard() {
  const [summary, setSummary] = useState<AdminSummary>({
    totalUsers: 0,
    mentors: 0,
    sessions: 0,
    revenue: 0,
  });

  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [pendingMentors, setPendingMentors] = useState(0);
  const [user, setUser] = useState<any>(null);

  /* -------- Logged-in admin -------- */
  useEffect(() => {
    fetch("http://localhost:5000/api/auth/profile", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(console.error);
  }, []);

  /* -------- Dashboard summary -------- */
  useEffect(() => {
    fetch("http://localhost:5000/api/admin/dashboard/summary", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setSummary(data.data);
      })
      .catch(console.error);
  }, []);

  /* -------- Recent users -------- */
  useEffect(() => {
    fetch("http://localhost:5000/api/admin/dashboard/recent-users", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setRecentUsers(data.data);
      })
      .catch(console.error);
  }, []);

  /* -------- Pending mentor approvals -------- */
  useEffect(() => {
    fetch("http://localhost:5000/api/admin/dashboard/pending-mentors", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setPendingMentors(data.data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 px-6 py-5 ml-60">
        <HeaderBar
          user={user}
          title="Admin Dashboard"
          subtitle="Monitor platform activity and performance"
        />

        {/* -------- Summary Cards -------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Users} label="Total Users" value={summary.totalUsers} />
          <StatCard icon={UserCheck} label="Mentors" value={summary.mentors} />
          <StatCard icon={Calendar} label="Sessions" value={summary.sessions} />
          <StatCard icon={DollarSign} label="Revenue" value={`Rs. ${summary.revenue}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* -------- Recent Users -------- */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-100 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Recent Users
              </h3>

              <a
                href="/admin/users"
                className="text-xs text-orange-600 font-medium hover:underline"
              >
                View all →
              </a>
            </div>

            <div className="space-y-3">
              {recentUsers.length === 0 && (
                <p className="text-sm text-gray-500">No users found.</p>
              )}

              {recentUsers.map(u => (
                <div
                  key={u.id}
                  className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {u.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {u.email}
                    </p>
                  </div>

                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      u.role === "mentor"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* -------- Admin Actions -------- */}
          <div className="space-y-4">
            <AdminAction
              title="Pending Mentor Approvals"
              value={pendingMentors}
              description="Mentors awaiting verification"
              link="/admin/approvals"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-100 flex items-center gap-4">
      <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function AdminAction({
  title,
  value,
  description,
  link,
}: {
  title: string;
  value: number;
  description: string;
  link?: string;
}) {
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="text-2xl font-bold text-orange-600 mt-2">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>

      {link && (
        <a
          href={link}
          className="mt-3 inline-block text-xs text-orange-600 font-medium hover:underline"
        >
          View Details →
        </a>
      )}
    </div>
  );
}
