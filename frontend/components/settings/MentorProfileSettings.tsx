"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Loader2,
  FileText,
} from "lucide-react";
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
          // ✅ FIXED ENDPOINT
          fetch("http://localhost:5000/api/mentors/my-profile", {
            credentials: "include",
          }),
          fetch("http://localhost:5000/api/mentors/expertise", {
            credentials: "include",
          }),
        ]);

        const profileData = await profileRes.json();
        const expertiseData = await expertiseRes.json();

        console.log("PROFILE API:", profileData);

        if (profileData.success) {
          setProfile({
            ...profileData.data,
            expertiseIds:
              profileData.data.expertise?.map((e: any) => e.id) || [],
          });
        }

        if (expertiseData.success) {
          setExpertiseOptions(expertiseData.data);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load mentor profile");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(
        "http://localhost:5000/api/mentors/update",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            bio: profile.bio,
            location: profile.location,
            experience: profile.experience,
            hourlyRate: profile.hourly_rate,
            responseTime: profile.response_time,
            expertiseIds: profile.expertiseIds,
          }),
        }
      );

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const inputClass =
    "w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-500";
  const labelClass = "text-sm font-medium text-gray-800 mb-1 block";

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-gray-800">Professional Profile</h3>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">

        {/* BIO */}
        <div>
          <label className={labelClass}>Bio</label>
          <textarea
            value={profile?.bio || ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="w-full px-4 py-3 text-gray-800 border border-gray-300 rounded-xl"
            rows={4}
          />
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <label className={labelClass}>Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-800" />
              <input
                value={profile?.location || ""}
                onChange={(e) =>
                  setProfile({ ...profile, location: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Experience</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-800" />
              <input
                value={profile?.experience || ""}
                onChange={(e) =>
                  setProfile({ ...profile, experience: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Hourly Rate</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-800" />
              <input
                value={profile?.hourly_rate || ""}
                onChange={(e) =>
                  setProfile({ ...profile, hourly_rate: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Response Time</label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-800" />
              <input
                value={profile?.response_time || ""}
                onChange={(e) =>
                  setProfile({ ...profile, response_time: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* EXPERTISE */}
        <div>
          <label className={labelClass}>Expertise</label>

          <div className="flex flex-wrap gap-2">
            {expertiseOptions.map((opt) => {
              const active = profile?.expertiseIds?.includes(opt.id);

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleExpertiseToggle(opt.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
                    ${active
                      ? "bg-orange-500 text-white border-orange-600 shadow-sm"
                      : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                    }`}
                >
                  {opt.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* DOCUMENTS */}
        <div>
          <label className={labelClass}>Uploaded Documents</label>

          <div className="space-y-2">
            {profile?.documents?.map((doc: any, idx: number) => (
              <a
                key={idx}
                href={doc.url}
                target="_blank"
                className="text-blue-600 text-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {doc.name}
              </a>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-orange-500 text-white rounded-xl"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}