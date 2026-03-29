"use client";

import { useState, useEffect } from "react";
import {
  CalendarIcon,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { getNepalNow, toNepaliDateStr, parseNepalDateTime } from "@/utils/dateUtils";

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

export default function MentorScheduleManager() {
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

  const toNepaliDate = (dateStr: string) => {
    return toNepaliDateStr(dateStr);
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
    const nepalNow = getNepalNow();
    const targetDate = parseNepalDateTime(date, time, !time);
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
      // After success, we might want to stay on the same page but change tab?
      // Or redirect tobookings tab.
      window.location.href = "/mentor/bookings"; 
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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Calendar */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-orange-600" /> Select Date
            </label>
            <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-200 rounded-xl transition">
                  <ChevronLeft className="w-5 h-5 text-gray-800" />
                </button>
                <span className="text-sm font-black text-gray-900 tracking-tight">{monthName} {year}</span>
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-200 rounded-xl transition">
                  <ChevronRight className="w-5 h-5 text-gray-800" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400 font-black uppercase tracking-widest mb-3">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array(firstDayOfMonth).fill(0).map((_, i) => <div key={`empty-${i}`} className="h-10" />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${(currentMonth.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                  const calendarDate = toNepaliDate(dateStr + "T00:00:00");

                  const isSelected = selectedDate === calendarDate;
                  const hasAvailability = availability.some(a => a.date === calendarDate);

                  const nepalNowStr = toNepaliDateStr(new Date());
                  const isPastDate = calendarDate < nepalNowStr;

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      disabled={isPastDate}
                      className={`h-10 rounded-xl text-sm font-bold transition-all relative ${
                        isSelected 
                          ? "bg-orange-600 text-white shadow-lg shadow-orange-100 scale-105 z-10" 
                          : hasAvailability 
                            ? "bg-green-50 text-green-700 border border-green-100 hover:bg-green-100" 
                            : isPastDate 
                              ? "text-gray-300 cursor-not-allowed" 
                              : "hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-transparent hover:border-orange-100"
                      }`}
                    >
                      {day}
                      {hasAvailability && !isSelected && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time Slots */}
          <div className="flex flex-col">
            <label className="block text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" /> {selectedDate ? `Slots for ${selectedDate}` : "Select a time"}
            </label>
            
            {!selectedDate ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 p-8 text-center">
                <CalendarIcon className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm font-medium">Please select a date from the calendar to manage your slots.</p>
              </div>
            ) : (
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-3 gap-2.5">
                  {timeSlots.map(time => {
                    const isPast = isPastSlot(selectedDate!, time);
                    const booking = sessions.find(s =>
                      toNepaliDate(s.date) === selectedDate &&
                      s.time === time &&
                      (s.status === "Pending" || s.status === "Accepted" || s.status === "Started" || s.status === "Completed")
                    );

                    const hasExistingAvailability = availability.some(a => a.date === selectedDate);
                    const isSelectedForReschedule = reschedulingSlot === time;
                    const isSelectedForAvailability = selectedTimes.includes(time);
                    const isDisabled = isPast || !!booking || (!rescheduleSessionId && hasExistingAvailability && !isEditing);

                    return (
                      <button
                        key={time}
                        onClick={() => !isDisabled && toggleTimeSlot(time)}
                        disabled={isDisabled}
                        className={`py-3 rounded-xl text-xs font-bold transition-all border relative ${
                          (rescheduleSessionId ? isSelectedForReschedule : isSelectedForAvailability)
                            ? "bg-orange-600 text-white border-orange-600 shadow-md scale-[1.02]"
                            : isDisabled
                              ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                              : "bg-white text-gray-700 border-gray-200 hover:border-orange-200 hover:bg-orange-50/50"
                        }`}
                      >
                        {time}
                        {booking && (
                          <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  {(() => {
                    const nepalNowStr = toNepaliDateStr(new Date());
                    const isPastDate = selectedDate < nepalNowStr;

                    if (isPastDate) return (
                      <div className="text-center p-3 bg-gray-50 rounded-xl text-gray-400 text-xs font-bold">
                        Cannot modify past dates
                      </div>
                    );

                    if (rescheduleSessionId) {
                      return (
                        <button
                          onClick={confirmReschedule}
                          disabled={loading || !reschedulingSlot}
                          className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            loading || !reschedulingSlot 
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                              : "bg-orange-600 text-white shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95"
                          }`}
                        >
                          {loading ? "Processing..." : "Confirm Reschedule"}
                        </button>
                      );
                    }

                    if (availability.some(a => a.date === selectedDate) && !isEditing) {
                      return (
                        <div className="flex gap-3">
                          <button
                            onClick={() => setIsEditing(true)}
                            className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                          >
                            Edit Slots
                          </button>
                          <button
                            onClick={() => deleteSchedule(selectedDate!)}
                            disabled={loading}
                            className="p-3 border-2 border-red-50 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete this date"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        <button
                          onClick={saveAvailability}
                          disabled={loading || selectedTimes.length === 0}
                          className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            loading || selectedTimes.length === 0
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                              : "bg-orange-600 text-white shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95"
                          }`}
                        >
                          {loading ? "Saving..." : "Save Availability"}
                        </button>
                        {isEditing && (
                          <button
                            onClick={() => {
                              const existing = availability.find(a => a.date === selectedDate);
                              setSelectedTimes(existing ? [...existing.times] : []);
                              setIsEditing(false);
                            }}
                            className="w-full py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition"
                          >
                            Cancel Edit
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Delete Schedule?</h3>
              <p className="text-sm text-gray-500 font-medium">
                Remove all availability for <span className="text-gray-900 font-bold">{dateToDelete}</span>?
              </p>
            </div>
            <div className="bg-gray-50 p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDateToDelete(null);
                }}
                className="flex-1 py-3 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-2xl transition"
              >
                No, Keep
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                className="flex-1 py-3 text-sm font-black text-white bg-red-600 hover:bg-red-700 rounded-2xl transition shadow-lg shadow-red-100"
              >
                {loading ? "..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
