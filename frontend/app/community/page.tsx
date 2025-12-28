"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import HeaderBar from "@/components/header-bar";
import { UserIcon, Heart, MessageCircle, Share2, Search } from "lucide-react";
import { toast } from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor";
  profile_picture?: string;
}

interface Post {
  id: string;
  author: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
}

interface Contributor {
  name: string;
  points: number;
}

export default function CommunityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [posts, setPosts] = useState<Post[]>([]);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Unauthorized");

        const profileData = await res.json();

        if (profileData?.user) {
          setUser(profileData.user);
        } else {
          setUser(null);
          console.warn("User data missing or not authenticated", profileData);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        toast.error("Failed to fetch user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Dummy posts
    setPosts([
      {
        id: "1",
        author: "Alex Johnson",
        time: "2 hours ago",
        content:
          "Just completed my first Machine Learning project! Built a simple image classifier using TensorFlow. #MachineLearning #AI",
        likes: 124,
        comments: 10,
        shares: 5,
      },
      {
        id: "2",
        author: "Emma Thompson",
        time: "4 hours ago",
        content:
          "Struggling with React hooks? Here's a guide that helped me a lot. #React #Frontend",
        likes: 85,
        comments: 6,
        shares: 2,
      },
    ]);

    setTopContributors([
      { name: "Emma Thompson", points: 4990 },
      { name: "Liam Chen", points: 4300 },
      { name: "Sophia Martinez", points: 4100 },
    ]);
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <main className="flex-1 ml-64 px-6 py-5 max-w-7xl mx-auto">
        <HeaderBar
          user={user}
          title="Community Forum"
          subtitle="Connect, share, and grow together"
        />

        <div className="flex flex-col lg:flex-row gap-6 mt-5">
          {/* Left Column: Posts */}
          <div className="flex-1 space-y-5">
            <div className="flex justify-between items-center mb-3">
              <div className="relative ">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search posts, accounts, questions, tags or keywords..."
                  className="pl-9 pr-3 py-2 w-full md:w-120 bg-white rounded-full shadow-sm border border-gray-200 
                            focus:border-orange-400 focus:outline-none text-sm placeholder-gray-500"
                />
              </div>
              <button className="ml-4 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition">
                + Create Post
              </button>
            </div>

            {posts.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-lg shadow border border-gray-100 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.author}</p>
                      <p className="text-xs text-gray-500">{p.time}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-800">{p.content}</p>

                <div className="flex items-center justify-between text-gray-500 text-xs mt-2 border-t pt-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-red-600">
                      <Heart className="w-4 h-4" /> {p.likes}
                    </div>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                      <MessageCircle className="w-4 h-4" /> {p.comments}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                      <Share2 className="w-4 h-4" /> {p.shares}
                    </div>
                    <div className="cursor-pointer text-gray-400">...</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Top Contributors & Tags */}
          <div className="w-full lg:w-1/3 space-y-5">
            <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Top Contributors this week
              </h3>
              <div className="space-y-2">
                {topContributors.map((c, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-sm text-gray-900"
                  >
                    <span>
                      {i + 1}. {c.name}
                    </span>
                    <span className="text-green-600 font-medium">{c.points}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {["#MachineLearning", "#AI", "#React", "#Python"].map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs cursor-pointer hover:bg-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
