"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, MapPin } from "lucide-react";
import AuthLayout from "../../../layout";

const SessionRouteMap = dynamic(() => import("@/components/session-route-map"), { ssr: false });

interface User {
  id: string;
  name: string;
  email: string;
  role: "mentor";
}

interface Session {
  id: string;
  student_id: string;
  student_name?: string;
  type: "Online" | "In-Person";
  location: string | null;
  course?: string;
  date?: string;
  time?: string;
}

export default function MentorSessionRoutePage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, sessionRes] = await Promise.all([
          fetch("http://localhost:5000/api/auth/profile", { credentials: "include" }),
          fetch(`http://localhost:5000/api/sessions/${params.sessionId}`, { credentials: "include" }),
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUser(profileData.user);
        }

        if (!sessionRes.ok) {
          throw new Error("Session not found");
        }

        const sessionData = await sessionRes.json();

        if (sessionData.type !== "In-Person" || !sessionData.location) {
          throw new Error("This session does not have an in-person location.");
        }

        setSession(sessionData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load route map");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.sessionId]);

  return (
    <AuthLayout
      header={{
        title: "Session Route",
        subtitle: "View the route to the student's in-person location",
        user,
      }}
    >
      <div className="mx-auto max-w-5xl px-4 py-4">
        <button
          type="button"
          onClick={() => router.push("/mentor/bookings")}
          className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </button>

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-xl bg-white text-sm text-gray-500 shadow-sm">
            Loading route map...
          </div>
        ) : error || !session ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl bg-white p-8 text-center shadow-sm">
            <MapPin className="mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm font-semibold text-gray-900">{error || "Route map unavailable"}</p>
          </div>
        ) : (
          <SessionRouteMap
            fullPage
            destinationAddress={session.location || ""}
            studentName={session.student_name || "Student"}
          />
        )}
      </div>
    </AuthLayout>
  );
}
