"use client";

import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { User, Edit, X } from "lucide-react";

interface Expertise {
  id: string;
  name: string;
}

export default function MentorSetupPage() {
  const [bio, setBio] = useState("");
  const [expertiseList, setExpertiseList] = useState<Expertise[]>([]);
  const [allExpertise, setAllExpertise] = useState<Expertise[]>([]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [hourlyRate, setHourlyRate] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [responseTime, setResponseTime] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch all available expertise options
  useEffect(() => {
    fetch("http://localhost:5000/api/mentors/expertise", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAllExpertise(data.data || []);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setProfilePicture(e.target.files[0]);
  };

  const handleAddExpertise = (skill: Expertise) => {
    if (!expertiseList.find((e) => e.id === skill.id)) {
      setExpertiseList([...expertiseList, skill]);
    }
  };

  const handleRemoveExpertise = (id: string) => {
    setExpertiseList(expertiseList.filter((e) => e.id !== id));
  };

  const handleSubmit = async () => {
    if (!bio || expertiseList.length === 0) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("bio", bio);
      formData.append("experience", experience);
      formData.append("location", location);
      formData.append("responseTime", responseTime);
      formData.append("hourlyRate", hourlyRate ? hourlyRate : "");
      expertiseList.forEach((e) => formData.append("expertiseIds[]", e.id));

      if (profilePicture) {
        formData.append("profilePicture", profilePicture);
      }

      const res = await fetch("http://localhost:5000/api/mentors/setup", {
        method: "POST",
        credentials: "include",
        body: formData, // FormData ensures file upload works
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Profile setup complete!");
        window.location.href = "/mentor/dashboard";
      } else {
        toast.error(data.message || "Failed to setup profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Toaster position="top-right" />
      <main className="w-full max-w-2xl bg-white rounded-xl p-6 shadow-md border border-gray-100 space-y-4 text-sm">
        <header className="mb-4">
          <h1 className="text-lg font-semibold text-gray-900">Set Up Your Mentor Profile</h1>
          <p className="text-gray-600 mt-1">Complete your profile to start mentoring students.</p>
        </header>

        {/* Profile Picture */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
            {profilePicture ? (
              <img
                src={URL.createObjectURL(profilePicture)}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-gray-500" />
            )}
            <label className="absolute bottom-0 right-0 bg-orange-500 text-white rounded-full p-1 cursor-pointer hover:bg-orange-600">
              <Edit className="w-3 h-3" />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>
          <p className="text-gray-700">Upload a profile picture</p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-gray-700 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself"
            className="w-full border border-gray-300 placeholder-gray-400 text-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            rows={3}
          />
        </div>

        {/* Expertise */}
        <div>
          <label className="block text-gray-700 mb-1">Expertise</label>
          <select
            onChange={(e) => {
              const skill = allExpertise.find((s) => s.id === e.target.value);
              if (skill) handleAddExpertise(skill);
              e.target.value = "";
            }}
            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-700"
            defaultValue=""
          >
            <option value="" disabled>
              Select expertise...
            </option>
            {allExpertise
              .filter((s) => !expertiseList.find((e) => e.id === s.id))
              .map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
          </select>

          <div className="flex flex-wrap gap-2 mt-2">
            {expertiseList.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm"
              >
                {skill.name}
                <X
                  className="ml-1 cursor-pointer"
                  onClick={() => handleRemoveExpertise(skill.id)}
                  size={14}
                />
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-1">Click to add expertise as tags</p>
        </div>

        {/* Other Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-700 mb-1">Hourly Rate (Rs.)</label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="1500"
              className="w-full border border-gray-300 text-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Experience</label>
            <input
              type="text"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="5 years"
              className="w-full border border-gray-300 placeholder-gray-400 text-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
              className="w-full border border-gray-300 placeholder-gray-400 text-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Response Time</label>
            <input
              type="text"
              value={responseTime}
              onChange={(e) => setResponseTime(e.target.value)}
              placeholder="Within 24 hours"
              className="w-full border border-gray-300 placeholder-gray-400 text-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-right">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Complete Setup"}
          </button>
        </div>
      </main>
    </div>
  );
}
