"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

import AuthLayout from "../../layout";
import MentorSessionCard from "@/components/mentor-session-card";

interface User {
    id: string;
    name: string;
    email: string;
    role: "mentor";
    status?: "pending" | "accepted" | "rejected" | "suspended";
}

interface Session {
    id: string;
    student_id: string;
    date: string;
    time: string;
    status: "Completed" | "Cancelled" | "Pending" | "Accepted" | "Rejected" | "Started" | "Cancel Requested" | "Reschedule Requested";
    student_name: string;
    profile_picture?: string;
    course: string;
    notes: string | null;
    type: "Online" | "In-Person";
    location: string | null;
    meeting_link?: string;
    cancel_requested_by?: string;
    reschedule_requested_by?: string;
    rescheduled_date?: string;
    rescheduled_time?: string;
}

export default function ManageBookingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"Pending" | "Upcoming" | "History">("Upcoming");
    const router = useRouter();


    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch User
                const userRes = await fetch("http://localhost:5000/api/auth/profile", {
                    credentials: "include",
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData.user);
                }

                // Fetch Sessions
                const sessionsRes = await fetch("http://localhost:5000/api/sessions/mentor", {
                    credentials: "include",
                });
                const sessionsData = await sessionsRes.json();

                if (Array.isArray(sessionsData)) {
                    // Identify if a session slot has already passed
                    const isPastSlot = (date: string, time: string) => {
                        const now = new Date();
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
                    console.error("Received invalid sessions data:", sessionsData);
                }
            } catch (error) {
                console.error("Failed to load data", error);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
            
            const sessionsRes = await fetch("http://localhost:5000/api/sessions/mentor", { credentials: "include" });
            const data = await sessionsRes.json();
            if (Array.isArray(data)) setSessions(data);
        } catch (err) {
            console.error(err);
            toast.error("Action failed");
        }
    };

    const handleCancelSession = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/sessions/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to request cancellation");
            toast.success("Cancellation requested");
            
            const sessionsRes = await fetch("http://localhost:5000/api/sessions/mentor", { credentials: "include" });
            const data = await sessionsRes.json();
            if (Array.isArray(data)) setSessions(data);
        } catch (err) {
            console.error(err);
            toast.error("Cancel request failed");
        }
    };


    if (loading) return <div className="p-8">Loading...</div>;
    if (!user) return <div className="p-8">Please log in.</div>;

    // Filter Logic
    const refinedFilteredSessions = sessions.filter(session => {
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
            return (
                ['Accepted', 'Started'].includes(session.status) ||
                (session.status === "Cancel Requested" && session.cancel_requested_by === user?.id) ||
                (session.status === "Reschedule Requested" && session.reschedule_requested_by === user?.id)
            ) && sessionDate >= today;
        }
        if (activeTab === "History") {
            return (
                ['Completed', 'Rejected', 'Cancelled'].includes(session.status) ||
                (sessionDate < today && !["Pending", "Accepted", "Started", "Cancel Requested", "Reschedule Requested"].includes(session.status))
            );
        }
        return false;
    });

    const pendingCount = sessions.filter(s => s.status === "Pending").length;

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
            
            const sessionsRes = await fetch("http://localhost:5000/api/sessions/mentor", { credentials: "include" });
            const data = await sessionsRes.json();
            if (Array.isArray(data)) setSessions(data);
        } catch (err) {
            console.error(err);
            toast.error("Reschedule request failed");
        }
    };

    const handleMarkCashPaid = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/sessions/${id}/mark-cash-paid`, {
                method: "PATCH",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to mark as paid");
            toast.success("Session marked as cash paid!");

            const sessionsRes = await fetch("http://localhost:5000/api/sessions/mentor", { credentials: "include" });
            const data = await sessionsRes.json();
            if (Array.isArray(data)) setSessions(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to mark as paid");
        }
    };

    return (
        <AuthLayout
            header={{
                title: "Manage Bookings",
                subtitle: "View and manage your session requests",
                user: user,
            }}
        >
            <div>
                {/* Tabs */}
                <div className="flex gap-8 border-b border-gray-200 mb-6 overflow-x-auto">
                    {["Upcoming", "Pending", "History"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-3 text-sm font-medium relative transition-colors whitespace-nowrap flex items-center ${activeTab === tab
                                ? "text-orange-600 font-semibold"
                                : "text-gray-500 hover:text-gray-800"
                                }`}
                        >
                            {tab}
                            {tab === "Pending" && pendingCount > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full min-w-[18px] text-center">
                                    {pendingCount}
                                </span>
                            )}
                            {activeTab === tab && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {refinedFilteredSessions.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-lg">No {activeTab.toLowerCase()} bookings found.</p>
                        {activeTab === 'Pending' && <p className="text-gray-400 text-sm mt-1">New booking requests will appear here.</p>}
                    </div>
                ) : (
                    <div className="grid gap-5">
                        {refinedFilteredSessions.map((session) => (
                            <MentorSessionCard
                                key={session.id}
                                session={session as any}
                                user={user}
                                onAccept={(id) => {
                                    // Special case for accepting initial booking
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
                                
                                            // Re-fetch sessions only.
                                            const sessionsRes = await fetch("http://localhost:5000/api/sessions/mentor", { credentials: "include" });
                                            const data = await sessionsRes.json();
                                            if (Array.isArray(data)) setSessions(data);
                                
                                        } catch (error) {
                                            console.error(error);
                                            toast.error("Update failed");
                                        }
                                    };
                                    updateStatus(id, "Accepted");
                                }}
                                onReject={(id) => {
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
                                
                                            // Re-fetch sessions only.
                                            const sessionsRes = await fetch("http://localhost:5000/api/sessions/mentor", { credentials: "include" });
                                            const data = await sessionsRes.json();
                                            if (Array.isArray(data)) setSessions(data);
                                
                                        } catch (error) {
                                            console.error(error);
                                            toast.error("Update failed");
                                        }
                                    };
                                    updateStatus(id, "Rejected");
                                }}
                                onCancel={handleCancelSession}
                                onStart={(id) => {
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
                                
                                            // Re-fetch sessions only.
                                            const sessionsRes = await fetch("http://localhost:5000/api/sessions/mentor", { credentials: "include" });
                                            const data = await sessionsRes.json();
                                            if (Array.isArray(data)) setSessions(data);

                                            if (status === "Started" && session.type === "Online") {
                                                router.push(`/session-call/${sessionId}`);
                                            }
                                
                                        } catch (error) {
                                            console.error(error);
                                            toast.error("Update failed");
                                        }
                                    };
                                    updateStatus(id, "Started");
                                }}
                                onComplete={(id) => {
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
                                
                                            // Re-fetch sessions only.
                                            const sessionsRes = await fetch("http://localhost:5000/api/sessions/mentor", { credentials: "include" });
                                            const data = await sessionsRes.json();
                                            if (Array.isArray(data)) setSessions(data);
                                
                                        } catch (error) {
                                            console.error(error);
                                            toast.error("Update failed");
                                        }
                                    };
                                    updateStatus(id, "Completed");
                                }}
                                onRespond={handleRespondToRequest}
                                onReschedule={handleRescheduleSession}
                                onMarkCashPaid={handleMarkCashPaid}
                            />
                        ))}
                    </div>
                )}

            </div>
        </AuthLayout>
    );
}
