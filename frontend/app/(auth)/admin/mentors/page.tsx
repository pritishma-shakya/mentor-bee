"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ChevronRight, ChevronDown, Loader2, CheckCircle, XCircle, Ban } from "lucide-react";
import AuthLayout from "../../layout"; // Adjust path if needed

interface Admin {
  id: string;
  name: string;
  email: string;
  role: "admin";
  profile_picture?: string;
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
  profile_picture?: string;
  status: "pending" | "accepted" | "rejected" | "suspended";
  citizenship_id_url?: string;
  bachelors_degree_url?: string;
  masters_degree_url?: string;
  plus_two_url?: string;
  phd_url?: string;
  experience_certificate_url?: string;
  highest_degree?: string;
  phone_number?: string;
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
      const res = await fetch(`http://localhost:5000/api/admin/mentor-requests/${id}/${action}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update status");
      }

      const data = await res.json();

      setRequests(prev => prev.map(r => (r.id === id ? { ...r, status: data.data.status } : r)));

      toast.success(`Mentor ${action === "suspend" ? "suspended" : action + "ed"} successfully!`, {
        icon: action === "accept" ? <CheckCircle /> : action === "reject" ? <XCircle /> : <Ban />,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update mentor status");
    } finally {
      setLoadingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const statusColors: Record<MentorRequest["status"], string> = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    suspended: "bg-gray-200 text-gray-700",
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <AuthLayout
      header={{
        title: "Mentor Management",
        subtitle: "Review applications and manage mentor accounts",
        user: admin,
      }}
    >
      <Toaster position="top-right" />

      <div className="mt-6 space-y-4">
        {requests.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
            <p className="text-gray-500 font-medium">No pending mentor requests found.</p>
          </div>
        )}

        {requests.map((r) => {
          const expanded = expandedIds.includes(r.id);
          const isLoading = loadingId === r.id;

          return (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Summary Row */}
              <div className="p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden flex-shrink-0 text-orange-600 font-bold">
                    {r.profile_picture ? (
                      <img
                        src={r.profile_picture}
                        alt={r.full_name || "Mentor"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      r.full_name ? r.full_name[0].toUpperCase() : "?"
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {r.full_name || "N/A"}
                      {r.highest_degree && (
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold uppercase">
                          {r.highest_degree}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">{r.email || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status]}`}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>

                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(r.id, "accept")}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(r.id, "reject")}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {r.status === "accepted" && (
                    <button
                      onClick={() => handleAction(r.id, "suspend")}
                      disabled={isLoading}
                      className="px-4 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                      Suspend
                    </button>
                  )}

                  <button
                    onClick={() => toggleExpand(r.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                  >
                    {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Details Section */}
              {expanded && (
                <div className="border-t border-gray-100 bg-gray-50/30 p-6 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Profile Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Expertise</p>
                          <div className="flex flex-wrap gap-1.5">
                            {r.expertise?.length ? r.expertise.map((exp, i) => (
                              <span key={i} className="bg-white border border-gray-200 px-2 py-0.5 rounded text-xs text-gray-700">
                                {exp}
                              </span>
                            )) : "None"}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Hourly Rate</p>
                          <p className="font-semibold text-gray-900">Rs. {r.hourly_rate ?? "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Experience</p>
                          <p className="font-semibold text-gray-900">{r.experience || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Location</p>
                          <p className="font-semibold text-gray-900">{r.location || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Phone Number</p>
                          <p className="font-semibold text-gray-900">{r.phone_number || "Contact Not Provided"}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 font-medium mb-1">Bio</p>
                        <p className="text-sm text-gray-700">
                          {r.bio || "No biography provided."}
                        </p>
                      </div>
                    </div>

                    {/* Verification Documents */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verification Documents</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <DocumentCard label="ID / Citizenship" url={r.citizenship_id_url} />
                        <DocumentCard label="Experience cert" url={r.experience_certificate_url} />
                        {r.plus_two_url && <DocumentCard label="+2 Transcript" url={r.plus_two_url} />}
                        {r.bachelors_degree_url && <DocumentCard label="Bachelors" url={r.bachelors_degree_url} />}
                        {r.masters_degree_url && <DocumentCard label="Masters" url={r.masters_degree_url} />}
                        {r.phd_url && <DocumentCard label="PhD Degree" url={r.phd_url} />}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AuthLayout>
  );
}

function DocumentCard({ label, url }: { label: string; url?: string }) {
  if (!url) return (
    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center opacity-60">
      <Loader2 className="w-4 h-4 text-gray-300 mb-1" />
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">{label}</p>
      <p className="text-[9px] text-gray-400 uppercase mt-0.5">Not Uploaded</p>
    </div>
  );

  const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i) != null || url.includes("cloudinary.com");

  return (
    <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-orange-300 transition shadow-sm">
      <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden flex items-center justify-center">
        {isImage ? (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <Ban className="w-6 h-6 opacity-20" />
            <span className="text-[9px] font-bold uppercase mt-1">PDF File</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-gray-900 px-3 py-1.5 rounded shadow-md font-bold text-[10px] uppercase tracking-wider hover:bg-gray-50 transition"
          >
            View
          </a>
        </div>
      </div>
      <div className="p-2 bg-white border-t border-gray-50 mt-auto">
        <p className="text-[10px] font-bold text-gray-700 uppercase truncate">{label}</p>
      </div>
    </div>
  );
}
