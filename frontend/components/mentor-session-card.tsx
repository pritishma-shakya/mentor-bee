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
    Play
} from "lucide-react";
import Link from "next/link";

interface Session {
    id: string;
    student_id: string;
    date: string;
    time: string;
    status: "Completed" | "Cancelled" | "Pending" | "Accepted" | "Rejected" | "Started";
    student_name: string;
    profile_picture?: string;
    course: string;
    notes: string | null;
    type: "Online" | "In-Person";
    location: string | null;
    meeting_link?: string;
}

interface MentorSessionCardProps {
    session: Session;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onComplete: (id: string) => void;
    onStart?: (id: string) => void;
}

export default function MentorSessionCard({
    session,
    onAccept,
    onReject,
    onComplete,
    onStart
}: MentorSessionCardProps) {
    const [expanded, setExpanded] = useState(false);

    // Helper to get correct image URL
    const getProfileImage = (path: string) => {
        if (!path) return "";
        if (path.startsWith("http") || path.startsWith("https")) {
            return path;
        }
        return `http://localhost:5000${path}`;
    };

    const renderActions = (isExpanded: boolean) => {
        return (
            <div className={`flex flex-wrap gap-2 ${isExpanded ? 'pt-2' : 'mt-4'}`}>
                {/* PENDING STATE */}
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
                            onClick={() => onReject(session.id)}
                            className={`px-6 ${isExpanded ? 'py-2' : 'py-1.5'} bg-white border border-red-200 text-red-600 font-medium rounded-lg ${isExpanded ? 'text-sm' : 'text-xs'} flex items-center justify-center gap-2 hover:bg-red-50 transition shadow-sm`}
                        >
                            <XCircle className={`${isExpanded ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                            Reject
                        </button>
                    </>
                )}

                {(session.status === "Accepted" || session.status === "Started") && (
                    <>
                        {(session.status === "Accepted" || session.status === "Started") && onStart && (
                            <button
                                onClick={() => onStart(session.id)}
                                className={`px-6 ${isExpanded ? 'py-2' : 'py-1.5'} bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg ${isExpanded ? 'text-sm' : 'text-xs'} flex items-center justify-center gap-2 transition shadow-sm`}
                            >
                                <Play className={`${isExpanded ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                                Start Session
                            </button>
                        )}

                        <Link
                            href={`/messages?studentId=${session.student_id}`}
                            className={`px-6 ${isExpanded ? 'py-2' : 'py-1.5'} border border-gray-300 rounded-lg font-medium ${isExpanded ? 'text-sm' : 'text-xs'} text-gray-800 flex items-center justify-center gap-2 hover:bg-gray-50 bg-white transition shadow-sm`}
                        >
                            <MessageCircle className={`${isExpanded ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                            Message
                        </Link>

                        {/* CANCEL button for mentor */}
                        {(["Accepted"].includes(session.status)) && (
                            <button
                                onClick={() => onReject(session.id)}
                                className={`px-4 ${isExpanded ? 'py-2' : 'py-1.5'} text-red-600 hover:bg-red-50 rounded-lg font-medium ${isExpanded ? 'text-sm' : 'text-xs'} transition flex items-center gap-2`}
                            >
                                <XCircle className={`${isExpanded ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
                                Cancel
                            </button>
                        )}

                        {onComplete && session.status === "Started" && (
                            <button
                                onClick={() => onComplete(session.id)}
                                className={`px-4 ${isExpanded ? 'py-2' : 'py-1.5'} text-green-600 hover:bg-green-50 rounded-lg font-medium ${isExpanded ? 'text-sm' : 'text-xs'} transition flex items-center gap-2`}
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
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
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
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">{session.student_name}</h3>
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium border
                                ${session.status === 'Accepted' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                ${session.status === 'Started' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                                ${session.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                ${session.status === 'Cancelled' || session.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                ${session.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                            `}>
                                {session.status}
                            </div>
                        </div>

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

                    {renderActions(true)}
                </div>
            )}

            {!expanded && renderActions(false)}
        </div>
    );
}
