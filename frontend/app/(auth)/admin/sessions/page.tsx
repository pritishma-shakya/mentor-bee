"use client";

import { useEffect, useState } from "react";
import AuthLayout from "../../layout";
import { toast } from "react-hot-toast";
import { Video, MapPin } from "lucide-react";

interface AdminSession {
  id: string;
  date: string;
  time: string;
  course: string;
  type: string;
  location: string | null;
  status: string;
  payment_status: string;
  student_name: string;
  mentor_name: string;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Accepted: "bg-blue-100 text-blue-700",
  Started: "bg-purple-100 text-purple-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Rejected: "bg-red-100 text-red-700",
};

const PAYMENT_COLORS: Record<string, string> = {
  Paid: "bg-green-100 text-green-700",
  "Not Paid": "bg-gray-100 text-gray-500",
};

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/auth/profile", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUser(data.user);
      })
      .catch(err => console.error(err));

    const fetchSessions = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/sessions", { credentials: "include" });
        const data = await res.json();
        if (data.success) setSessions(data.data);
      } catch {
        toast.error("Failed to load sessions");
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const filters = ["All", "Pending", "Accepted", "Completed", "Cancelled"];
  const filtered = activeFilter === "All"
    ? sessions
    : sessions.filter(s => s.status === activeFilter);

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
    catch { return d; }
  };
  const formatTime = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  return (
    <AuthLayout header={{ title: "All Sessions", subtitle: "Monitor all platform sessions", user }}>
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", value: sessions.length, color: "text-gray-900" },
            { label: "Completed", value: sessions.filter(s => s.status === "Completed").length, color: "text-green-600" },
            { label: "Paid", value: sessions.filter(s => s.payment_status === "Paid").length, color: "text-blue-600" },
            { label: "Unpaid", value: sessions.filter(s => s.payment_status === "Not Paid").length, color: "text-orange-500" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
              <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
              <p className={`text-xl font-black mt-0.5 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeFilter === f
                  ? "bg-orange-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-[11px] uppercase font-semibold text-gray-500">
                <tr>
                  <th className="px-3 py-2.5">Student</th>
                  <th className="px-3 py-2.5">Mentor</th>
                  <th className="px-3 py-2.5">Course</th>
                  <th className="px-3 py-2.5">Date & Time</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400 text-xs">Loading sessions...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400 text-xs">No sessions found.</td></tr>
                ) : (
                  filtered.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap">{s.student_name}</td>
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{s.mentor_name}</td>
                      <td className="px-3 py-2.5 max-w-[120px] truncate text-gray-600">{s.course}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-500">
                        {formatDate(s.date)}, {formatTime(s.time)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-gray-500">
                          {s.type === "Online"
                            ? <Video className="w-3 h-3 text-blue-400" />
                            : <MapPin className="w-3 h-3 text-orange-400" />}
                          {s.type}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] || "bg-gray-100 text-gray-600"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PAYMENT_COLORS[s.payment_status] || "bg-gray-100 text-gray-500"}`}>
                          {s.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}