"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AuthLayout from "../layout"; // Make sure this path is correct
import MentorCard from "@/components/mentor-card";
import { Star, Clock, Calendar, ChevronDown } from "lucide-react";

interface Mentor {
  id: string;
  full_name: string;
  expertise: { id: string; name: string }[];
  hourly_rate: string;
  rating?: number;
  tags?: string[];
}

interface UserProps {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor";
  profile_picture?: string;
}

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<"mentors" | "courses" | "groups">("mentors");
  const [searchQuery, setSearchQuery] = useState("");
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProps | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // ---------------- Fetch user profile ----------------
        const profileRes = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });
        const profileData = await profileRes.json();

        if (profileData.success && profileData.user) setUser(profileData.user);
        else toast.error(profileData.message || "Failed to fetch user info");

        // ---------------- Fetch mentors ----------------
        const mentorsRes = await fetch("http://localhost:5000/api/mentors", {
          credentials: "include",
        });
        const mentorsData = await mentorsRes.json();

        if (mentorsData.success && Array.isArray(mentorsData.data)) {
          setMentors(
            mentorsData.data.map((m: any) => ({
              ...m,
              rating: m.rating || 4.8,
              tags: m.expertise.map((e: any) => e.name),
            }))
          );
        } else toast.error(mentorsData.message || "Failed to fetch mentors");
      } catch (err) {
        console.error("Failed to fetch data:", err);
        toast.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Dummy courses & groups
  const courses = [
    { title: "React Mastery 2025", mentor: "Sarah Johnson", duration: "6h 30m", rating: 4.9, lessons: 12, level: "Intermediate", updated: "Oct 25, 2025" },
    { title: "AWS Certified Solutions Architect", mentor: "Michael Lee", duration: "8h", rating: 4.8, lessons: 15, level: "Beginner", updated: "Nov 1, 2025" },
  ];
  const groupSessions = [
    { title: "Live UI/UX Workshop", mentor: "Alex Chen", date: "Nov 20, 2025", time: "3:00 PM", price: 10 },
    { title: "Machine Learning Study Group", mentor: "Emily Davis", date: "Nov 22, 2025", time: "6:00 PM", price: 12 },
  ];

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <AuthLayout
      header={{
        title: "Explore",
        subtitle: "Find your next mentor, course, or group session",
        showSearch: true,
        searchQuery,
        setSearchQuery,
        user,
      }}
    >
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-5">
        {["mentors", "courses", "groups"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-2 px-1 text-sm font-medium relative transition-colors ${
              activeTab === tab ? "text-orange-600" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "mentors" ? "Mentors" : tab === "courses" ? "Courses" : "Group Sessions"}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mt-4">
        <div className="relative">
          <select className="appearance-none px-5 py-3 pr-12 bg-white border border-gray-300 rounded-xl text-gray-800 font-medium text-sm shadow-sm hover:border-gray-400 focus:border-orange-400 focus:outline-none transition cursor-pointer">
            <option>All Categories</option>
            <option>Web Development</option>
            <option>Data Science</option>
            <option>Design</option>
            <option>Cloud & DevOps</option>
            <option>Career Coaching</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-gray-500" />
          </div>
        </div>
        <div className="relative">
          <select className="appearance-none px-5 py-3 pr-12 bg-white border border-gray-300 rounded-xl text-gray-800 font-medium text-sm shadow-sm hover:border-gray-400 focus:border-orange-400 focus:outline-none transition cursor-pointer">
            <option>Sort by: Recommended</option>
            <option>Highest Rated</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest First</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        {activeTab === "mentors" &&
          mentors.map((m) => (
            <MentorCard
              key={m.id}
              mentor={{
                id: m.id,
                name: m.full_name,
                expertise: m.expertise.map((e) => e.name).join(", "),
                rating: m.rating || 4.8,
                tags: m.tags || [],
                price: parseFloat(m.hourly_rate),
              }}
            />
          ))}

        {activeTab === "courses" &&
          courses.map((course, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer">
              <div className="w-full h-28 bg-gray-200" />
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900 text-base">{course.title}</h3>
                  <div className="flex items-center gap-1 text-orange-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold text-sm">{course.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-0.5">by {course.mentor}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-700">
                  <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.duration}</div>
                  <div className="flex items-center gap-1">📘 {course.lessons} lessons</div>
                  <div className="flex items-center gap-1">🔥 {course.level}</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Updated {course.updated}</p>
                <button className="mt-4 w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition">
                  Enroll Now
                </button>
              </div>
            </div>
          ))}

        {activeTab === "groups" &&
          groupSessions.map((session, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer">
              <div className="w-full h-28 bg-purple-200" />
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900 text-base">{session.title}</h3>
                  <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded-full">Live</span>
                </div>
                <p className="text-gray-600 text-sm mt-0.5">with {session.mentor}</p>
                <div className="flex items-center gap-2 mt-3 text-gray-700 text-sm"><Calendar className="w-4 h-4" /> {session.date}</div>
                <div className="flex items-center gap-2 text-gray-700 text-sm">⏰ {session.time}</div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-lg font-bold text-purple-600">${session.price}</span>
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition">
                    Join Session
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </AuthLayout>
  );
}
