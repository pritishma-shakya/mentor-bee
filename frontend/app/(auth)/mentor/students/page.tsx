"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Users, Mail, Calendar, BookOpen, Search, User as UserIcon } from "lucide-react";
import AuthLayout from "../../layout";

interface Student {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
  total_sessions: number;
  last_session_date: string;
}

export default function MyStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });
        const profileData = await profileRes.json();
        if (profileData.success) setUser(profileData.user);

        const studentsRes = await fetch("http://localhost:5000/api/mentors/my-students", {
          credentials: "include",
        });
        const studentsData = await studentsRes.json();
        if (studentsData.success) {
          setStudents(studentsData.data);
        } else {
          toast.error(studentsData.message || "Failed to fetch students");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading students");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading students...</div>;

  return (
    <AuthLayout
      header={{
        title: "My Students",
        subtitle: "Manage and track your student relationships",
        user,
      }}
    >
      <div className="space-y-6">
        {/* Stats Summary - Matching Dashboard Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Total Students"
            value={students.length}
          />
        </div>

        {/* Search & List */}
        <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/30">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">Student Directory</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 text-gray-500 text-[10px] uppercase font-bold border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Sessions</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-10 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                            {s.profile_picture ? (
                              <img
                                src={s.profile_picture.startsWith('http') ? s.profile_picture : `http://localhost:5000${s.profile_picture}`}
                                alt={s.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 text-xs font-bold">
                                {s.name[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-gray-600 text-xs">
                          <Mail className="w-3.5 h-3.5" />
                          {s.email}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-gray-700 text-xs font-medium">
                          <BookOpen className="w-3.5 h-3.5" />
                          {s.total_sessions} sessions
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-gray-500 text-[10px]">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(s.last_session_date)}
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <button
                          onClick={() => window.location.href = `/messages?studentId=${s.id}`}
                          className="px-3 py-1 bg-white border border-gray-200 rounded-md text-[10px] font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                          Message
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-20 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-dashed border-gray-200">
                        <UserIcon className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-gray-500 text-sm">No students found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
