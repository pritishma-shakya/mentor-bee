"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "@/components/sidebar";
import HeaderBar from "@/components/header-bar";
import { ChevronRight, ChevronDown, Loader2, CheckCircle, XCircle, Ban } from "lucide-react";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: "admin";
}

interface MentorRequest {
  id: string;
  full_name?: string;
  email?: string;
  bio?: string;
  experience?: string;
  location?: string;
  hourly_rate?: number;
  response_time?: string;
  expertise?: string[];
  status: "pending" | "accepted" | "rejected" | "suspended";
}

export default function AdminApprovalsPage() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [requests, setRequests] = useState<MentorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });
        if (!profileRes.ok) throw new Error("Unauthorized");
        const profileData = await profileRes.json();
        if (profileData.user.role !== "admin") throw new Error("Forbidden");
        setAdmin(profileData.user);

        const mentorsRes = await fetch("http://localhost:5000/api/admin/mentor-requests", {
          credentials: "include",
        });
        const mentorsData = await mentorsRes.json();

        if (mentorsData.success && Array.isArray(mentorsData.data)) {
          setRequests(mentorsData.data);
        } else {
          toast.error("Failed to load mentor requests");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAction = async (id: string, action: "accept" | "reject" | "suspend") => {
    if (action !== "accept" && !window.confirm(`Are you sure you want to ${action} this mentor?`)) return;

    setLoadingId(id);

    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/mentor-requests/${id}/${action}`,
        { method: "POST", credentials: "include" }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update status");
      }

      const data = await res.json();

      // Update the local table with new status
      setRequests(prev =>
        prev.map(r => (r.id === id ? { ...r, status: data.data.status } : r))
      );

      toast.success(
        `Mentor ${action === "suspend" ? "suspended" : action + "ed"} successfully!`,
        {
          icon: action === "accept" ? <CheckCircle /> : action === "reject" ? <XCircle /> : <Ban />,
        }
      );
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update mentor status");
    } finally {
      setLoadingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    suspended: "bg-gray-200 text-gray-700",
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="flex-1 px-6 py-5 ml-60">
        <HeaderBar
          user={admin}
          title="Admin Dashboard"
          subtitle="Approve mentor requests and manage users"
        />

        <div className="mt-5 flex flex-col gap-6">
          {requests.length === 0 && (
            <p className="text-gray-500 text-center py-6">No mentor requests found.</p>
          )}

          {requests.map(r => {
            const expanded = expandedIds.includes(r.id);
            const isLoading = loadingId === r.id;

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 w-full"
              >
                {/* Summary Row */}
                <div className="flex items-center justify-between px-0 pb-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xl">
                      {r.full_name ? r.full_name[0].toUpperCase() : "?"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {r.full_name || "N/A"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">{r.email || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[r.status]}`}
                    >
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>

                    {r.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(r.id, "accept")}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(r.id, "reject")}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Reject
                        </button>
                      </div>
                    )}

                    {r.status === "accepted" && (
                      <button
                        onClick={() => handleAction(r.id, "suspend")}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                        Suspend
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpand(r.id)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      {expanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expandable Details */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    expanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="border-t border-gray-200 pt-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                    <div className="space-y-3">
                      <p>
                        <span className="font-medium text-gray-800">Bio:</span>
                        <br />
                        {r.bio || "Not provided"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-800">Expertise:</span>
                        <br />
                        {r.expertise?.length ? r.expertise.join(" • ") : "None listed"}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p>
                        <span className="font-medium text-gray-800">Experience:</span> {r.experience || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-800">Location:</span> {r.location || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-800">Hourly Rate:</span> Rs. {r.hourly_rate ?? "N/A"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-800">Response Time:</span>{" "}
                        {r.response_time || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
