"use client";

import { useEffect, useState, Suspense } from "react";
import Sidebar from "@/components/sidebar";
import HeaderBar from "@/components/header-bar";
import {
  Flag,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertTriangle,
  MessageSquare,
  ExternalLink,
  ShieldAlert,
  UserMinus,
  CheckCircle,
  AlertOctagon,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff
} from "lucide-react";
import Pagination from "@/components/pagination";
import AuthLayout from "@/app/(auth)/layout";
import toast, { Toaster } from "react-hot-toast";

interface Report {
  id: number;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string;
  status: "pending" | "resolved" | "dismissed" | "warned" | "suspended";
  created_at: string;
  updated_at: string;
  reporter_name: string;
  reporter_email: string;
  reported_name: string;
  reported_email: string;
  reporter_picture?: string;
  reported_picture?: string;
}

const getProfileImage = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("https")) return path;
  return `http://localhost:5000${path}`;
};

function ReportsContent() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/reports/admin", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
      toast.error("Error loading reports");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: number, status: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reports/admin/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update report status");

      toast.success(`Report marked as ${status}`);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: status as any } : r));
    } catch (err) {
      console.error(err);
      toast.error("Error updating report");
    }
  };

  const filteredReports = reports.filter(r =>
    statusFilter === "all" ? true : r.status === statusFilter
  );

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusStyles: any = {
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    resolved: "bg-green-100 text-green-700 border-green-200",
    dismissed: "bg-gray-100 text-gray-700 border-gray-200",
    warned: "bg-orange-100 text-orange-700 border-orange-200",
    suspended: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Security Reports</h2>
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-100 shadow-sm overflow-x-auto">
          {['all', 'pending', 'resolved', 'warned', 'suspended', 'dismissed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all capitalize whitespace-nowrap ${statusFilter === s
                ? "bg-orange-600 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Involved Parties</th>
                <th className="px-6 py-4">Report Reason</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Loading reports...</td></tr>
              ) : paginatedReports.length > 0 ? (
                paginatedReports.map((r) => (
                  <Suspense key={r.id}>
                    <tr
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedId === r.id ? 'bg-red-50/20' : ''}`}
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                            {r.reporter_picture ? (
                              <img src={getProfileImage(r.reporter_picture)} alt={r.reporter_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 font-bold text-sm">
                                {r.reporter_name[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-sm">{r.reporter_name}</span>
                            <span className="text-[10px] text-gray-400">reporting {r.reported_name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg text-[11px] border border-red-100">{r.reason}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusStyles[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right pr-12">
                        <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                          {expandedId === r.id ? "Hide Details" : "View Details"}
                          {expandedId === r.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                    {expandedId === r.id && (
                      <tr className="bg-gray-50/30">
                        <td colSpan={4} className="px-12 py-6 border-l-2 border-red-600">
                          <div className="space-y-5 animate-in fade-in slide-in-from-left-2 duration-300">
                            <div>
                              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Detailed Description</h4>
                              <p className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-gray-100 shadow-sm leading-relaxed max-w-2xl">
                                {r.description || "No specific details provided."}
                              </p>
                            </div>

                            <div className="flex gap-8 items-center">
                              {(r as any).evidence_url && (
                                <div>
                                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Evidence</h4>
                                  <a
                                    href={(r as any).evidence_url}
                                    target="_blank"
                                    className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" /> External Source
                                  </a>
                                </div>
                              )}
                              <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reported On</h4>
                                <span className="text-xs text-gray-600 font-bold">{new Date(r.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <div className="pt-2">
                              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Escalate Action</h4>
                              <div className="flex flex-wrap gap-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleUpdateStatus(r.id, "warned"); }}
                                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded shadow-sm transition flex items-center gap-2"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" /> Warn
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleUpdateStatus(r.id, "suspended"); }}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-sm transition flex items-center gap-2"
                                >
                                  <UserMinus className="w-3.5 h-3.5" /> Suspend
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleUpdateStatus(r.id, "resolved"); }}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-sm transition flex items-center gap-2"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Resolve
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleUpdateStatus(r.id, "dismissed"); }}
                                  className="px-3 py-1.5 bg-white text-gray-500 hover:bg-gray-50 border border-gray-200 text-xs font-bold rounded shadow-sm transition"
                                >
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Suspense>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    No reports found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-50 bg-gray-50/10 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/auth/profile", { credentials: "include" })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(console.error);
  }, []);

  return (
    <AuthLayout
      header={{
        title: "Reports",
        subtitle: "Manage safety reports",
        user
      }}
    >
      <Toaster position="top-right" />
      <Suspense fallback={<p className="p-4 text-xs">Loading...</p>}>
        <ReportsContent />
      </Suspense>
    </AuthLayout>
  );
}
