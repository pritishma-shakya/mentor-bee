"use client";

import { useEffect, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { toast } from "react-hot-toast";
import AuthLayout from "../layout"; // adjust path if needed
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
  status: "Completed" | "Cancelled" | "Pending" | "Accepted" | "Rejected" | "Started";
  type: "Online" | "In-Person";
  location: string | null;
  mentor_user_id?: string;
}

export default function SessionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<"All Sessions" | "Upcoming" | "Pending" | "History">("All Sessions");


  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile
        const profileRes = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });
        if (!profileRes.ok) throw new Error("Unauthorized");
        const profileData = await profileRes.json();
        setUser(profileData?.user || null);

        // Fetch sessions from the enriched endpoint
        const sessionsRes = await fetch("http://localhost:5000/api/sessions/student", {
          credentials: "include",
        });
        const sessionsData = await sessionsRes.json();

        // sessionController.getStudentSessions returns an array directly
        if (Array.isArray(sessionsData)) {
          setSessions(sessionsData);
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

    if (activeTab === "All Sessions") return true;

    if (activeTab === "Upcoming") {
      // Include Accepted sessions for today or future
      return (
        ["Accepted", "Started"].includes(session.status) &&
        sessionDate >= today
      );
    }
    if (activeTab === "Pending") {
      return session.status === "Pending";
    }
    if (activeTab === "History") {
      return (
        ["Completed", "Cancelled", "Rejected"].includes(session.status) ||
        (sessionDate < today && !["Pending", "Accepted", "Started"].includes(session.status))
      );
    }
    return true;
  });

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
    await updateStatus(id, "Cancelled");
  };

  const handleAcceptReschedule = async (id: string) => {
    await updateStatus(id, "Accepted");
  };


  return (
    <AuthLayout header={{ title: "Your Mentorship Sessions", subtitle: "Keep learning and growing today!", user }}>
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-5">
        {["All Sessions", "Upcoming", "Pending", "History"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-2 text-sm font-medium relative transition-colors ${activeTab === tab
              ? "text-orange-600"
              : "text-gray-400 hover:text-gray-600"
              }`}
          >
            {tab}
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
            <p className="text-gray-400 font-medium">No {activeTab === "All Sessions" ? "" : activeTab.toLowerCase()} sessions found.</p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session as any}
              onCancel={handleCancelSession}
              onAccept={handleAcceptReschedule}
              onReject={(id) => updateStatus(id, "Rejected")}
            />
          ))
        )}
      </div>

    </AuthLayout>
  );
}
