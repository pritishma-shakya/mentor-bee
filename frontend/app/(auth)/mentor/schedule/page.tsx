"use client";

import { useState, useEffect, Suspense } from "react";
import {
  CalendarIcon,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "react-hot-toast";
import AuthLayout from "../../layout";
import { useRouter, useSearchParams } from "next/navigation";

interface Schedule {
  date: string; // YYYY-MM-DD (Nepal time)
  times: string[];
}

const formatDate = (date: string | undefined) => {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toISOString().split('T')[0];
  } catch (e) {
    return date;
  }
};

function MentorAvailabilityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rescheduleSessionId = searchParams?.get("rescheduleSessionId");
  const studentName = searchParams?.get("studentName");

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Schedule[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<string | null>(null);
  const [reschedulingSlot, setReschedulingSlot] = useState<string | null>(null);
  const [existingSession, setExistingSession] = useState<any>(null);

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
    "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"
  ];

  // Convert a UTC date string to Nepal time YYYY-MM-DD
  const toNepaliDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const nepali = d.toLocaleString("en-CA", { timeZone: "Asia/Kathmandu" });
    return nepali.split(",")[0];
  };

  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/schedules", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch schedules");
      const data: Schedule[] = await res.json();
      const normalized = data.map(a => ({ ...a, date: toNepaliDate(a.date) }));
      setAvailability(normalized);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error loading schedules");
    }
  };

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/sessions/mentor", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      setSessions(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchSessions();

    if (rescheduleSessionId) {
      const fetchSession = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/sessions/${rescheduleSessionId}`, { credentials: "include" });
          const data = await res.json();
          if (res.ok) {
            setExistingSession(data);
          }
        } catch (err) {
          console.error("Failed to fetch existing session:", err);
        }
      };
      fetchSession();
    }
  }, [rescheduleSessionId]);

  const isPastSlot = (date: string, time?: string) => {
    const now = new Date();
    // Use Nepal time (UTC+5:45)
    const nepalNow = new Date(now.getTime() + (5 * 60 + 45) * 60000);

    const targetDate = new Date(date);
    if (time) {
      // Parse "9:00 AM" or "1:00 PM"
      const [hourMin, meridiem] = time.split(" ");
      let [hour, minute] = hourMin.split(":").map(Number);
      if (meridiem === "PM" && hour !== 12) hour += 12;
      if (meridiem === "AM" && hour === 12) hour = 0;
      targetDate.setHours(hour, minute, 0, 0);
    } else {
      targetDate.setHours(23, 59, 59, 999);
    }

    return targetDate < nepalNow;
  };

  // Month navigation
  const handlePrevMonth = () =>
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  const handleNextMonth = () =>
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));

  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${(currentMonth.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const nepDate = toNepaliDate(dateStr + "T00:00:00");
    setSelectedDate(nepDate);

    const existing = availability.find(a => a.date === nepDate);
    setSelectedTimes(existing ? [...existing.times] : []);
    setIsEditing(false);
    setReschedulingSlot(null);
  };

  const toggleTimeSlot = (time: string) => {
    if (rescheduleSessionId) {
      setReschedulingSlot(time === reschedulingSlot ? null : time);
      return;
    }
    setSelectedTimes(prev =>
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    );
  };

  const saveAvailability = async () => {
    if (!selectedDate) {
      toast.error("Select a date first");
      return;
    }
    if (!selectedTimes.length) {
      toast.error("Select at least one time slot");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, times: selectedTimes }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save availability");

      // Update local availability
      setAvailability(prev => {
        const otherDays = prev.filter(a => a.date !== selectedDate);
        return [...otherDays, { date: selectedDate, times: selectedTimes }];
      });

      const isUpdate = availability.some(a => a.date === selectedDate);
      toast.success(isUpdate ? "Availability updated successfully!" : "Availability saved successfully!");
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error saving availability");
    } finally {
      setLoading(false);
    }
  };

  const confirmReschedule = async () => {
    if (!rescheduleSessionId || !selectedDate || !reschedulingSlot) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/sessions/${rescheduleSessionId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newDate: selectedDate, newTime: reschedulingSlot }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to request reschedule");

      toast.success("Reschedule requested!");
      router.push("/mentor/bookings");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Reschedule failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (date: string) => {
    setDateToDelete(date);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!dateToDelete) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/schedules/${dateToDelete}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete schedule");

      setAvailability(prev => prev.filter(a => a.date !== dateToDelete));
      toast.success("Schedule deleted");
      setShowDeleteConfirm(false);
      setSelectedDate(null);
      setSelectedTimes([]);
      setDateToDelete(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error deleting schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-4">
      {rescheduleSessionId && (
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-orange-800">
              <span className="font-bold">Rescheduling for:</span> {studentName || "Student"}
            </div>
            <button
              onClick={() => router.push("/mentor/bookings")}
              className="text-xs font-semibold text-orange-600 hover:underline"
            >
              Cancel Reschedule
            </button>
          </div>
          {existingSession && (
            <div className="text-xs text-orange-700 bg-white/50 rounded p-2 border border-orange-100/50">
              <span className="font-semibold text-orange-800">Current Session:</span> {formatDate(existingSession.date)} at {existingSession.time}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        {/* Calendar */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4" /> Select Date
          </label>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <button onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-200 rounded">
                <ChevronLeft className="w-4 h-4 text-gray-800" />
              </button>
              <span className="text-sm font-semibold text-gray-900">{monthName} {year}</span>
              <button onClick={handleNextMonth} className="p-1.5 hover:bg-gray-200 rounded">
                <ChevronRight className="w-4 h-4 text-gray-800" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-800 font-medium mb-1.5">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array(firstDayOfMonth).fill(0).map((_, i) => <div key={`empty-${i}`} className="h-8" />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${(currentMonth.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                const calendarDate = toNepaliDate(dateStr + "T00:00:00");

                const isSelected = selectedDate === calendarDate;
                const hasAvailability = availability.some(a => a.date === calendarDate);

                const now = new Date();
                const nepalNowStr = now.toLocaleString("en-CA", { timeZone: "Asia/Kathmandu" }).split(",")[0];
                const isPastDate = calendarDate < nepalNowStr;

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`h-8 rounded-md text-sm font-medium transition ${isSelected ? "bg-orange-500 text-white shadow-sm" :
                        hasAvailability ? "bg-green-100 text-green-700 hover:bg-green-200" :
                          isPastDate ? "bg-gray-100 text-gray-400" :
                            "hover:bg-orange-100 text-gray-900"
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
        {selectedDate && (
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {rescheduleSessionId ? "Select New Time Slot" : "Select Time Slots"}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map(time => {
                const isPast = isPastSlot(selectedDate!, time);
                const booking = sessions.find(s =>
                  toNepaliDate(s.date) === selectedDate &&
                  s.time === time &&
                  (s.status === "Pending" || s.status === "Accepted")
                );

                const hasExistingAvailability = availability.some(a => a.date === selectedDate);
                
                // For rescheduling: mentor can pick ANY slot they HAVE ADDED that is NOT booked.
                // Or if for rescheduling, they can pick a slot they haven't added yet?
                // The user said "if for teacher they can add time slots".
                // I'll allow selecting any slot to add it, but if it's for rescheduling, highlight it.
                
                const isSelectedForReschedule = reschedulingSlot === time;
                const isSelectedForAvailability = selectedTimes.includes(time);

                const isDisabled = isPast || !!booking || (!rescheduleSessionId && hasExistingAvailability && !isEditing);

                return (
                  <button
                    key={time}
                    onClick={() => !isDisabled && toggleTimeSlot(time)}
                    disabled={isDisabled}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition shadow-sm relative ${
                      (rescheduleSessionId ? isSelectedForReschedule : isSelectedForAvailability)
                        ? "bg-orange-500 text-white ring-1 ring-orange-300"
                        : isDisabled
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                          : "bg-gray-50 text-gray-900 hover:bg-orange-100 hover:shadow"
                      }`}
                  >
                    {time}
                    {booking && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                    {booking && <div className="text-[10px] mt-0.5 opacity-70">{booking.status}</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {(() => {
            if (!selectedDate) return null;

            const now = new Date();
            const nepalNowStr = now.toLocaleString("en-CA", { timeZone: "Asia/Kathmandu" }).split(",")[0];
            const isPastDate = selectedDate < nepalNowStr;

            if (isPastDate) return null;

            if (rescheduleSessionId) {
              return (
                <button
                  onClick={confirmReschedule}
                  disabled={loading || !reschedulingSlot}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 ${
                    loading || !reschedulingSlot ? "bg-gray-400 cursor-not-allowed text-white" : "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-100"
                  }`}
                >
                  {loading ? "Requesting..." : "Confirm Reschedule to this Slot"}
                </button>
              );
            }

            if (availability.some(a => a.date === selectedDate) && !isEditing) {
              return (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSchedule(selectedDate!)}
                    disabled={loading}
                    className="flex-1 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs font-semibold transition"
                  >
                    Delete Date
                  </button>
                </>
              );
            }

            return (
              <div className="w-full space-y-2">
                <button
                  onClick={saveAvailability}
                  disabled={loading}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 ${
                    loading ? "bg-gray-400 cursor-not-allowed text-white" : "bg-orange-500 hover:bg-orange-600 text-white"
                  }`}
                >
                  {loading ? "Saving..." : availability.some(a => a.date === selectedDate) ? "Update Availability" : "Save Availability"}
                </button>
                {isEditing && (
                  <button
                    onClick={() => {
                      const existing = availability.find(a => a.date === selectedDate);
                      setSelectedTimes(existing ? [...existing.times] : []);
                      setIsEditing(false);
                    }}
                    className="w-full py-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-700 transition"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Schedule</h3>
              <p className="text-sm text-gray-600">
                Are you sure you want to delete your availability for <strong>{dateToDelete}</strong>? This will remove all slots for this date.
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDateToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm disabled:bg-red-400"
              >
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MentorAvailabilityPage() {
  return (
    <AuthLayout header={{ title: "Manage Availability", subtitle: "Set your available times" }}>
      <Suspense fallback={<div>Loading...</div>}>
        <MentorAvailabilityContent />
      </Suspense>
    </AuthLayout>
  );
}
