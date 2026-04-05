"use client";

import { useState } from "react";
import {
    Calendar,
    Clock,
    Video,
    MessageCircle,
    ChevronDown,
    ChevronRight,
    MapPin,
    CheckCircle,
    XCircle,
    Play,
    ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { isSessionActive, getNepalNow, parseNepalDateTime, toNepaliDateStr } from "@/utils/dateUtils";

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
    payment_status?: "Paid" | "Not Paid";
}

interface MentorSessionCardProps {
    session: Session;
    user: any;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onCancel?: (id: string) => void;
    onComplete: (id: string) => void;
    onStart?: (id: string) => void;
    onRespond?: (id: string, type: "reschedule" | "cancel", action: "accept" | "reject") => void;
    onReschedule?: (id: string, date: string, time: string) => void;
    onMarkCashPaid?: (id: string) => void;
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

export default function MentorSessionCard({
    session,
    user,
    onAccept,
    onReject,
    onCancel,
    onComplete,
    onStart,
    onRespond,
    onReschedule,
    onMarkCashPaid,
}: MentorSessionCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmType, setConfirmType] = useState<"reject" | "cancel" | null>(null);

    // Reschedule states
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [bookedDates, setBookedDates] = useState<string[]>([]); // stored as 'YYYY-MM-DD|HH:MM AM'

    const openRescheduleModal = async () => {
        setShowRescheduleModal(true);
        // Fetch mentor's sessions to find booked date-time combinations
        try {
            const res = await fetch("http://localhost:5000/api/sessions/mentor", { credentials: "include" });
            const data = await res.json();
            if (Array.isArray(data)) {
                const occupied = data
                    .filter((s: any) =>
                        s.id !== session.id &&
                        ["Pending", "Accepted", "Started"].includes(s.status)
                    )
                    .map((s: any) => `${toNepaliDateStr(s.date)}|${s.time}`);
                setBookedDates([...new Set(occupied)]);
            }
        } catch (err) {
            console.error("Failed to fetch sessions for reschedule:", err);
        }
    };

    const normalizeTimeTo24 = (time: string): string => {
        const t = time.trim().toLowerCase();
        if (t.includes('am') || t.includes('pm')) {
            const match = t.match(/(\d+):(\d+)\s*(am|pm)/);
            if (!match) return t;
            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const modifier = match[3];
            if (modifier === 'pm' && hours < 12) hours += 12;
            if (modifier === 'am' && hours === 12) hours = 0;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        // Already 24-hour, just normalize to HH:MM
        const parts = t.split(':');
        return `${String(parseInt(parts[0])).padStart(2, '0')}:${String(parseInt(parts[1] || '0')).padStart(2, '0')}`;
    };

    const isTimeBooked = (date: string, time: string) => {
        const normalizedUITime = normalizeTimeTo24(time);
        return bookedDates.some(entry => {
            const [d, t] = entry.split('|');
            return d === date && normalizeTimeTo24(t) === normalizedUITime;
        });
    };

    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const monthName = currentMonth.toLocaleString("default", { month: "long" });
    const year = currentMonth.getFullYear();

    const handlePrevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
    const handleNextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));

    const timeSlots = [
        "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
        "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"
    ];

    const isPastSlot = (dateStr: string, timeStr?: string) => {
        const nepalNow = getNepalNow();
        const targetDate = parseNepalDateTime(dateStr, timeStr, !timeStr);
        return targetDate < nepalNow;
    };

    const handleDateClick = (day: number) => {
        const dateStr = `${year}-${(currentMonth.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
        const nepDate = toNepaliDateStr(dateStr + "T00:00:00");
        setRescheduleDate(nepDate);
        setRescheduleTime("");
    };

    const handleRescheduleSubmit = () => {
        if (onReschedule && rescheduleDate && rescheduleTime) {
            onReschedule(session.id, rescheduleDate, rescheduleTime);
            setShowRescheduleModal(false);
        }
    };

    // Helper to get correct image URL
    const getProfileImage = (path: string) => {
        if (!path) return "";
        if (path.startsWith("http") || path.startsWith("https")) {
            return path;
        }
        return `http://localhost:5000${path}`;
    };

    const handleConfirm = () => {
        if (confirmType === "reject") {
            onReject(session.id);
        } else if (confirmType === "cancel" && onCancel) {
            onCancel(session.id);
        }
        setShowConfirm(false);
        setConfirmType(null);
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
            <div className={`flex flex-wrap gap-2 ${isExpanded ? 'pt-2' : 'mt-4'}`}>
                {/* PENDING STATE for Initial Booking */}
                {session.status === "Pending" && (
                    <>
                        <button
                            onClick={() => onAccept(session.id)}
                            className={`px-6 ${isExpanded ? 'py-2' : 'py-1.5'} bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg ${isExpanded ? 'text-sm' : 'text-xs'} flex items-center justify-center gap-2 transition shadow-sm`}
                        >
                            <CheckCircle className={`${isExpanded ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                            Accept
                        </button>

                        <button
                            onClick={() => {
                                setConfirmType("reject");
                                setShowConfirm(true);
                            }}
                            className={`px-6 ${isExpanded ? 'py-2' : 'py-1.5'} bg-white border border-red-200 text-red-600 font-medium rounded-lg ${isExpanded ? 'text-sm' : 'text-xs'} flex items-center justify-center gap-2 hover:bg-red-50 transition shadow-sm`}
                        >
                            <XCircle className={`${isExpanded ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                            Reject
                        </button>
                    </>
                )}

                {(["Accepted", "Started", "Reschedule Requested"].includes(session.status)) && (
                    <>
                        {(session.status === "Accepted" || session.status === "Started") && onStart && isSessionActive(session.date, session.time) && (
                            <button
                                onClick={() => onStart(session.id)}
                                className={`${isExpanded ? 'px-6 py-2' : 'px-4 py-1.5'} bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg ${isExpanded ? 'text-sm' : 'text-xs'} flex items-center justify-center gap-2 transition shadow-sm`}
                            >
                                <Play className={`${isExpanded ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                                Start Session
                            </button>
                        )}

                        {(session.status === "Accepted" || session.status === "Started") && !isSessionActive(session.date, session.time) && (
                            <div className={`${isExpanded ? 'px-4 py-2 text-sm' : 'px-4 py-1.5 text-[11px]'} bg-gray-100 text-gray-500 font-medium rounded-lg flex items-center gap-2 border border-gray-200`}>
                                <Clock className="w-3.5 h-3.5" />
                                Available at {session.time}
                            </div>
                        )}

                        <Link
                            href={`/messages?studentId=${session.student_id}`}
                            className={`${isExpanded ? 'px-6 py-2' : 'px-4 py-1.5'} border border-gray-300 rounded-lg font-medium ${isExpanded ? 'text-sm' : 'text-xs'} text-gray-800 flex items-center justify-center gap-2 hover:bg-gray-50 bg-white transition shadow-sm`}
                        >
                            <MessageCircle className={`${isExpanded ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                            Message
                        </Link>

                        {/* RESCHEDULE button */}
                        {["Accepted", "Pending"].includes(session.status) && (
                            <button 
                                onClick={openRescheduleModal}
                                className={`${isExpanded ? 'px-6 py-2' : 'px-4 py-1.5'} border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg font-medium ${isExpanded ? 'text-sm' : 'text-xs'} flex items-center justify-center gap-2 transition shadow-sm bg-white overflow-hidden`}
                            >
                                <Calendar className={`${isExpanded ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                                Reschedule
                            </button>
                        )}

                        {/* CANCEL button for mentor */}
                        {onCancel && session.status !== "Cancel Requested" && (
                            <button
                                onClick={() => {
                                    setConfirmType("cancel");
                                    setShowConfirm(true);
                                }}
                                className={`${isExpanded ? 'px-4 py-2 text-sm' : 'px-4 py-1.5 text-xs'} text-red-600 hover:bg-red-50 rounded-lg font-medium transition flex items-center gap-2`}
                            >
                                <XCircle className={`${isExpanded ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                                Cancel
                            </button>
                        )}

                        {onComplete && session.status === "Started" && (
                            <button
                                onClick={() => onComplete(session.id)}
                                className={`${isExpanded ? 'px-4 py-2 text-sm' : 'px-4 py-1.5 text-xs'} text-green-600 hover:bg-green-50 rounded-lg font-medium transition flex items-center gap-2`}
                            >
                                <CheckCircle className={`${isExpanded ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                                Complete
                            </button>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition relative">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                        {session.profile_picture ? (
                            <img
                                src={getProfileImage(session.profile_picture)}
                                alt={session.student_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 font-bold text-lg">
                                {session.student_name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-900">{session.student_name}</h3>
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

                {/* View Details Toggle */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                    {expanded ? "Hide Details" : "View Details"}
                    {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
            </div>

            {/* STATUS MESSAGES */}
            {session.status === "Pending" && (
                <div className="mt-3 text-blue-700 text-xs flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    Awaiting your response to this booking request.
                </div>
            )}

            {session.status === "Cancel Requested" && (
                <div className={`mt-3 p-3 rounded-lg text-xs flex items-center justify-between ${isRequester(session.status) ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"}`}>
                    <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        <span>{isRequester(session.status) ? "Cancellation pending student's approval." : `${session.student_name} requested to cancel this session.`}</span>
                    </div>
                    {!isRequester(session.status) && onRespond && (
                        <div className="flex gap-2">
                            <button onClick={() => onRespond(session.id, "cancel", "accept")} className="px-3 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition">Accept</button>
                            <button onClick={() => onRespond(session.id, "cancel", "reject")} className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded font-bold hover:bg-gray-50 transition">Reject</button>
                        </div>
                    )}
                </div>
            )}

            {session.status === "Reschedule Requested" && (
                <div className={`mt-3 p-3 rounded-lg text-xs flex flex-col gap-2 ${isRequester(session.status) ? "bg-orange-50 text-orange-700" : "bg-blue-50 text-blue-700"}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium">
                            <Calendar className="w-4 h-4" />
                            <span>{isRequester(session.status) ? "Reschedule pending approval." : `${session.student_name} requested to reschedule.`}</span>
                        </div>
                        {!isRequester(session.status) && onRespond && (
                            <div className="flex gap-2">
                                <button onClick={() => onRespond(session.id, "reschedule", "accept")} className="px-3 py-1 bg-orange-600 text-white rounded font-bold hover:bg-orange-700 transition shadow-sm">Accept</button>
                                <button onClick={() => onRespond(session.id, "reschedule", "reject")} className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded font-bold hover:bg-gray-50 transition shadow-sm">Reject</button>
                            </div>
                        )}
                    </div>
                    <p className="text-[11px] opacity-90 px-6">Proposed: <span className="font-bold">{formatDate(session.rescheduled_date)}</span> at <span className="font-bold">{session.rescheduled_time}</span></p>
                </div>
            )}

            {/* EXPANDED VIEW */}
            {expanded && (
                <div className="mt-4 border-t pt-4 text-sm text-gray-700 space-y-3">
                    <div>
                        <p className="text-gray-500">Course:</p>
                        <p className="font-medium text-gray-900">{session.course}</p>
                    </div>

                    <div>
                        <p className="text-gray-500">Type:</p>
                        <div className="flex items-center gap-2">
                            {session.type === 'Online' ? <Video className="w-4 h-4 text-gray-400" /> : <MapPin className="w-4 h-4 text-gray-400" />}
                            <span>{session.type} {session.location ? `(${session.location})` : ''}</span>
                        </div>
                    </div>

                    {session.notes && (
                        <div>
                            <p className="text-gray-500">Notes from Student:</p>
                            <p className="italic bg-gray-50 p-2 rounded-lg border border-gray-100 mt-1">"{session.notes}"</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs text-nowrap">Payment Detail:</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${session.payment_status === "Paid"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}>
                                {session.payment_status === "Paid" ? "✓ Paid" : "Not Paid"}
                            </span>
                            {session.type === "Online" && session.payment_status === "Paid" && (
                                <span className="text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">eSewa</span>
                            )}
                            {session.type === "In-Person" && session.payment_status === "Paid" && (
                                <span className="text-[10px] text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">Cash</span>
                            )}
                        </div>
                        {/* Mark Cash Paid button for mentor on in-person unpaid sessions */}
                        {session.type === "In-Person" && session.payment_status !== "Paid" && onMarkCashPaid && (
                            <button
                                onClick={() => onMarkCashPaid(session.id)}
                                className="text-xs font-semibold text-green-700 border border-green-300 px-3 py-1 rounded-lg hover:bg-green-50 transition"
                            >
                                Mark Cash Received
                            </button>
                        )}
                    </div>

                    {renderActions(true)}
                </div>
            )}

            {!expanded && renderActions(false)}

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {confirmType === "reject" ? "Reject Request" : "Cancel Session"}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {confirmType === "reject"
                                    ? "Are you sure you want to reject this booking request? This action cannot be undone."
                                    : "Are you sure you want to request cancellation? This requires student's approval."}
                            </p>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    setConfirmType(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition"
                            >
                                No, Keep it
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm"
                            >
                                {confirmType === "reject" ? "Yes, Reject" : "Yes, Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {showRescheduleModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reschedule Session</h3>
                            
                            <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4 text-gray-500" /> Select Date
                                    </label>
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-200 rounded-full transition"><ChevronLeft className="w-4 h-4 text-gray-700" /></button>
                                            <span className="text-sm font-bold text-gray-900">{monthName} {year}</span>
                                            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-200 rounded-full transition"><ChevronRight className="w-4 h-4 text-gray-700" /></button>
                                        </div>

                                        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 font-bold mb-2">
                                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
                                        </div>

                                        <div className="grid grid-cols-7 gap-1.5">
                                            {Array(firstDayOfMonth).fill(0).map((_, i) => <div key={`empty-${i}`} className="h-9" />)}
                                            {Array.from({ length: daysInMonth }, (_, i) => {
                                                const day = i + 1;
                                                const dateStr = `${year}-${(currentMonth.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                                                const calendarDate = toNepaliDateStr(dateStr + "T00:00:00");
                                                const isSelected = rescheduleDate === calendarDate;
                                                const isPast = isPastSlot(calendarDate);

                                                return (
                                                    <button
                                                        key={day}
                                                        onClick={() => !isPast && handleDateClick(day)}
                                                        disabled={isPast}
                                                        className={`h-9 rounded-lg text-sm font-bold transition-all ${isSelected ? "bg-orange-500 text-white shadow-md scale-105" :
                                                            !isPast ? "bg-white text-gray-700 hover:bg-gray-200 border border-gray-200" :
                                                                "bg-gray-50 text-gray-300 cursor-not-allowed"
                                                            }`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Time Slots */}
                                {rescheduleDate && (
                                    <div className="mt-6 animate-in fade-in duration-300">
                                        <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-gray-500" /> Select Time
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {timeSlots.map(time => {
                                                const isPast = isPastSlot(rescheduleDate, time);
                                                const isTimeTaken = isTimeBooked(rescheduleDate, time);
                                                const isDisabled = isPast || isTimeTaken;
                                                return (
                                                    <button
                                                        key={time}
                                                        onClick={() => !isDisabled && setRescheduleTime(time)}
                                                        disabled={isDisabled}
                                                        title={isTimeTaken ? "Another session is booked at this time" : undefined}
                                                        className={`py-2 rounded-lg text-xs font-bold transition shadow-sm ${rescheduleTime === time ? "bg-orange-500 text-white ring-2 ring-orange-200" :
                                                            isTimeTaken ? "bg-red-50 text-red-300 border border-red-100 cursor-not-allowed" :
                                                            !isPast ? "bg-white border border-gray-200 text-gray-900 hover:border-orange-300 hover:bg-orange-50" :
                                                                "bg-gray-50 text-gray-300 cursor-not-allowed"
                                                            }`}
                                                    >
                                                        {time}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowRescheduleModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRescheduleSubmit}
                                disabled={!rescheduleDate || !rescheduleTime}
                                className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Request Reschedule
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
