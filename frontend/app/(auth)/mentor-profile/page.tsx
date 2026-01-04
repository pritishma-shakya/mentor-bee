"use client";

import { useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import AuthLayout from "../layout"; // adjust path if needed

interface Review {
  reviewer: string;
  comment: string;
  rating: number;
  date: string;
  avatar: string;
}

interface ScheduleDay {
  day: string;
  slots: string[];
}

interface Mentor {
  name: string;
  expertise: string;
  bio: string;
  rating: number;
  price: number;
  achievements: string[];
  reputationPoints: number;
  overview: string;
  schedule: ScheduleDay[];
  reviews: Review[];
  profile_picture: string;
  tags: string[];
  experience: string;
  location: string;
  students: number;
  sessions: number;
  responseTime: string;
  verified: boolean;
}

export default function MentorProfilePage() {
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const mentor: Mentor = {
    name: "Sarah Johnson",
    expertise: "Senior Frontend Engineer & Mentor",
    bio: "10+ years experience in building scalable applications with React, Next.js, and modern frontend ecosystems. Passionate about mentoring developers.",
    rating: 4.92,
    price: 35,
    achievements: [
      "Certified React Developer (Meta)",
      "Top Mentor Award 2023",
      "100+ Successful Students",
      "Ex-Google Frontend Engineer",
      "GitHub Star Contributor"
    ],
    reputationPoints: 1520,
    overview: "I specialize in helping developers transition from intermediate to advanced React concepts. My mentorship focuses on real-world projects, performance optimization, and career growth.",
    schedule: [
      { day: "Mon", slots: ["10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM"] },
      { day: "Tue", slots: ["9:00 AM", "11:00 AM", "1:00 PM"] },
      { day: "Wed", slots: ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM"] },
      { day: "Thu", slots: ["11:00 AM", "3:00 PM", "4:00 PM"] },
      { day: "Fri", slots: ["9:00 AM", "1:00 PM", "3:00 PM"] },
    ],
    reviews: [
      { 
        reviewer: "Alex Chen", 
        comment: "Sarah transformed my approach to React. Her code reviews are incredibly detailed and helped me land a senior role!", 
        rating: 5,
        date: "2 weeks ago",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg"
      },
      { 
        reviewer: "Maria Rodriguez", 
        comment: "Patient, knowledgeable, and always prepared. Best investment I've made in my career.", 
        rating: 4.8,
        date: "1 month ago",
        avatar: "https://randomuser.me/api/portraits/women/26.jpg"
      },
      { 
        reviewer: "David Kim", 
        comment: "The Next.js deep dive sessions were game-changing. Sarah explains complex concepts with clarity.", 
        rating: 5,
        date: "3 weeks ago",
        avatar: "https://randomuser.me/api/portraits/men/22.jpg"
      },
    ],
    profile_picture: "https://randomuser.me/api/portraits/women/44.jpg",
    tags: ["React", "Next.js 14", "TypeScript", "Tailwind CSS", "Performance", "Testing", "Career Growth"],
    experience: "12 years",
    location: "San Francisco, CA",
    students: 143,
    sessions: 856,
    responseTime: "Within 2 hours",
    verified: true,
  };

  const timeSlots = mentor.schedule.find(d => d.day === selectedDay)?.slots || [];

  const handleBookSession = () => {
    if (!selectedTime) return toast.error("Select a time slot");
    toast.success(`Booked ${selectedDay} at ${selectedTime}`);
  };

  return (
    <AuthLayout
      header={{
        title: "Mentor Profile",
        subtitle: "Learn more about your mentor and book sessions",
      }}
    >
      <Toaster />
      <div className="flex flex-col gap-6">
        {/* Header with Image, Rating, Location, Rate */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden">
            <Image
              src={mentor.profile_picture}
              alt={mentor.name}
              width={128}
              height={128}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{mentor.name}</h1>
            <p className="text-gray-700">{mentor.expertise}</p>
            <div className="flex items-center gap-2 mt-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">{mentor.rating}</span>
              <span className="text-gray-500 text-sm">({mentor.reviews.length} reviews)</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">{mentor.location}</p>
          </div>

          <div className="text-right">
            <p className="text-gray-600 text-sm">Hourly Rate</p>
            <p className="text-2xl font-bold text-gray-900">${mentor.price}/hr</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {mentor.tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg">{tag}</span>
          ))}
        </div>

        {/* Overview */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-2">About</h2>
          <p className="text-gray-700 text-sm">{mentor.overview}</p>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-2">Achievements</h2>
          <ul className="list-disc pl-5 text-gray-700 text-sm">
            {mentor.achievements.map(a => <li key={a}>{a}</li>)}
          </ul>
        </div>

        {/* Schedule & Booking */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-2">Schedule</h2>
          <div className="flex gap-2 mb-3">
            {mentor.schedule.map(d => (
              <button
                key={d.day}
                onClick={() => { setSelectedDay(d.day); setSelectedTime(null); }}
                className={`px-3 py-1 rounded-lg text-sm ${selectedDay === d.day ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                {d.day}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {timeSlots.map(slot => (
              <button
                key={slot}
                onClick={() => setSelectedTime(slot)}
                className={`px-3 py-1 text-sm rounded-lg ${selectedTime === slot ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                {slot}
              </button>
            ))}
          </div>
          <button
            onClick={handleBookSession}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600"
          >
            Book Session
          </button>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Student Reviews</h2>
          <div className="space-y-3">
            {mentor.reviews.map((r, i) => (
              <div key={i} className="flex gap-3 items-start">
                <Image
                  src={r.avatar}
                  alt={r.reviewer}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{r.reviewer}</p>
                  <p className="text-gray-500 text-xs">{r.date}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-gray-900 text-sm">{r.rating}</span>
                  </div>
                  <p className="text-gray-700 text-sm mt-1">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
