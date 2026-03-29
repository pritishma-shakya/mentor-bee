"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Star, MessageSquare, TrendingUp, User } from "lucide-react";
import AuthLayout from "../../layout";

interface Review {
  id: string;
  student_name: string;
  student_picture?: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function MentorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });
        const profileData = await profileRes.json();
        if (profileData.success) setUser(profileData.user);

        const reviewsRes = await fetch("http://localhost:5000/api/reviews/my-reviews", {
          credentials: "include",
        });
        const reviewsData = await reviewsRes.json();
        if (reviewsData.success) {
          setReviews(reviewsData.data);
        } else {
          toast.error(reviewsData.message || "Failed to fetch reviews");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  if (loading) return <div className="p-10 text-center">Loading reviews...</div>;

  return (
    <AuthLayout
      header={{
        title: "Ratings & Reviews",
        subtitle: "See what your students are saying about you",
        user,
      }}
    >
      <div className="space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Star className="w-5 h-5" />}
            label="Average Rating"
            value={averageRating}
            iconBg="bg-yellow-100"
            iconColor="text-yellow-600"
          />
          <StatCard
            icon={<MessageSquare className="w-5 h-5" />}
            label="Total Reviews"
            value={reviews.length}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Positive Feedback"
            value={`${reviews.length > 0 ? ((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100).toFixed(0) : 0}%`}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-gray-50/30">
            <h3 className="text-sm font-semibold text-gray-900">All Reviews</h3>
          </div>

          <div className="divide-y divide-gray-100">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="p-4 hover:bg-gray-50/50 transition">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                      {review.student_picture ? (
                        <img 
                          src={review.student_picture.startsWith('http') ? review.student_picture : `http://localhost:5000${review.student_picture}`} 
                          alt={review.student_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 text-xs font-bold">
                          {review.student_name[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{review.student_name}</h4>
                        <span className="text-[10px] text-gray-400">
                          {new Date(review.created_at).toLocaleDateString("en-US", {
                             month: "short",
                             day: "numeric",
                             year: "numeric"
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={`w-3 h-3 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                          />
                        ))}
                      </div>

                      <p className="text-gray-700 text-xs leading-relaxed bg-gray-50/50 p-3 rounded-lg italic relative">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-dashed border-gray-200">
                   <Star className="w-6 h-6 text-gray-300" />
                </div>
                <h4 className="text-base font-medium text-gray-900 mb-1">No reviews yet</h4>
                <p className="text-gray-400 text-xs">Ratings from students will appear here after your completed sessions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

function StatCard({ icon, label, value, iconBg = "bg-orange-100", iconColor = "text-orange-600" }: { icon: any; label: string; value: string | number; iconBg?: string; iconColor?: string }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow border border-gray-100 flex items-center gap-4">
      <div className={`p-3 ${iconBg} rounded-lg ${iconColor}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
