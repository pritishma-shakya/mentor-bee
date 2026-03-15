"use client";

import { useEffect, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { toast } from "react-hot-toast";
import AuthLayout from "../layout";
import SessionCard from "@/components/session-card";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor";
  profile_picture?: string;
}

interface Session {
  id: string;
  mentor_id: string;
  student_id: string;
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
}

export default function SessionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<"Upcoming" | "Pending" | "History">("Upcoming");


  useEffect(() => {
    const fetchData = async () => {
      // 1. Handle potential eSewa redirect
      const searchParams = new URLSearchParams(window.location.search);
      const status = searchParams.get("status");
      const data = searchParams.get("data");

      if (status === "success" && data) {
        try {
          // eSewa sends a base64 encoded JSON string on success
          const decodedData = JSON.parse(atob(data as string));
          if (decodedData.status === "COMPLETE") {
            const pendingBookingStr = localStorage.getItem("pending_booking");
            if (pendingBookingStr) {
              const payload = JSON.parse(pendingBookingStr);

              // Now actually book the session in the database
              const bookRes = await fetch("http://localhost:5000/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
              });

              if (bookRes.ok) {
                toast.success("Payment successful! Session booked.");
                localStorage.removeItem("pending_booking");
                window.history.replaceState({}, document.title, window.location.pathname);
              } else {
                toast.error("Payment verified, but booking failed.");
              }
            }
          }
        } catch (err) {
          console.error("Error parsing eSewa data:", err);
        }
      } else if (status === "failure") {
        toast.error("Payment failed or was cancelled.");
        localStorage.removeItem("pending_booking");
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // 2. Fetch profile and sessions
      try {
        const profileRes = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });
        if (!profileRes.ok) throw new Error("Unauthorized");
        const profileData = await profileRes.json();
        setUser(profileData?.user || null);

        const sessionsRes = await fetch("http://localhost:5000/api/sessions/student", {
          credentials: "include",
        });
        const sessionsData = await sessionsRes.json();

        if (Array.isArray(sessionsData)) {
          // Identify if a session slot has already passed
          const isPastSlot = (date: string, time: string) => {
            const now = new Date();
            // Optional: approximate Nepal Time context if preferred
            const nepalNow = new Date(now.getTime() + (5 * 60 + 45) * 60000);

            const targetDate = new Date(date);
            const [hourMin, meridiem] = time.split(" ");
            let [hour, minute] = hourMin.split(":").map(Number);
            if (meridiem === "PM" && hour !== 12) hour += 12;
            if (meridiem === "AM" && hour === 12) hour = 0;
            targetDate.setHours(hour, minute, 0, 0);

            return targetDate < nepalNow;
          };

          const mappedSessions = sessionsData.map((session: Session) => {
            if (
              !["Completed", "Started", "Cancelled", "Rejected"].includes(session.status) &&
              isPastSlot(session.date, session.time)
            ) {
              return { ...session, status: "Cancelled" as const };
            }
            return session;
          });

          setSessions(mappedSessions);
        } else {
          console.error("Expected array from /api/sessions/student, got:", sessionsData);
          setSessions([]);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        toast.error("Failed to fetch user or sessions");
        setUser(null);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSessions = sessions.filter((session) => {
    const sessionDate = new Date(session.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (activeTab === "Pending") {
      return (
        session.status === "Pending" ||
        (session.status === "Cancel Requested" && session.cancel_requested_by !== user?.id) ||
        (session.status === "Reschedule Requested" && session.reschedule_requested_by !== user?.id)
      );
    }
    if (activeTab === "Upcoming") {
      // Include sessions where user is waiting for approval
      return (
        ["Accepted", "Started"].includes(session.status) ||
        (session.status === "Cancel Requested" && session.cancel_requested_by === user?.id) ||
        (session.status === "Reschedule Requested" && session.reschedule_requested_by === user?.id)
      ) && sessionDate >= today;
    }
    if (activeTab === "History") {
      return (
        ["Completed", "Cancelled", "Rejected"].includes(session.status) ||
        (sessionDate < today && !["Pending", "Accepted", "Started", "Cancel Requested", "Reschedule Requested"].includes(session.status))
      );
    }
    return true;
  });

  const pendingCount = sessions.filter(s => s.status === "Pending").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading sessions...</p>
        </div>
      </div>
    );
  }
  const updateStatus = async (sessionId: string, status: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/sessions/${sessionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`Session ${status.toLowerCase()}`);

      // Re-fetch sessions
      const sessionsRes = await fetch("http://localhost:5000/api/sessions/student", { credentials: "include" });
      const data = await sessionsRes.json();
      if (Array.isArray(data)) setSessions(data);

    } catch (error) {
      console.error(error);
      toast.error("Update failed");
    }
  };

  const handleCancelSession = async (id: string) => {
    // This will now call the DELETE /:sessionId which triggers requestCancellation
    try {
      const res = await fetch(`http://localhost:5000/api/sessions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to request cancellation");
      toast.success("Cancellation requested");

      const sessionsRes = await fetch("http://localhost:5000/api/sessions/student", { credentials: "include" });
      const data = await sessionsRes.json();
      if (Array.isArray(data)) setSessions(data);
    } catch (err) {
      console.error(err);
      toast.error("Cancel request failed");
    }
  };

  const handleRespondToRequest = async (id: string, type: "reschedule" | "cancel", action: "accept" | "reject") => {
    try {
      const res = await fetch(`http://localhost:5000/api/sessions/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type, action }),
      });
      if (!res.ok) throw new Error("Failed to respond to request");
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} ${action}ed`);

      const sessionsRes = await fetch("http://localhost:5000/api/sessions/student", { credentials: "include" });
      const data = await sessionsRes.json();
      if (Array.isArray(data)) setSessions(data);
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    }
  };

  const handleRescheduleSession = async (id: string, date: string, time: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/sessions/${id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newDate: date, newTime: time }),
      });
      if (!res.ok) throw new Error("Failed to request reschedule");
      toast.success("Reschedule requested");

      const sessionsRes = await fetch("http://localhost:5000/api/sessions/student", { credentials: "include" });
      const data = await sessionsRes.json();
      if (Array.isArray(data)) setSessions(data);
    } catch (err) {
      console.error(err);
      toast.error("Reschedule request failed");
    }
  };

  return (
    <AuthLayout header={{ title: "Your Mentorship Sessions", subtitle: "Keep learning and growing today!", user }}>
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-5">
        {["Upcoming", "Pending", "History"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-2 text-sm font-medium relative transition-colors flex items-center ${activeTab === tab
              ? "text-orange-600"
              : "text-gray-400 hover:text-gray-600"
              }`}
          >
            {tab}
            {tab === "Pending" && pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full min-w-[18px] text-center">
                {pendingCount}
              </span>
            )}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Sessions */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No {activeTab.toLowerCase()} sessions found.</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session as any}
              user={user}
              onCancel={handleCancelSession}
              onRespond={handleRespondToRequest}
              onReschedule={handleRescheduleSession}
            />
          ))
        )}
      </div>

    </AuthLayout>
  );
}
