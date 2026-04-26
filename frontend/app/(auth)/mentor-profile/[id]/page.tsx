"use client";

import { useEffect, useState } from "react";
import { use } from "react"; // ← This is required in Next.js 15+
import { Globe, Clock, DollarSign, Briefcase, Users, Mail, Calendar, Star, Tag, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../../layout"; // adjust path
import Link from "next/link";

interface Expertise {
  id: string;
  name: string;
}

interface Review {
  id: string;
  student_name: string;
  student_picture?: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface PromoCode {
  code: string;
  discount_type: string;
  discount_value: number;
  expiry_date: string | null;
  description: string | null;
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
  rating: string;
  review_count: number;
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"About" | "Reviews" | "Offers">("About");
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

        // Fetch reviews
        const reviewsRes = await fetch(`http://localhost:5000/api/reviews/mentor/${mentorId}`, {
          credentials: "include",
        });
        const reviewsData = await reviewsRes.json();
        if (reviewsData.success) {
          setReviews(reviewsData.data);
        }

        // Fetch promo codes
        const promosRes = await fetch(`http://localhost:5000/api/promo-codes/mentor/${mentorId}/active`);
        if (promosRes.ok) {
          const promosData = await promosRes.json();
          if (promosData.success) {
            setPromoCodes(promosData.promoCodes);
          }
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
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
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

              <div className="flex items-center gap-1.5 text-gray-800">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-bold">{mentor.rating}</span>
                <span className="text-gray-500">({mentor.review_count} reviews)</span>
              </div>
            </div>
          </div>
        </div>        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs - Mirrored from Sessions/Bookings page */}
            <div className="flex gap-8 border-b border-gray-200 mb-6 overflow-x-auto">
              {["About", "Reviews", "Offers"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`pb-3 text-sm font-medium relative transition-colors whitespace-nowrap flex items-center ${
                    activeTab === tab
                      ? "text-orange-600 font-semibold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {tab}
                  {tab === "Reviews" && reviews.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded-full min-w-[18px] text-center font-bold">
                      {reviews.length}
                    </span>
                  )}
                  {tab === "Offers" && promoCodes.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-600 rounded-full min-w-[18px] text-center font-bold">
                      {promoCodes.length}
                    </span>
                  )}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {activeTab === "About" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <section className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                  <h2 className="text-base font-bold text-gray-900 mb-3">
                    About {mentor.full_name.split(" ")[0]}
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {mentor.bio || "No detailed bio provided yet."}
                  </p>
                </section>

                <section className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                  <h3 className="text-base font-bold text-gray-900 mb-3">
                    Areas of Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {mentor.expertise?.length > 0 ? (
                      mentor.expertise.map((exp) => (
                        <span
                          key={exp.id}
                          className="px-3 py-1 bg-orange-50 text-orange-800 text-[11px] font-bold rounded-full border border-orange-100"
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
            )}

            {activeTab === "Offers" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {promoCodes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {promoCodes.map((promo, idx) => (
                      <div key={idx} className="p-4 bg-gradient-to-br from-orange-50/50 to-white border border-orange-100 rounded-2xl relative overflow-hidden group hover:shadow-sm transition-all">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100/20 rounded-bl-full transform translate-x-4 -translate-y-4" />
                        <div className="flex justify-between items-start mb-3 relative">
                          <span className="px-2.5 py-1 bg-white border border-orange-200 rounded-lg text-[10px] font-black font-mono tracking-widest text-orange-700 uppercase">{promo.code}</span>
                          <span className="text-sm font-black text-gray-900 bg-orange-100 px-2 py-0.5 rounded-full">{promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `Rs. ${promo.discount_value} OFF`}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 font-bold leading-relaxed relative mb-4">
                          {promo.description || `Get a discount on your session with ${mentor.full_name}!`}
                        </p>
                        <Link href={`/book-session/${mentor.id}?promo=${promo.code}`} className="block relative">
                          <button className="w-full py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition flex items-center justify-center gap-2 group-hover:scale-[1.01]">
                            Redeem Now
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <Tag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold">No active offers available right now.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Reviews" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <section className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    Student Reviews
                    <span className="text-sm font-normal text-gray-500">({reviews.length})</span>
                  </h3>

                  {reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                          <div className="flex items-start gap-4 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 overflow-hidden flex-shrink-0 border border-orange-100">
                              {review.student_picture ? (
                                <img 
                                  src={review.student_picture.startsWith('http') ? review.student_picture : `http://localhost:5000${review.student_picture}`} 
                                  alt={review.student_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-orange-600 font-bold text-sm">
                                  {review.student_name[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-bold text-gray-900 text-sm">{review.student_name}</h4>
                                <span className="text-[10px] text-gray-400 font-bold">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star 
                                    key={s} 
                                    className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed italic bg-gray-50 p-4 rounded-xl">
                            "{review.comment || "No comment provided."}"
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-gray-500 text-sm font-medium">No reviews yet for this mentor.</p>
                    </div>
                  )}
                </section>
              </div>
            )}
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
              
              <Link href={`/book-session/${mentor.id}`}>
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