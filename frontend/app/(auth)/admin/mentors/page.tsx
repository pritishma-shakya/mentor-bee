"use client";

import { useEffect, useState, Fragment } from "react";
import Pagination from "@/components/pagination";
import toast, { Toaster } from "react-hot-toast";
import { ChevronRight, ChevronDown, Loader2, CheckCircle, XCircle, Ban } from "lucide-react";
import AuthLayout from "../../layout";

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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  const totalPages = Math.ceil((requests || []).length / ITEMS_PER_PAGE);
  const paginatedData = (requests || []).slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <AuthLayout
      header={{
        title: "Mentor Management",
        subtitle: "Review applications and manage mentor accounts",
        user: admin,
      }}
    >
      <Toaster position="top-right" />
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
            <tr>
              <th className="px-5 py-4">Applicant</th>
              <th className="px-5 py-4">Contact</th>
              <th className="px-5 py-4">Details</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-right cursor-pointer" onClick={() => {/* no-op */ }}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-500 font-medium">
                  No mentor requests found.
                </td>
              </tr>
            )}

            {paginatedData.map((r) => {
              const expanded = expandedIds.includes(r.id);
              const isLoading = loadingId === r.id;

              return (
                <Fragment key={r.id}>
                  <tr className="hover:bg-gray-50/50 transition-colors bg-white">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden flex-shrink-0 text-orange-600 font-bold">
                          {r.profile_picture ? (
                            <img src={r.profile_picture} alt={r.full_name || "Mentor"} className="w-full h-full object-cover" />
                          ) : (
                            r.full_name ? r.full_name[0].toUpperCase() : "?"
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{r.full_name || "N/A"}</h3>
                          <p className="text-xs text-gray-500">{r.email || "N/A"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-900 font-medium whitespace-nowrap">{r.phone_number || "N/A"}</p>
                      <p className="text-xs text-gray-500 whitespace-nowrap">{r.location || "N/A"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-900 font-medium whitespace-nowrap">Rs. {r.hourly_rate ?? "N/A"}/hr</p>
                      <p className="text-xs text-gray-500 whitespace-nowrap">{r.experience || "N/A"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${statusColors[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 min-w-[200px]">
                      <div className="flex items-center justify-end gap-2">
                        {r.status === "pending" && (
                          <>
                            <button onClick={() => handleAction(r.id, "accept")} disabled={isLoading} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded shadow-sm text-xs font-bold transition flex items-center gap-1">
                              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />} Accept
                            </button>
                            <button onClick={() => handleAction(r.id, "reject")} disabled={isLoading} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded shadow-sm text-xs font-bold transition flex items-center gap-1">
                              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />} Reject
                            </button>
                          </>
                        )}
                        {r.status === "accepted" && (
                          <button onClick={() => handleAction(r.id, "suspend")} disabled={isLoading} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded shadow-sm text-xs font-bold transition flex items-center gap-1">
                            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />} Suspend
                          </button>
                        )}
                        <button onClick={() => toggleExpand(r.id)} className="p-1.5 bg-gray-100 border border-gray-200 hover:bg-gray-200 rounded text-gray-600 transition ml-2">
                          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expanded && (
                    <tr className="bg-gray-50/80">
                      <td colSpan={5} className="p-0 border-t border-gray-100 shadow-inner">
                        <div className="p-6 md:p-8 space-y-8">
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
                                <div className="col-span-2 mt-4">
                                  <p className="text-xs text-gray-500 font-medium mb-1">Biography</p>
                                  <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                                    {r.bio || "No biography provided."}
                                  </p>
                                </div>
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
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
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
