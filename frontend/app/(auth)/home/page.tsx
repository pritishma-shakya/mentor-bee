"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AuthLayout from "../layout"; // Adjust path if needed
import SessionCard from "@/components/session-card";
import MentorCard from "@/components/mentor-card";
import { Plus } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor";
  profile_picture?: string;
}
interface Mentor {
  id: string;
  full_name: string; // from API
  profile_picture?: string;
  expertise: { id: string; name: string }[];
  hourly_rate: string;
  rating?: number;
  tags?: string[];
}

interface LearningGoal {
  id: string;
  goal_text: string;
  progress: number;
  time: string;
}
interface SummaryData {
  sessions: number;
  hours: number;
  points: number;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [learningGoals, setLearningGoals] = useState<LearningGoal[]>([]);
  const [summary, setSummary] = useState<SummaryData>({ sessions: 0, hours: 0, points: 0 });
  const [realSessions, setRealSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Fetch user
        const profileRes = await fetch("http://localhost:5000/api/auth/profile", { credentials: "include" });
        if (!profileRes.ok) throw new Error("Unauthorized");
        const profileData = await profileRes.json();
        setUser(profileData.user);

        // Fetch mentors
        const mentorsRes = await fetch("http://localhost:5000/api/mentors", { credentials: "include" });
        const mentorsData = await mentorsRes.json();
        if (mentorsData.success && mentorsData.data) {
          setMentors(
            mentorsData.data.map((m: any) => ({
              ...m,
              rating: m.rating || 4.8,
              tags: m.expertise.map((e: any) => e.name),
            }))
          );
        }

        // Fetch real sessions
        const sessionsRes = await fetch("http://localhost:5000/api/sessions/student", { credentials: "include" });
        const sessionsData = await sessionsRes.json();
        if (Array.isArray(sessionsData)) setRealSessions(sessionsData);

        // Fetch learning goals
        const goalsRes = await fetch("http://localhost:5000/api/students/learning-goals", { credentials: "include" });
        const goalsData = await goalsRes.json();
        if (goalsData.success && goalsData.data) setLearningGoals(goalsData.data);

        // Fetch summary/rewards
        const rewardsRes = await fetch("http://localhost:5000/api/students/rewards", { credentials: "include" });
        const rewardsData = await rewardsRes.json();
        if (rewardsData.success && rewardsData.data) {
          setSummary({
            sessions: rewardsData.data.sessions || 0,
            hours: rewardsData.data.hours || 0,
            points: rewardsData.data.points || 0,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const sessionsThisWeek = realSessions.filter((s) => {
    const sessionDate = new Date(s.date);
    const today = new Date();
    const endOfWeek = new Date();
    endOfWeek.setDate(today.getDate() + 7);
    today.setHours(0, 0, 0, 0);
    return s.status === "Accepted" && sessionDate >= today && sessionDate <= endOfWeek;
  });

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );

  return (
    <AuthLayout
      header={{
        title: user ? `Welcome Back, ${user.name}!` : "Hello, Student!",
        subtitle: "Keep learning and growing today!",
        showSearch: false,
        user,
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* Left/Main Column */}
        <div className="lg:col-span-2 space-y-5">
          <section>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Your sessions this week</h3>
            <div className="space-y-4">
              {sessionsThisWeek.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-500 text-sm">No sessions scheduled for this week.</p>
                </div>
              ) : (
                sessionsThisWeek.map((s) => <SessionCard key={s.id} session={s} />)
              )}
            </div>
          </section>

          <RecommendedMentors mentors={mentors} loading={loading} />
        </div>

        {/* Right Column */}
        <div className="space-y-5 w-full">
          <Summary summary={summary} />
          <Rewards points={summary.points} />
          <LearningGoals goals={learningGoals} setGoals={setLearningGoals} />
        </div>
      </div>
    </AuthLayout>
  );
}

function RecommendedMentors({ mentors, loading }: { mentors: Mentor[]; loading: boolean }) {
  if (loading) return <p className="text-gray-500">Loading mentors...</p>;
  if (!mentors || mentors.length === 0) return <p className="text-gray-500">No mentors available.</p>;

  return (
    <section>
      <h3 className="text-base font-semibold text-gray-900 mb-3">Recommended Mentors</h3>
      <div className="grid grid-cols-3 gap-4">
        {mentors.map((m) => (
          <MentorCard
            key={m.id}
            mentor={{
              id: m.id,
              name: m.full_name, // required by MentorCard
              expertise: m.expertise.map((e) => e.name).join(", "), // **pass expertise string**
              profile_picture: m.profile_picture, // optional
              rating: m.rating || 4.8,
              tags: m.tags || [],
              price: parseFloat(m.hourly_rate),
            }}
          />
        ))}
      </div>
    </section>
  );
}

// ---------------- Summary ----------------
function Summary({ summary }: { summary: SummaryData }) {
  const items = [
    { label: "Sessions", value: summary.sessions },
    { label: "Hours", value: summary.hours },
    { label: "Points", value: summary.points },
  ];
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">This Week</h3>
      <div className="grid grid-cols-3 gap-3">
        {items.map(s => (
          <div key={s.label} className="text-center">
            <p className="text-xl font-bold text-orange-600">{s.value}</p>
            <p className="text-[11px] text-gray-800">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Rewards ----------------
function Rewards({ points }: { points: number }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Rewards</h3>
      <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg p-4 text-white text-center shadow-md">
        <p className="text-2xl font-bold">{points}</p>
        <p className="text-[11px] mt-1">Points</p>
        <button className="mt-3 px-4 py-2 bg-white text-orange-600 text-xs rounded-lg font-medium">View All</button>
      </div>
    </div>
  );
}

// ---------------- Learning Goals ----------------
function LearningGoals({ goals, setGoals }: { goals: LearningGoal[]; setGoals: (goals: LearningGoal[]) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [newTime, setNewTime] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAddGoal = async () => {
    if (!newGoal || !newTime) {
      toast.error("Please enter goal and target time");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("http://localhost:5000/api/students/learning-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ goal_text: newGoal, target_time: newTime }),
      });
      const data = await res.json();
      if (data.success) {
        setGoals([data.data, ...goals]);
        setNewGoal("");
        setNewTime("");
        setShowModal(false);
        toast.success("Learning goal added!");
      } else toast.error(data.message || "Failed to add learning goal");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add learning goal");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-100 relative">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Learning Goals</h3>
        <button
          className="p-1.5 bg-orange-100 hover:bg-orange-200 rounded-full text-orange-600 transition-colors"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {goals.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No learning goals found.</p>}
        {goals.map((g, i) => (
          <div key={i} className="p-2 hover:bg-gray-50 rounded transition-colors">
            <div className="flex justify-between mb-1.5">
              <span className="text-[11px] font-medium text-gray-900">{g.goal_text}</span>
              <span className="font-semibold text-orange-600 text-[11px]">{g.progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-500" style={{ width: `${g.progress}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-500">Progress</span>
              <span className="text-[10px] text-gray-500">{g.time}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-6 py-4 border-b border-orange-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add New Learning Goal</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 p-1.5 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Set a clear goal and target time to track your progress</p>
            </div>

            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Goal description"
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                className="w-full p-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none placeholder-gray-700"
              />
              <input
                type="date"
                placeholder="Target time"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none placeholder-gray-700 text-gray-900"
              />
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button className="px-5 py-2 text-gray-700 bg-white rounded-lg border" onClick={() => setShowModal(false)} disabled={adding}>Cancel</button>
              <button className="px-5 py-2 text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg" onClick={handleAddGoal} disabled={adding}>
                {adding ? "Adding..." : "Add Goal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
