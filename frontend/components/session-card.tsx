"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  ChevronRight,
  ChevronDown,
  MapPin,
  Play,
  XCircle,
  CheckCircle,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

interface Session {
  id: string;
  mentor_id: string;
  mentor_name?: string;
  mentor_profile_picture?: string;
  course?: string;
  topic?: string;
  date: string;
  time: string;
  meeting_link?: string;
  goal?: string;
  notes?: string;
  status: "Completed" | "Cancelled" | "Pending" | "Accepted" | "Rejected" | "Started" | "Cancel Requested" | "Reschedule Requested";
  type: "Online" | "In-Person";
  location: string | null;
  mentor_user_id?: string;
  cancel_requested_by?: string;
  reschedule_requested_by?: string;
  rescheduled_date?: string;
  rescheduled_time?: string;
  payment_status?: "Paid" | "Cash at Venue" | "Not Paid" | string;
}

interface SessionCardProps {
  session: Session;
  user: any;
  onCancel?: (id: string) => void;
  onRespond?: (id: string, type: "reschedule" | "cancel", action: "accept" | "reject") => void;
  onReschedule?: (id: string, date: string, time: string) => void;
}

const formatDate = (date: string | undefined) => {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date; // Return original if invalid
    return d.toISOString().split('T')[0];
  } catch (e) {
    return date;
  }
};

export default function SessionCard({ session, user, onCancel, onRespond }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Helper to get correct image URL
  const getProfileImage = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("https")) {
      return path;
    }
    return `http://localhost:5000${path}`;
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel(session.id);
    }
    setShowCancelConfirm(false);
  };

  const isRequester = (status: string) => {
    if (status === 'Cancel Requested') return session.cancel_requested_by === user?.id;
    if (status === 'Reschedule Requested') return session.reschedule_requested_by === user?.id;
    return false;
  };

  const statusColors: any = {
    Accepted: "bg-blue-50 text-blue-700 border-blue-200",
    Started: "bg-purple-50 text-purple-700 border-purple-200",
    Completed: "bg-green-50 text-green-700 border-green-200",
    Cancelled: "bg-red-50 text-red-700 border-red-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
    Pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    "Cancel Requested": "bg-orange-50 text-orange-700 border-orange-200",
    "Reschedule Requested": "bg-orange-50 text-orange-700 border-orange-200",
  };

  const paymentStatusColors: Record<string, string> = {
    "Paid": "bg-green-50 text-green-700 border-green-200",
    "Cash at Venue": "bg-orange-50 text-orange-700 border-orange-200",
    "Not Paid": "bg-red-50 text-red-700 border-red-200",
  };


  const renderActions = (isExpanded: boolean) => {
    return (
      <div className={`flex gap-2 flex-wrap ${isExpanded ? 'pt-2' : 'mt-4'}`}>
        {(session.status === "Accepted" || session.status === "Started") && session.type === 'Online' ? (
          <Link href={`/session-call/${session.id}`} className={`${isExpanded ? 'px-6 py-2' : 'px-4 py-1.5'} bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg ${isExpanded ? 'text-sm' : 'text-xs'} flex items-center justify-center gap-2 transition shadow-sm`}>
            <Video className={isExpanded ? "w-4 h-4" : "w-3.5 h-3.5"} />
            Join Session
          </Link>
        ) : (session.status === "Accepted" || session.status === "Started") && session.type === 'In-Person' ? (
          <button className={`${isExpanded ? 'px-6 py-2' : 'px-4 py-1.5'} bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg ${isExpanded ? 'text-sm' : 'text-xs'} flex items-center justify-center gap-2 transition shadow-sm`}>
            <Play className={isExpanded ? "w-4 h-4" : "w-3.5 h-3.5"} />
            {session.status === "Started" ? "Continue Session" : "Start Session"}
          </button>
        ) : null}

        <Link href={`/messages?mentorId=${session.mentor_user_id}`} className={`${isExpanded ? 'px-6 py-2' : 'px-4 py-1.5'} border border-gray-300 bg-white hover:bg-gray-50 rounded-lg font-medium ${isExpanded ? 'text-sm' : 'text-xs'} text-gray-800 flex items-center gap-2 transition shadow-sm`}>
          <MessageCircle className={isExpanded ? "w-4 h-4" : "w-3.5 h-3.5"} /> Message
        </Link>

        {/* ACTION BUTTONS */}
        {["Accepted", "Pending"].includes(session.status) && (
          <Link 
            href={`/book-session/${session.mentor_id}?rescheduleSessionId=${session.id}`}
            className={`${isExpanded ? 'px-4 py-2 text-sm' : 'px-4 py-1.5 text-xs'} border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg font-medium transition flex items-center gap-2`}
          >
            <Calendar className={isExpanded ? "w-4 h-4" : "w-3.5 h-3.5"} /> Reschedule
          </Link>
        )}

        {["Pending", "Accepted", "Reschedule Requested"].includes(session.status) && onCancel && session.status !== "Cancel Requested" && (
          <button onClick={() => setShowCancelConfirm(true)} className={`${isExpanded ? 'px-4 py-2 text-sm' : 'px-4 py-1.5 text-xs'} text-red-600 hover:bg-red-50 rounded-lg font-medium transition flex items-center gap-2`}>
            <XCircle className={isExpanded ? "w-4 h-4" : "w-3.5 h-3.5"} /> Cancel
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition relative">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
            {session.mentor_profile_picture ? (
              <img
                src={getProfileImage(session.mentor_profile_picture)}
                alt={session.mentor_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 font-bold text-lg">
                {session.mentor_name ? session.mentor_name[0].toUpperCase() : "?"}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {session.mentor_name ?? "Unknown Mentor"}
              </h3>

              <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[session.status] || ""}`}>
                {session.status}
              </div>

              {session.payment_status && session.payment_status !== "Not Paid" && (
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${paymentStatusColors[session.payment_status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                  {session.payment_status}
                </div>
              )}

              {session.course && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full border border-gray-200">
                  {session.course}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-gray-600 text-xs text-nowrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(session.date).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {session.time}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
        >
          {expanded ? "Hide Details" : "View Details"}
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </div>

      {/* Status Messages for Requests */}
      {session.status === "Pending" && (
        <div className="mt-3 text-blue-700 text-xs flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          Awaiting mentor's response to your booking request.
        </div>
      )}

      {session.status === "Cancel Requested" && (
        <div className={`mt-3 p-2 rounded-lg text-xs flex items-center justify-between ${isRequester(session.status) ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"}`}>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            <span>{isRequester(session.status) ? "Cancellation pending mentor's approval." : `${session.mentor_name} requested to cancel this session.`}</span>
          </div>
          {!isRequester(session.status) && onRespond && (
            <div className="flex gap-2">
              <button 
                onClick={() => onRespond(session.id, "cancel", "accept")}
                className="px-3 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition"
              >
                Accept
              </button>
              <button 
                onClick={() => onRespond(session.id, "cancel", "reject")}
                className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded font-bold hover:bg-gray-50 transition"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}

      {session.status === "Reschedule Requested" && (
        <div className={`mt-3 p-2 rounded-lg text-xs flex flex-col gap-2 ${isRequester(session.status) ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <Calendar className="w-4 h-4" />
              <span>{isRequester(session.status) ? "Reschedule pending approval." : `${session.mentor_name} requested to reschedule.`}</span>
            </div>
            {!isRequester(session.status) && onRespond && (
              <div className="flex gap-2">
                <button 
                    onClick={() => onRespond(session.id, "reschedule", "accept")}
                    className="px-3 py-1 bg-orange-600 text-white rounded font-bold hover:bg-orange-700 transition shadow-sm"
                >
                    Accept
                </button>
                <button 
                   onClick={() => onRespond(session.id, "reschedule", "reject")}
                   className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded font-bold hover:bg-gray-50 transition shadow-sm"
                >
                    Reject
                </button>
              </div>
            )}
          </div>
          <p className="text-[11px] opacity-90 px-6">Proposed: <span className="font-bold">{formatDate(session.rescheduled_date)}</span> at <span className="font-bold">{session.rescheduled_time}</span></p>
        </div>
      )}

      {expanded && (
        <div className="mt-4 border-t pt-4 text-sm text-gray-700 space-y-3">
          <div>
            <p className="text-gray-500">Session Type:</p>
            <div className="flex items-center gap-2">
              {session.type === 'Online' ? <Video className="w-4 h-4 text-gray-400" /> : <MapPin className="w-4 h-4 text-gray-400" />}
              <span>{session.type} {session.location ? `(${session.location})` : ''}</span>
            </div>
          </div>

          {session.meeting_link && session.status !== "Pending" && (
            <div>
              <p className="text-gray-500">Session Link:</p>
              <a href={session.meeting_link} target="_blank" className="text-blue-600 font-medium break-all hover:underline">{session.meeting_link}</a>
            </div>
          )}

          {session.notes && (
            <div>
              <p className="text-gray-500">Special Notes:</p>
              <p className="bg-gray-50 p-2 rounded-lg border border-gray-100 italic">"{session.notes}"</p>
            </div>
          )}

          {renderActions(true)}
        </div>
      )}

      {!expanded && renderActions(false)}

      {/* Confirmation Modals */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Session</h3>
              <p className="text-sm text-gray-600">Are you sure you want to request cancellation? This requires mentor's approval.</p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowCancelConfirm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition">No, Keep it</button>
              <button onClick={handleCancelClick} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm">Yes, Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
