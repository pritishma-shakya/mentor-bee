"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import AuthLayout from "../../layout";
import {
  CalendarIcon,
  Clock,
  ChevronRight,
  ChevronLeft,
  Users,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

const SessionMap = dynamic(() => import("../../../../components/session-map"), { ssr: false });

interface Mentor {
  id: string;
  full_name: string;
  profile_picture: string | null;
  hourly_rate: number;
  expertise: { id: string; name: string }[];
}

interface Schedule {
  date: string; // YYYY-MM-DD
  times: string[];
}

export default function BookSessionPage() {
  const params = useParams();
  const router = useRouter();
  const mentorId = params?.mentorId;

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [loadingMentor, setLoadingMentor] = useState(true);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [course, setCourse] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Session type
  const [sessionType, setSessionType] = useState<"Online" | "In-Person">("Online");
  const [locationResult, setLocationResult] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
    "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"
  ];

  // Convert date to Nepal time YYYY-MM-DD
  const toNepaliDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const nepali = d.toLocaleString("en-CA", { timeZone: "Asia/Kathmandu" });
    return nepali.split(",")[0];
  };

  // Fetch mentor info
  useEffect(() => {
    if (!mentorId) return setLoadingMentor(false);

    const fetchMentor = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/mentors/${mentorId}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Mentor not found");
        setMentor(data.data);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Failed to load mentor info");
      } finally {
        setLoadingMentor(false);
      }
    };
    fetchMentor();
  }, [mentorId]);

  // Fetch mentor schedule
  useEffect(() => {
    if (!mentorId) return;

    const fetchSchedule = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/mentors/${mentorId}/schedule`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to fetch schedule");

        const normalized = data.data.map((s: Schedule) => ({ ...s, date: toNepaliDate(s.date) }));
        setSchedule(normalized);
      } catch (err: any) {
        console.error("Schedule fetch failed:", err);
        toast.error(err.message || "Failed to load schedule");
      }
    };
    fetchSchedule();
  }, [mentorId]);

  // Calendar helpers
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  const handlePrevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  const handleNextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${(currentMonth.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    const nepDate = toNepaliDate(dateStr + "T00:00:00");
    setSelectedDate(nepDate);
    setSelectedTime(null);
  };

  const handleNext = () => {
    if (!selectedDate) return toast.error("Please select a date");
    if (!selectedTime) return toast.error("Please select a time slots");
    if (!course) return toast.error("Please select a course");
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    if (!mentor || !selectedDate || !selectedTime) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mentor_id: mentor.id,
          date: selectedDate,
          time: selectedTime,
          course,
          notes,
          type: sessionType,
          location: locationResult?.address || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.message || "Booking failed");
      }

      toast.success("Session booked successfully!");
      router.push("/sessions");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Booking failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingMentor) return <p>Loading mentor...</p>;
  if (!mentor) return <p className="text-red-600">Mentor not found</p>;

  return (
    <AuthLayout header={{ title: `Book with ${mentor.full_name}`, subtitle: "Choose date & time" }}>
      <div className="px-4 py-4">

        {/* Mentor Mini Summary */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-5">
          <div className="flex items-center gap-3">
            {mentor.profile_picture ? (
              <img
                src={mentor.profile_picture}
                alt={mentor.full_name}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-gray-900">{mentor.full_name}</h3>
              <p className="text-xs text-gray-800">{mentor.expertise.map(e => e.name).join(", ")}</p>
              <p className="text-xs font-medium text-orange-600">Rs.{mentor.hourly_rate}/hr</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mb-6 px-1">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium ${step === 1 ? "bg-orange-600" : "bg-green-600"}`}>
              {step === 1 ? "1" : <CheckCircle2 className="w-4 h-4" />}
            </div>
            <span className="text-sm font-semibold text-gray-900">Details</span>
          </div>

          <div className="flex-1 h-0.5 bg-gray-200 max-w-[80px]" />

          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium ${step === 2 ? "bg-orange-600" : "bg-gray-300"}`}>
              2
            </div>
            <span className="text-sm font-semibold text-gray-900">Confirmation</span>
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-5">
            {/* Session Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Session Type</label>
              <div className="flex gap-3">
                {["Online", "In-Person"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSessionType(type as any)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${sessionType === type ? "bg-orange-500 text-white shadow-sm" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* In-person Location */}
            {sessionType === "In-Person" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Meeting Location</label>
                {locationResult && (
                  <div className="mb-2 flex justify-between items-center text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-md px-3 py-2">
                    <span className="line-clamp-1">{locationResult.address}</span>
                    {!isLocationConfirmed && (
                      <button
                        onClick={() => setIsLocationConfirmed(true)}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition"
                      >
                        Confirm
                      </button>
                    )}
                  </div>
                )}
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <SessionMap
                    locationResult={locationResult}
                    setLocationResult={setLocationResult}
                    isLocked={isLocationConfirmed}
                  />
                </div>
              </div>
            )}

            {/* Calendar */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-gray-500" /> Select Date
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
                    const calendarDate = toNepaliDate(dateStr + "T00:00:00");
                    const isAvailable = schedule.some(s => s.date === calendarDate);
                    const isSelected = selectedDate === calendarDate;

                    return (
                      <button
                        key={day}
                        onClick={() => isAvailable && handleDateClick(day)}
                        className={`h-9 rounded-lg text-sm font-bold transition-all ${isSelected ? "bg-orange-500 text-white shadow-md scale-105" :
                          isAvailable ? "bg-green-100 text-green-700 hover:bg-green-200" :
                            "bg-gray-50 text-gray-400 cursor-not-allowed"
                          }`}
                        disabled={!isAvailable}
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
              <div className="animate-in fade-in duration-300">
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gray-500" /> Select Time
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map(time => {
                    const availableTimes = schedule.find(s => s.date === selectedDate)?.times || [];
                    const isDisabled = !availableTimes.includes(time);
                    return (
                      <button
                        key={time}
                        onClick={() => !isDisabled && setSelectedTime(time)}
                        disabled={isDisabled}
                        className={`py-2.5 rounded-lg text-[11px] font-bold transition shadow-sm ${selectedTime === time ? "bg-orange-500 text-white ring-2 ring-orange-200" :
                          !isDisabled ? "bg-white border border-gray-200 text-gray-900 hover:border-orange-300 hover:bg-orange-50" :
                            "bg-gray-50 text-gray-400 cursor-not-allowed"
                          }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Course & Notes */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Course / Topic</label>
                <select
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:ring-1 focus:ring-orange-400 outline-none bg-white transition"
                >
                  <option value="" disabled>Select course...</option>
                  {mentor.expertise.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-gray-500" /> Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any goals or questions for the session?"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium focus:ring-1 focus:ring-orange-400 outline-none placeholder-gray-400 resize-none transition"
                />
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition flex items-center justify-center gap-2 shadow-lg shadow-orange-100"
            >
              Next: Review Details
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Booking Summary</h2>
            <p className="text-sm text-gray-500 mb-6">Please review your session details</p>

            <div className="bg-gray-50 rounded-xl p-5 mb-8 text-left space-y-4 border border-gray-100">
              <div className="flex justify-between items-start border-b border-gray-200 pb-3">
                <span className="text-gray-500 text-sm">Mentor</span>
                <span className="font-bold text-gray-900 text-sm">{mentor.full_name}</span>
              </div>
              <div className="flex justify-between items-start border-b border-gray-200 pb-3">
                <span className="text-gray-500 text-sm">Date & Time</span>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">{selectedDate}</p>
                  <p className="text-gray-600 text-xs font-medium">{selectedTime}</p>
                </div>
              </div>
              <div className="flex justify-between items-start border-b border-gray-200 pb-3">
                <span className="text-gray-500 text-sm">Session Type</span>
                <span className="font-bold text-gray-900 text-sm">{sessionType}</span>
              </div>
              {sessionType === "In-Person" && locationResult && (
                <div className="flex justify-between items-start border-b border-gray-200 pb-3">
                  <span className="text-gray-500 text-sm">Location</span>
                  <span className="font-bold text-gray-900 text-sm text-right max-w-[180px]">{locationResult.address}</span>
                </div>
              )}
              <div className="flex justify-between items-start border-b border-gray-200 pb-3">
                <span className="text-gray-500 text-sm">Course</span>
                <span className="font-bold text-gray-900 text-sm">{course}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-900 font-bold text-sm">Total Amount</span>
                <span className="text-xl font-black text-orange-600">Rs. {mentor.hourly_rate}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="flex-1 py-3.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-bold hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className={`flex-1 py-3.5 rounded-lg text-white text-sm font-bold transition shadow-lg ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700 shadow-orange-100"
                  }`}
              >
                {isSubmitting ? "Processing..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
