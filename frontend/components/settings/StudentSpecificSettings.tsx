"use client";

import { useState } from "react";
import { Target, Star, Gift, Shield, CheckCircle2, ChevronRight, Save, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface StudentSpecificSettingsProps {
  user: any;
  onUpdate: (updated: any) => void;
}

export default function StudentSpecificSettings({ user, onUpdate }: StudentSpecificSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [skillLevel, setSkillLevel] = useState(user?.skill_level || "beginner");
  const [newInterest, setNewInterest] = useState("");

  const handleAddInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (tag: string) => {
    setInterests(interests.filter(i => i !== tag));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/update-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests, skill_level: skillLevel }),
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Learning preferences updated");
        onUpdate(data.user);
      } else {
        toast.error(data.message || "Failed to update settings");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Learning & Rewards</h2>
          <p className="text-sm text-gray-500">Personalize your learning journey and track your achievements.</p>
        </div>
        <div className="px-4 py-2 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-2">
          <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
          <span className="text-lg font-bold text-orange-700">{user?.points || 0} Points</span>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Learning Preferences */}
        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 space-y-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4" /> Learning Preferences
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interests & Topics</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {interests.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-orange-200 text-orange-700 rounded-full text-xs font-medium group">
                    {tag}
                    <button onClick={() => removeInterest(tag)} className="hover:text-red-500 transition-colors">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddInterest()}
                  placeholder="Add a skill (e.g. React, UI Design)"
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-orange-500/20 text-sm"
                />
                <button 
                  onClick={handleAddInterest}
                  className="px-4 py-2 bg-orange-100 text-orange-600 rounded-xl font-medium hover:bg-orange-200 transition-colors text-sm"
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skill Level</label>
              <div className="grid grid-cols-3 gap-3">
                {["beginner", "intermediate", "advanced"].map(level => (
                  <button
                    key={level}
                    onClick={() => setSkillLevel(level)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${skillLevel === level ? "bg-white border-orange-500 text-orange-600 shadow-sm ring-2 ring-orange-500/5" : "bg-white/50 border-gray-200 text-gray-500 hover:bg-white"}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Summary */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2 px-1">
            <Gift className="w-4 h-4" /> Rewards & Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-gray-100 flex items-center gap-4 group cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Level 1 Learner</p>
                <p className="text-xs text-gray-500">Complete 3 sessions to level up</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
            <div className="p-4 rounded-2xl border border-gray-100 flex items-center gap-4 group cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">Early Bird</p>
                <p className="text-xs text-gray-500">First booking completed!</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Learning Settings
        </button>
      </div>
    </div>
  );
}
