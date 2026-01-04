"use client";

import { useEffect, useState } from "react";
import { User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../../layout"; // adjust the path if needed

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
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", { credentials: "include" });
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch profile");
      }
    };

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
        toast.error("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
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
                {u.verified_at ? new Date(u.verified_at).toLocaleDateString() : "-"}
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
    <AuthLayout
      header={{
        title: "All Users",
        subtitle: "Manage all students and mentors",
      }}
    >
      {/* Tabs */}
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
    </AuthLayout>
  );
}
