"use client";

import { useEffect, useState } from "react";
import { use } from "react"; // ← This is required in Next.js 15+
import { Globe, Clock, DollarSign, Briefcase, Users, Mail, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../../layout"; // adjust path
import Link from "next/link";

interface Expertise {
  id: string;
  name: string;
}

interface Mentor {
  id: string;
  user_id: string;
  full_name: string;
  experience: string;
  bio: string;
  location: string;
  hourly_rate: number | null;
  response_time: string | null;
  profile_picture?: string;
  email: string;
  created_at: string;
  expertise: Expertise[];
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor";
  profile_picture?: string;
}

export default function MentorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise (required in Next.js 15+)
  const resolvedParams = use(params);
  const mentorId = resolvedParams.id;

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Debug – keep for testing
    console.log("Resolved mentorId:", mentorId);

    if (!mentorId || mentorId.trim() === "") {
      setError("Invalid or missing mentor ID in the URL");
      toast.error("Please use a valid mentor profile link");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch current user
        const userRes = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData?.user || null);
        }

        // Fetch mentor profile
        const mentorRes = await fetch(`http://localhost:5000/api/mentors/${mentorId}`, {
          credentials: "include",
        });

        if (!mentorRes.ok) {
          throw new Error(`HTTP error ${mentorRes.status}`);
        }

        const mentorData = await mentorRes.json();

        if (mentorData.success && mentorData.data) {
          setMentor(mentorData.data);
        } else {
          throw new Error(mentorData.message || "Mentor not found");
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to load mentor profile");
        toast.error("Could not load mentor profile");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mentorId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading mentor profile...
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <AuthLayout header={{ title: "Mentor Profile" }}>
        <div className="text-center py-20 text-red-600 text-lg">
          {error || "Mentor profile not found"}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      header={{
        title: `${mentor.full_name}'s Profile`,
        subtitle: "Experience, expertise & teaching style",
        user,
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-4 py-4 lg:py-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 md:gap-8 mb-8">
          <div className="relative flex-shrink-0">
            {mentor.profile_picture ? (
              <img
                src={mentor.profile_picture}
                alt={mentor.full_name}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-white shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-3xl border- border-orange-200 shadow-sm">
                {mentor.full_name ? mentor.full_name[0].toUpperCase() : "?"}
              </div>
            )}
          </div>

          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
              {mentor.full_name}
            </h1>
            <p className="text-lg text-gray-800 mb-4 font-medium">
              {mentor.experience || "Experience not specified"}
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-800">
                <Globe className="w-4 h-4 text-gray-700" />
                <span>{mentor.location || "Location not specified"}</span>
              </div>

              {mentor.hourly_rate && (
                <div className="flex items-center gap-1.5 text-gray-800">
                  <DollarSign className="w-4 h-4 text-orange-600" />
                  <span>Rs. {mentor.hourly_rate}/hr</span>
                </div>
              )}

              {mentor.response_time && (
                <div className="flex items-center gap-1.5 text-gray-800">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Replies in {mentor.response_time}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-lg p-4 shadow border border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                About {mentor.full_name.split(" ")[0]}
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {mentor.bio || "No detailed bio provided yet."}
              </p>
            </section>

            <section className="bg-white rounded-lg p-4 shadow border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Areas of Expertise
              </h3>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise?.length > 0 ? (
                  mentor.expertise.map((exp) => (
                    <span
                      key={exp.id}
                      className="px-3 py-1 bg-orange-50 text-orange-800 text-xs font-medium rounded-full border border-orange-200"
                    >
                      {exp.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">
                    No expertise areas listed yet
                  </span>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6 lg:sticky lg:top-6 h-fit">
            <div className="bg-white rounded-lg p-4 shadow border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Quick Info</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-600 text-xs">Experience</p>
                    <p className="text-gray-900 font-medium">
                      {mentor.experience || "Not specified"}
                    </p>
                  </div>
                </div>

                {mentor.hourly_rate && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600 text-xs">Hourly Rate</p>
                      <p className="text-gray-900 font-medium">Rs. {mentor.hourly_rate}</p>
                    </div>
                  </div>
                )}

                {mentor.response_time && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-gray-600 text-xs">Response Time</p>
                      <p className="text-gray-900 font-medium">{mentor.response_time}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-600 text-xs">Email</p>
                    <p className="text-gray-900 font-medium break-all">{mentor.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-600 text-xs">Member Since</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(mentor.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow border border-gray-100 text-center space-y-3">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Ready to Start?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Book a 1-on-1 session with {mentor.full_name}
              </p>
              
              {/* Book Session Button */}
              <Link href={`/book-session`}>
                <button className="w-full bg-orange-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition">
                  Book a Session
                </button>
              </Link>

              <button
                onClick={async () => {
                  if (!user) return toast.error("Please log in first");

                  try {
                    // Start or get existing conversation
                    const res = await fetch("http://localhost:5000/api/conversations/start", {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ mentor_id: mentor.user_id }),
                    });

                    const data = await res.json();
                    if (!data.success) throw new Error(data.message || "Failed to start conversation");

                    // Redirect to messages page using mentorId
                    window.location.href = `/messages?mentorId=${mentor.user_id}`;
                  } catch (err: any) {
                    console.error(err);
                    toast.error(err.message || "Could not start conversation");
                  }
                }}
                className="w-full bg-gray-100 text-gray-800 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                Message Mentor
              </button>

            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}