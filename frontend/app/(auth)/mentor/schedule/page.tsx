"use client";

import { useState, useEffect } from "react";
import {
  CalendarIcon,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../../layout";

interface Schedule {
  date: string; // YYYY-MM-DD (Nepal time)
  times: string[];
}

export default function MentorAvailabilityPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"set" | "view">("set");

  const timeSlots = [
    "9:00 AM","10:00 AM","11:00 AM","12:00 PM",
    "1:00 PM","2:00 PM","3:00 PM","4:00 PM",
    "5:00 PM","6:00 PM","7:00 PM","8:00 PM"
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

  useEffect(() => {
    fetchSchedules();
  }, []);

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
    const dateStr = `${year}-${(currentMonth.getMonth() + 1).toString().padStart(2,"0")}-${day.toString().padStart(2,"0")}`;
    const nepDate = toNepaliDate(dateStr + "T00:00:00");
    setSelectedDate(nepDate);

    const existing = availability.find(a => a.date === nepDate);
    setSelectedTimes(existing ? [...existing.times] : []);
  };

  const toggleTimeSlot = (time: string) => {
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

      toast.success("Availability saved!");
      setActiveTab("view");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error saving availability");
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (date: string) => {
    if (!confirm(`Delete schedule for ${date}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/schedules/${date}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete schedule");

      setAvailability(prev => prev.filter(a => a.date !== date));
      toast.success("Schedule deleted");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error deleting schedule");
    }
  };

  return (
    <AuthLayout header={{ title: "Manage Availability", subtitle: "Set your available times" }}>
      <div className="px-4 py-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab("set")}
            className={`py-2 px-4 font-semibold text-sm ${activeTab === "set" ? "border-b-2 border-orange-500 text-orange-500" : "text-gray-600"}`}
          >
            Set Schedule
          </button>
          <button
            onClick={() => setActiveTab("view")}
            className={`py-2 px-4 font-semibold text-sm ${activeTab === "view" ? "border-b-2 border-orange-500 text-orange-500" : "text-gray-600"}`}
          >
            View Schedule
          </button>
        </div>

        {/* Set Schedule Tab */}
        {activeTab === "set" && (
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
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d}>{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array(firstDayOfMonth).fill(0).map((_, i) => <div key={`empty-${i}`} className="h-8"/>)}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${(currentMonth.getMonth()+1).toString().padStart(2,"0")}-${day.toString().padStart(2,"0")}`;
                    const calendarDate = toNepaliDate(dateStr + "T00:00:00");

                    const isSelected = selectedDate === calendarDate;
                    const hasAvailability = availability.some(a => a.date === calendarDate);

                    return (
                      <button
                        key={day}
                        onClick={() => handleDateClick(day)}
                        className={`h-8 rounded-md text-sm font-medium transition ${
                          isSelected ? "bg-orange-500 text-white shadow-sm" :
                          hasAvailability ? "bg-green-100 text-green-700 hover:bg-green-200" :
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
                  <Clock className="w-4 h-4" /> Select Time Slots
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => toggleTimeSlot(time)}
                      className={`py-2.5 rounded-lg text-xs font-semibold transition shadow-sm ${
                        selectedTimes.includes(time)
                          ? "bg-orange-500 text-white ring-1 ring-orange-300"
                          : "bg-gray-50 text-gray-900 hover:bg-orange-100 hover:shadow"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save */}
            <button
              onClick={saveAvailability}
              disabled={loading}
              className={`w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 ${
                loading ? "bg-gray-400 cursor-not-allowed text-white" : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            >
              {loading ? "Saving..." : "Save Availability"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* View Schedule Tab */}
        {activeTab === "view" && (
          <div className="bg-white rounded-lg shadow border border-gray-100 p-5">
            {availability.length === 0 ? (
              <p className="text-gray-600 text-sm text-center">No schedules set yet.</p>
            ) : (
              <div className="grid gap-3">
                {availability.map(a => (
                  <div key={a.date} className="bg-gray-50 p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                      <div className="font-semibold text-gray-900">{a.date}</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {a.times.map(time => (
                          <span key={time} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">{time}</span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 md:mt-0">
                      <button
                        onClick={() => {
                          setSelectedDate(a.date);
                          setSelectedTimes([...a.times]);
                          setActiveTab("set");
                        }}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium hover:bg-blue-600 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteSchedule(a.date)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </AuthLayout>
  );
}
