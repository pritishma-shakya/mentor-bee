"use client";

import { useEffect, useState } from "react";
import { Trophy, Gift, Crown, Medal, Zap, Coffee, Calendar, Sunrise } from "lucide-react";
import { toast } from "react-hot-toast";
import AuthLayout from "../layout"; // adjust path if needed

interface Badge {
  name: string;
  icon: any;
  points: number;
  color: string;
  bg: string;
  border: string;
}

interface Activity {
  date: string;
  desc: string;
  points: string;
}

interface UserProps {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor";
  profile_picture?: string;
}

export default function RewardsPage() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [user, setUser] = useState<UserProps | null>(null);
  const [loading, setLoading] = useState(true);

  const badgeThresholds: Badge[] = [
    { name: "New Bee", icon: Gift, points: 500, color: "text-green-600", bg: "bg-green-100", border: "border-green-200" },
    { name: "Busy Bee", icon: Trophy, points: 1000, color: "text-orange-600", bg: "bg-orange-100", border: "border-orange-200" },
    { name: "Early Bird", icon: Sunrise, points: 1500, color: "text-purple-600", bg: "bg-purple-100", border: "border-purple-200" },
    { name: "Top Performer", icon: Crown, points: 2000, color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-200" },
    { name: "Consistent Learner", icon: Medal, points: 2500, color: "text-blue-600", bg: "bg-blue-100", border: "border-blue-200" },
    { name: "Speed Demon", icon: Zap, points: 3000, color: "text-red-600", bg: "bg-red-100", border: "border-red-200" },
    { name: "Coffee Lover", icon: Coffee, points: 3500, color: "text-amber-800", bg: "bg-amber-100", border: "border-amber-200" },
    { name: "Weekend Warrior", icon: Calendar, points: 5000, color: "text-indigo-600", bg: "bg-indigo-100", border: "border-indigo-200" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch("http://localhost:5000/api/auth/profile", { credentials: "include" });
        if (!userRes.ok) throw new Error("Unauthorized");
        const userData = await userRes.json();
        setUser(userData?.user || null);

        const rewardsRes = await fetch("http://localhost:5000/api/students/rewards", { credentials: "include" });
        const rewardsData = await rewardsRes.json();
        if (rewardsData.success) {
          setTotalPoints(rewardsData.data.points || 0);
          setRecentActivities(rewardsData.data.recentActivities || []);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const badges = badgeThresholds.map((b, i) => {
    const prevPoints = badgeThresholds[i - 1]?.points || 0;
    const earned = totalPoints >= b.points;
    const progress = earned ? 100 : ((totalPoints - prevPoints) / (b.points - prevPoints)) * 100;
    return { ...b, earned, progress: Math.max(0, Math.min(100, progress)) };
  });

  const currentBadge = badges.filter(b => b.earned).slice(-1)[0];
  const nextBadge = badges.find(b => !b.earned) || badges[badges.length - 1];

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <AuthLayout 
      header={{ title: "Rewards & Achievements", subtitle: "Earn points and unlock badges as you progress!", user }}
    >
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Total points, progress, badges */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition">
              <div className="text-center mb-6">
                <h2 className="text-4xl font-bold text-gray-900">{totalPoints.toLocaleString()}</h2>
                <p className="text-gray-600 text-sm mt-1">Total Points</p>
              </div>

              {/* Progress to next badge */}
              <div className="mb-6">
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span className="font-medium">Progress to {nextBadge.name}</span>
                  <span className="font-semibold">{nextBadge.points - totalPoints} points left</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                       style={{ width: `${Math.max(0, Math.min(100, ((totalPoints - (currentBadge?.points || 0)) / (nextBadge.points - (currentBadge?.points || 0))) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Recent Activities */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">Recent Activities</h3>
                <div className="space-y-3">
                  {recentActivities.map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{a.desc}</p>
                          <p className="text-xs text-gray-500">{a.date}</p>
                        </div>
                      </div>
                      <span className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1 rounded-full">{a.points}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badge Journey */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Badge Journey</h3>
                  <p className="text-gray-600 text-sm">{badges.filter(b => b.earned).length}/{badges.length} unlocked</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {badges.map((b, i) => (
                    <div key={i} className={`flex flex-col items-center p-4 rounded-xl border transition-all duration-300 transform hover:scale-[1.02] ${b.earned ? `${b.bg} ${b.border} shadow-sm` : 'bg-white border-gray-200 opacity-80'}`}>
                      <div className="relative mb-3 w-16 h-16 flex items-center justify-center rounded-full bg-gray-100">
                        <b.icon className={`w-8 h-8 ${b.earned ? b.color : 'text-gray-400'}`} />
                        {b.earned && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className={`font-medium text-center mb-2 ${b.earned ? 'text-gray-900' : 'text-gray-600'}`}>{b.name}</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${b.progress}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{b.earned ? '✓ Earned' : `${b.points} pts`}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Current Badge & How to Earn Points */}
          <div className="space-y-6">
            {currentBadge && (
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition text-center">
                <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100 mb-3">
                  <currentBadge.icon className={`w-10 h-10 ${currentBadge.color}`} />
                </div>
                <p className="text-gray-600 text-sm mb-1">Your Current Badge</p>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{currentBadge.name}</h3>
                <p className="text-sm text-gray-600">You earned this badge with {currentBadge.points.toLocaleString()} points!</p>
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-200">
                  <span className="text-orange-700 font-semibold text-sm">
                    Next badge in {nextBadge.points - totalPoints} points
                  </span>
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-5 shadow-md border border-indigo-100 hover:shadow-lg transition">
              <h3 className="text-md font-semibold text-gray-900 mb-3">How to Earn Points</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">+20</span>
                  </div>
                  <p className="text-sm text-gray-700">First account registration</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">+15</span>
                  </div>
                  <p className="text-sm text-gray-700">Book your first session</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 text-xs font-bold">+10</span>
                  </div>
                  <p className="text-sm text-gray-700">Complete a mentorship session</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-600 text-xs font-bold">+5</span>
                  </div>
                  <p className="text-sm text-gray-700">Weekly login & Community post</p>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs font-bold">+50</span>
                  </div>
                  <p className="text-sm text-gray-700">Milestone: 10 sessions completed</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
    </AuthLayout> 
  );
}
