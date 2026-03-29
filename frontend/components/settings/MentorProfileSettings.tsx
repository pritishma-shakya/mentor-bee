"use client";

import { useState, useEffect } from "react";
import { Briefcase, MapPin, DollarSign, Clock, BookOpen, Linkedin, Globe, FileText, ToggleLeft, Timer, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface MentorProfileSettingsProps {
  user: any;
}

export default function MentorProfileSettings({ user }: MentorProfileSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [expertiseOptions, setExpertiseOptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, expertiseRes] = await Promise.all([
          fetch(`http://localhost:5000/api/mentors/${user.id}`, { credentials: "include" }),
          fetch("http://localhost:5000/api/mentors/expertise", { credentials: "include" }),
        ]);

        const profileData = await profileRes.json();
        const expertiseData = await expertiseRes.json();

        if (profileData.success) {
          setProfile({
            ...profileData.data,
            expertiseIds: profileData.data.expertise.map((e: any) => e.id)
          });
        }
        if (expertiseData.success) setExpertiseOptions(expertiseData.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load mentor profile");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("http://localhost:5000/api/mentors/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: profile.bio,
          experience: profile.experience,
          location: profile.location,
          hourlyRate: profile.hourly_rate,
          responseTime: profile.response_time,
          expertiseIds: profile.expertiseIds,
          linkedin_url: profile.linkedin_url,
          portfolio_url: profile.portfolio_url,
          certifications: profile.certifications,
          auto_accept: profile.auto_accept,
          buffer_time: profile.buffer_time,
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleExpertiseToggle = (id: string) => {
    setProfile((prev: any) => {
      const current = prev.expertiseIds || [];
      const updated = current.includes(id)
        ? current.filter((x: string) => x !== id)
        : [...current, id];
      return { ...prev, expertiseIds: updated };
    });
  };

  if (loading) return <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Professional Profile</h3>
        <p className="text-sm text-gray-500">Manage your mentor bio, rate, and expertise.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 ml-1">Short Bio</label>
          <textarea
            value={profile?.bio || ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Tell potential students about yourself..."
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition h-32 resize-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 ml-1">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={profile?.location || ""}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                placeholder="Ex: Kathmandu, Nepal"
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 ml-1">Years of Experience</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={profile?.experience || ""}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                placeholder="Ex: 5"
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 ml-1">Hourly Rate (Rs.)</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={profile?.hourly_rate || ""}
                onChange={(e) => setProfile({ ...profile, hourly_rate: e.target.value })}
                placeholder="Ex: 500"
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 ml-1">Response Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={profile?.response_time || ""}
                onChange={(e) => setProfile({ ...profile, response_time: e.target.value })}
                placeholder="Ex: Within 1 hour"
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 ml-1">LinkedIn URL</label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0077b5]" />
              <input
                type="url"
                value={profile?.linkedin_url || ""}
                onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 ml-1">Portfolio URL</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={profile?.portfolio_url || ""}
                onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                placeholder="https://yourportfolio.com"
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 ml-1">Certifications</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              value={profile?.certifications || ""}
              onChange={(e) => setProfile({ ...profile, certifications: e.target.value })}
              placeholder="List your key certifications (e.g. AWS Solutions Architect, Google UX Design)"
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition h-20 resize-none"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Timer className="w-4 h-4 text-orange-500" /> Booking & Business Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-accept Bookings</p>
                <p className="text-xs text-gray-500">Automatically approve new session requests</p>
              </div>
              <button 
                type="button"
                onClick={() => setProfile({ ...profile, auto_accept: !profile.auto_accept })}
                className={`w-12 h-6 rounded-full transition-colors relative ${profile?.auto_accept ? "bg-orange-500" : "bg-gray-200"}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${profile?.auto_accept ? "translate-x-6" : ""}`} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 ml-1">Buffer Time (Minutes)</label>
              <div className="relative">
                <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={profile?.buffer_time || 0}
                  onChange={(e) => setProfile({ ...profile, buffer_time: Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition appearance-none"
                >
                  <option value={0}>None</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Expertise & Skills
          </label>
          <div className="flex flex-wrap gap-2">
            {expertiseOptions.map((opt) => {
              const isActive = profile?.expertiseIds?.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleExpertiseToggle(opt.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm border
                    ${isActive 
                      ? "bg-orange-500 text-white border-orange-600 ring-2 ring-orange-500/20" 
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}
                >
                  {opt.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Professional Profile
          </button>
        </div>
      </form>
    </div>
  );
}
