"use client";

import { useState } from "react";
import { CalendarIcon, Clock, Users, CheckCircle2, ChevronRight, ChevronLeft, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../layout"; // adjust path

// Mock mentor
const mockMentor = {
  full_name: "John Smith",
  expertise: "Mathematics",
  hourly_rate: 1500,
  profile_picture: null,
};

export default function BookSessionPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [sessionType, setSessionType] = useState<"Online" | "In-Person">("Online");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [course, setCourse] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Calendar config (November 2025 demo)
  const currentMonth = new Date(2025, 10); // Nov
  const daysInMonth = new Date(2025, 11, 0).getDate(); // 30
  const firstDay = new Date(2025, 10, 1).getDay(); // 0 = Sun

  const handleDateClick = (day: number) => {
    const dateStr = `2025-11-${day.toString().padStart(2, "0")}`;
    setSelectedDate(dateStr);
  };

  const handleNext = () => {
    if (!selectedDate || !selectedTime || !course) {
      toast.error("Please select date, time, and course");
      return;
    }
    setStep(2);
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success("Session booked! (mock)");
      setLoading(false);
    }, 1200);
  };

  const estimatedCost = (mockMentor.hourly_rate / 60) * 60;

  return (
    <AuthLayout
      header={{
        title: `Book with ${mockMentor.full_name}`,
        subtitle: "Choose date & time",
      }}
    >
      <div className="px-4 py-4">
        {/* Mentor Mini Summary */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-5">
          <div className="flex items-center gap-3">
            {mockMentor.profile_picture ? (
              <img
                src={mockMentor.profile_picture}
                alt={mockMentor.full_name}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-gray-900">{mockMentor.full_name}</h3>
              <p className="text-xs text-gray-800">{mockMentor.expertise}</p>
              <p className="text-xs font-medium text-orange-600">Rs.{mockMentor.hourly_rate}/hr</p>
            </div>
          </div>
        </div>

        {/* Progress Steps - very close */}
        <div className="flex items-center gap-4 mb-4">
          {/* Step 1 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                step === 1 ? "bg-orange-500" : "bg-green-500"
              }`}
            >
              {step === 1 ? "1" : <CheckCircle2 className="w-4 h-4" />}
            </div>
            <span className="text-sm font-semibold text-gray-900">Date & Time</span>
          </div>

          {/* Connecting line */}
          <div className="flex-1 h-0.5 bg-gray-300 max-w-[80px]" />

          {/* Step 2 */}
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                step === 2 ? "bg-orange-500" : "bg-gray-300"
              }`}
            >
              2
            </div>
            <span className="text-sm font-semibold text-gray-900">Confirmation</span>
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
            {/* Session Type */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Session Type</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSessionType("Online")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                    sessionType === "Online" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  Online
                </button>
                <button
                  onClick={() => setSessionType("In-Person")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                    sessionType === "In-Person" ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  In-Person
                </button>
              </div>
            </div>

            {/* Calendar */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" />
                Select Date
              </label>

              <div className="bg-gray-50 rounded-lg p-3">
                {/* Month Header */}
                <div className="flex justify-between items-center mb-2">
                  <button className="p-1.5 hover:bg-gray-200 rounded">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-gray-900">January 2026</span>
                  <button className="p-1.5 hover:bg-gray-200 rounded">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-800 font-medium mb-1.5">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-7 gap-1">
                  {Array(firstDay).fill(0).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                  ))}
                  {Array.from({ length: 30 }, (_, i) => {
                    const day = i + 1;
                    const isSelected = selectedDate === `2025-11-${day.toString().padStart(2, "0")}`;
                    return (
                      <button
                        key={day}
                        onClick={() => handleDateClick(day)}
                        className={`h-8 rounded-md text-sm font-medium transition ${
                          isSelected ? "bg-orange-500 text-white shadow-sm" : "hover:bg-orange-100 text-gray-900"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Time Slots - enhanced */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Select Time
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
                  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
                  "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM",
                ].map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition shadow-sm ${
                      selectedTime === time
                        ? "bg-orange-500 text-white ring-1 ring-orange-300"
                        : "bg-gray-50 text-gray-900 hover:bg-orange-100 hover:shadow"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Course */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Choose Course / Topic
              </label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-1 focus:ring-orange-400 outline-none bg-white text-gray-900"
              >
                <option value="" disabled>
                  Select course...
                </option>
                <option value="Mathematics">Mathematics</option>
                <option value="Algebra">Algebra</option>
                <option value="Calculus">Calculus</option>
                <option value="Statistics">Statistics</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" />
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any specific goals or questions for the session?"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-1 focus:ring-orange-400 resize-none placeholder-gray-500"
              />
            </div>

            {/* Next */}
            <button
              onClick={handleNext}
              className="w-full bg-orange-500 text-white py-3 rounded-lg text-sm font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-1.5"
            >
              Next: Review
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-lg shadow border border-gray-100 p-5 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Booking Summary</h2>
            <p className="text-xs text-gray-700 mb-3">Review details</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-5 text-left text-sm">
              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-700">Mentor</span>
                  <span className="font-semibold text-gray-900">{mockMentor.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Date</span>
                  <span className="font-semibold text-gray-900">{selectedDate || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Time</span>
                  <span className="font-semibold text-gray-900">{selectedTime || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Course</span>
                  <span className="font-semibold text-gray-900">{course || "—"}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-700 font-semibold">Cost</span>
                  <span className="text-base font-bold text-orange-700">
                    ${estimatedCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-700 mb-4">
              Confirmation email + calendar invite sent. Reminder 1 hr before.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-800 text-xs font-medium hover:bg-gray-50"
              >
                Back
              </button>

              <button
                onClick={handleConfirm}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-lg text-white text-xs font-medium transition ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {loading ? "Processing..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}