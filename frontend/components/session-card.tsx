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
  mentor_name?: string;
  mentor_profile_picture?: string;
  course?: string;
  topic?: string;
  date: string;
  time: string;
  meeting_link?: string;
  goal?: string;
  notes?: string;
  status: "Completed" | "Cancelled" | "Pending" | "Accepted" | "Rejected" | "Started";
  type: "Online" | "In-Person";
  location: string | null;
  mentor_user_id?: string;
}

interface SessionCardProps {
  session: Session;
  onCancel?: (id: string) => void;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function SessionCard({ session, onCancel, onAccept, onReject }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Helper to get correct image URL
  const getProfileImage = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("https")) {
      return path;
    }
    return `http://localhost:5000${path}`;
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
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

              <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border
                  ${session.status === 'Accepted' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                  ${session.status === 'Started' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                  ${session.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                  ${session.status === 'Cancelled' || session.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                  ${session.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
              `}>
                {session.status}
              </div>

              {session.course && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full border border-gray-200">
                  {session.course}
                </span>
              )}
            </div>

            {session.topic && (
              <p className="text-gray-700 mt-0.5 text-sm">{session.topic}</p>
            )}

            <div className="flex items-center gap-3 mt-1 text-gray-600 text-xs">
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
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      </div>

      {/* Status Messages */}
      {session.status === "Pending" && (
        <div className="mt-3 text-blue-700 text-xs flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          Your request is being processed by {session.mentor_name}. You will get notified after it's accepted.
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
              <a
                href={session.meeting_link}
                target="_blank"
                className="text-blue-600 font-medium break-all hover:underline"
              >
                {session.meeting_link}
              </a>
            </div>
          )}

          {session.goal && (
            <div>
              <p className="text-gray-500">Topic Goal:</p>
              <p>{session.goal}</p>
            </div>
          )}

          {session.notes && (
            <div>
              <p className="text-gray-500">Special Notes:</p>
              <p className="bg-gray-50 p-2 rounded-lg border border-gray-100 italic">"{session.notes}"</p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap pt-2">
            {(session.status === "Accepted" || session.status === "Started") && (
              <button className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition shadow-sm">
                {session.type === 'Online' ? <Video className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {session.type === 'Online' ? 'Join Session' : 'Start Session'}
              </button>
            )}

            <Link
              href={`/messages?mentorId=${session.mentor_user_id}`}
              className="px-6 py-2 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg font-medium text-sm text-gray-800 flex items-center gap-2 transition shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </Link>

            {["Pending", "Accepted"].includes(session.status) && onCancel && (
              <button
                onClick={() => onCancel(session.id)}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm transition flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {!expanded && (
        <div className="flex gap-2 flex-wrap mt-4">
          {(session.status === "Accepted" || session.status === "Started") && (
            <button className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg text-xs flex items-center gap-2 transition shadow-sm">
              {session.type === 'Online' ? <Video className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {session.type === 'Online' ? 'Join Session' : 'Start Session'}
            </button>
          )}

          <Link
            href={`/messages?mentorId=${session.mentor_user_id}`}
            className="px-4 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 rounded-lg font-medium text-xs text-gray-800 flex items-center gap-1.5 transition shadow-sm"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Message
          </Link>

          {["Pending", "Accepted"].includes(session.status) && onCancel && (
            <button
              onClick={() => onCancel(session.id)}
              className="px-4 py-1.5 text-red-600 hover:bg-red-50 rounded-lg font-medium text-xs transition flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
