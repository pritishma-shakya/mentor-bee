"use client";

import { useState } from "react";
import Sidebar from "@/components/sidebar";
import MentorCard from "@/components/mentor-card";
import { Search, Bell, User, Star, Clock, Calendar, ChevronDown } from "lucide-react";

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<"mentors" | "courses" | "groups">("mentors");
  const [searchQuery, setSearchQuery] = useState("");

  const mentors = [
    { name: "Sarah Johnson", expertise: "Web Development", rating: 4.9, tags: ["React", "Next.js"], price: 15 },
    { name: "Michael Lee", expertise: "Cloud Computing", rating: 4.8, tags: ["AWS", "Kubernetes"], price: 25 },
    { name: "Emily Davis", expertise: "Data Science", rating: 4.7, tags: ["Pandas", "ML"], price: 22 },
    { name: "Alex Chen", expertise: "UI/UX Design", rating: 5.0, tags: ["Figma", "Design Systems"], price: 30 },
  ];

  const courses = [
    { title: "React Mastery 2025", mentor: "Sarah Johnson", duration: "6h 30m", rating: 4.9, lessons: 12, level: "Intermediate", updated: "Oct 25, 2025" },
    { title: "AWS Certified Solutions Architect", mentor: "Michael Lee", duration: "8h", rating: 4.8, lessons: 15, level: "Beginner", updated: "Nov 1, 2025" },
  ];

  const groupSessions = [
    { title: "Live UI/UX Workshop", mentor: "Alex Chen", date: "Nov 20, 2025", time: "3:00 PM", price: 10 },
    { title: "Machine Learning Study Group", mentor: "Emily Davis", date: "Nov 22, 2025", time: "6:00 PM", price: 12 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <main className="flex-1 ml-64 px-6 py-4 max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Explore</h1>
            <p className="text-gray-600 mt-0.5 text-sm">Find your next mentor, course, or group session</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search mentors, courses, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 w-80 bg-white rounded-full shadow-sm border border-gray-200 
                          focus:border-orange-400 focus:outline-none text-sm placeholder-gray-500"
              />
            </div>

            <button className="relative p-1.5 hover:bg-gray-200 rounded-full transition" aria-label="Notifications">
              <Bell className="w-4 h-4 text-gray-800" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </header>

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
              {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-500 rounded-full" />}
            </button>
          ))}
        </div>

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

          <button className="ml-auto text-sm font-medium text-orange-600 hover:text-orange-700 transition">
            Clear filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
          {activeTab === "mentors" && mentors.map((mentor, i) => <MentorCard key={i} mentor={mentor} />)}

          {activeTab === "courses" &&
            courses.map((course, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
              >
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
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {course.duration}
                    </div>
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
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div className="w-full h-28 bg-purple-200" />

                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900 text-base">{session.title}</h3>
                    <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded-full">Live</span>
                  </div>

                  <p className="text-gray-600 text-sm mt-0.5">with {session.mentor}</p>

                  <div className="flex items-center gap-2 mt-3 text-gray-700 text-sm">
                    <Calendar className="w-4 h-4" /> {session.date}
                  </div>

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
      </main>
    </div>
  );
}
