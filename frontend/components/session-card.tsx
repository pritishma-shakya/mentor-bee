"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  MessageCircle,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

interface Session {
  mentor?: string;
  avatar?: string;
  subject?: string;
  topic?: string;
  date?: string;
  time?: string;
  link?: string;
  goal?: string;
  notes?: string;
}

export default function SessionCard({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg">
            {session.avatar ?? (session.mentor ? session.mentor[0] : "?")}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {session.mentor ?? "Unknown Mentor"}
              </h3>

              {session.subject && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  {session.subject}
                </span>
              )}
            </div>

            {session.topic && (
              <p className="text-gray-700 mt-0.5 text-sm">{session.topic}</p>
            )}

            <div className="flex items-center gap-3 mt-1 text-gray-600 text-xs">
              {session.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {session.date}
                </span>
              )}

              {session.time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {session.time}
                </span>
              )}
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

      {expanded && (
        <div className="mt-4 border-t pt-4 text-sm text-gray-700 space-y-3">
          {session.mentor && (
            <p className="font-semibold text-gray-900">
              Mentorship session with {session.mentor}!
            </p>
          )}

          {session.date && (
            <div>
              <p className="text-gray-500">Date:</p>
              <p>{session.date}</p>
            </div>
          )}

          {session.time && (
            <div>
              <p className="text-gray-500">Time:</p>
              <p>{session.time}</p>
            </div>
          )}

          {session.link && (
            <div>
              <p className="text-gray-500">Session Link:</p>
              <a
                href={session.link}
                target="_blank"
                className="text-blue-600 font-medium break-all"
              >
                {session.link}
              </a>
            </div>
          )}

          {session.goal && (
            <div>
              <p className="text-gray-500">Session Goal:</p>
              <p>{session.goal}</p>
            </div>
          )}

          {session.notes && (
            <div>
              <p className="text-gray-500">Notes to Mentor:</p>
              <p>{session.notes}</p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap pt-2">
            <button className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-1">
              <Video className="w-4 h-4" />
              Start Session
            </button>

            <button className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-sm text-gray-800 flex items-center gap-1">
              <MessageCircle className="w-4 h-4" />
              Message
            </button>

            <button className="px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-sm">
              Reschedule Session
            </button>

            <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!expanded && (
        <div className="flex gap-2 flex-wrap mt-4">
          <button className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg text-xs flex items-center gap-1">
            <Video className="w-3.5 h-3.5" />
            Start Session
          </button>

          <button className="px-4 py-1.5 border border-gray-300 rounded-lg font-medium text-xs text-gray-800 flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            Message
          </button>

          <button className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-xs">
            Reschedule
          </button>

          <button className="px-4 py-1.5 text-red-600 hover:bg-red-50 rounded-lg font-medium text-xs">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
