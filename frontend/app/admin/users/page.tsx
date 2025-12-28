"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import HeaderBar from "@/components/header-bar";
import { User as UserIcon } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor";
  status?: string;
  created_at?: string;
  verified_at?: string;
}

export default function AdminUsersPage() {
  const [students, setStudents] = useState<User[]>([]);
  const [mentors, setMentors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"students" | "mentors">("students");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/auth/profile", { credentials: "include" })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(console.error);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, mentorsRes] = await Promise.all([
          fetch("http://localhost:5000/api/admin/students", { credentials: "include" }),
          fetch("http://localhost:5000/api/admin/mentors", { credentials: "include" }),
        ]);

        const studentsData = await studentsRes.json();
        const mentorsData = await mentorsRes.json();

        setStudents(studentsData.data || []);
        setMentors(mentorsData.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderTable = (data: User[], isMentor = false) => (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-left text-gray-600">
          <th className="py-3">Name</th>
          <th>Email</th>
          {isMentor && <th>Status</th>}
          {isMentor && <th>Verified At</th>}
          <th>Joined</th>
        </tr>
      </thead>
      <tbody>
        {data.map(u => (
          <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
            <td className="py-3 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">{u.name}</span>
            </td>
            <td className="text-gray-600">{u.email}</td>
            {isMentor && <td className="text-gray-500">{u.status || "-"}</td>}
            {isMentor && (
              <td className="text-gray-500">
                {u.verified_at ? new Date(u.verified_at).toLocaleString() : "-"}
              </td>
            )}
            <td className="text-gray-500">
              {u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 px-6 py-5 ml-60">
        <HeaderBar user={user} title="All Users" subtitle="Manage all students and mentors" />

        {/* Tabs like Explore page */}
        <div className="flex items-center gap-6 border-b border-gray-200 mb-5">
          {["students", "mentors"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`pb-2 px-1 text-sm font-medium relative transition-colors ${
                tab === t ? "text-orange-600" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t === "students" ? "Students" : "Mentors"}
              {tab === t && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-100 p-5">
          {loading ? (
            <p className="text-center text-gray-500 py-10">Loading...</p>
          ) : tab === "students" ? (
            renderTable(students)
          ) : (
            renderTable(mentors, true)
          )}
        </div>
      </div>
    </div>
  );
}
