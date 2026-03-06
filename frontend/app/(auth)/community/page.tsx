"use client";

import { useEffect, useState, ChangeEvent } from "react";
import AuthLayout from "../layout";
import { toast } from "react-hot-toast";
import {
  ThumbsUp,
  ThumbsDown,
  User as UserIcon,
  MessageCircle,
  Search,
  X,
  Plus,
  Flame,
  Clock,
  Check,
  Image as ImageIcon
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor";
  profile_picture?: string;
  points?: number;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  time: string;
  profile_picture?: string;
}

interface Post {
  id: string;
  author: string;
  author_role?: "student" | "mentor";
  profile_picture?: string;
  time: string;
  content: string;
  likes: number;
  dislikes: number;
  comments: Comment[];
  tag?: string;
  images?: string[];
  trending?: boolean;
}

interface Contributor {
  name: string;
  points: number;
}

export default function CommunityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [showNewTagInput, setShowNewTagInput] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImages, setNewPostImages] = useState<File[]>([]);
  const [newPostImagePreviews, setNewPostImagePreviews] = useState<string[]>([]);
  const [newPostTag, setNewPostTag] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // ---------------- Fetch Data ----------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setUser(data.user || null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch user");
      } finally {
        setLoading(false);
      }
    };

    const fetchPosts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/community/posts", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch posts");
        const data = await res.json();
        setPosts(data.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchTags = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/community/tags", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch tags");
        const data = await res.json();
        setAvailableTags(data.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
    fetchPosts();
    fetchTags();

    // Mock top contributors
    setTopContributors([
      { name: "Emma Thompson", points: 4990 },
      { name: "Liam Chen", points: 4300 },
      { name: "Sophia Martinez", points: 4100 },
    ]);
  }, []);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files); // File[]

    // Only add File objects to newPostImages
    setNewPostImages([...newPostImages, ...fileArray]);

    // Create previews separately for display
    const previewUrls = fileArray.map((file) => URL.createObjectURL(file));
    setNewPostImagePreviews([...newPostImagePreviews, ...previewUrls]);
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(newPostImagePreviews[index]);
    setNewPostImages(newPostImages.filter((_, i) => i !== index));
    setNewPostImagePreviews(newPostImagePreviews.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && newPostImages.length === 0)
      return toast.error("Post cannot be empty");

    setIsPublishing(true);
    try {
      const formData = new FormData();
      formData.append("content", newPostContent);
      formData.append("tag", newPostTag.trim() || "General");

      newPostImages.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch("http://localhost:5000/api/community/posts", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error("Backend error:", errData);
        throw new Error(errData.message || "Failed to create post");
      }
      const data = await res.json();
      setPosts([data.data, ...posts]);

      // Cleanup
      setNewPostContent("");
      newPostImagePreviews.forEach(url => URL.revokeObjectURL(url));
      setNewPostImages([]);
      setNewPostImagePreviews([]);
      setNewPostTag("");
      setShowCreate(false);

      toast.success("Post created successfully!");
      if (user) setUser({ ...user, points: (user.points || 0) + 10 });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create post");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAddNewTag = async () => {
    if (!newTagInput.trim() || availableTags.includes(newTagInput.trim())) return;
    try {
      const res = await fetch("http://localhost:5000/api/community/tags", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagInput.trim() }),
      });
      if (!res.ok) throw new Error("Failed to add tag");
      setAvailableTags([...availableTags, newTagInput.trim()]);
      toast.success(`Added new tag: ${newTagInput.trim()}`);
      setNewTagInput("");
      setShowNewTagInput(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add tag");
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/community/posts/${postId}/react`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "like" }),
        }
      );
      if (!res.ok) throw new Error("Failed to like post");
      const data = await res.json();
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, likes: data.data.likes } : p
        )
      );
      if (user) setUser({ ...user, points: (user.points || 0) + 1 });
      toast.success("Post liked!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to like post");
    }
  };

  const handleDislike = async (postId: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/community/posts/${postId}/react`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "dislike" }),
        }
      );
      if (!res.ok) throw new Error("Failed to dislike post");
      const data = await res.json();
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, dislikes: data.data.dislikes } : p
        )
      );
      toast.success("Reaction updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to react to post");
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!content.trim()) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/community/posts/${postId}/comments`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      if (!res.ok) throw new Error("Failed to add comment");
      const data = await res.json();
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, comments: [...p.comments, data.data] } : p
        )
      );
      if (user) setUser({ ...user, points: (user.points || 0) + 5 });
      toast.success("Comment added!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add comment");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    );

  return (
    <AuthLayout
      header={{
        title: "Community Forum",
        subtitle: "Connect, ask, answer, and share knowledge",
        showSearch: false,
        searchQuery,
        setSearchQuery,
        user,
      }}
    >
      <div className="flex flex-col lg:flex-row gap-6 mt-5 pb-10">
        {/* Left Column */}
        <div className="flex-1 space-y-5">
          {/* Search + Create */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search posts, accounts, questions, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 py-3 w-full bg-white rounded-lg border border-gray-200 text-gray-900 
                           focus:border-orange-400 focus:outline-none text-sm placeholder-gray-400"
              />
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-4 py-3 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition"
            >
              + Create Post
            </button>
          </div>

          {/* ---------------- Create Post Card ---------------- */}
          {showCreate && (
            <div className="bg-white rounded-lg shadow border border-gray-100 p-4 space-y-3 hover:shadow-md transition">
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-500">Share your knowledge</p>
                </div>
              </div>

              {/* Post Content */}
              <textarea
                className="w-full border border-gray-200 rounded-lg p-3 text-sm placeholder-gray-500 text-gray-900 
                          focus:outline-none focus:border-orange-400 resize-none"
                placeholder="What's on your mind? Share your thoughts, ask questions, or post updates..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={4}
              />

              {/* Images */}
              {(newPostImagePreviews || []).length > 0 && (
                <div className={`mt-2 grid gap-2 ${newPostImagePreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {newPostImagePreviews.map((img, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden">
                      <img
                        src={img}
                        alt={`upload-${i}`}
                        className={`object-cover ${newPostImagePreviews.length === 1 ? 'h-72 w-full' : 'h-44 w-full'}`}
                      />
                      <button
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-1.5 right-1.5 bg-white rounded p-1 text-gray-500 hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNewPostTag(tag)}
                    className={`px-2.5 py-1 rounded text-sm transition-colors
                      ${newPostTag === tag
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    {tag}
                  </button>
                ))}

                {!showNewTagInput ? (
                  <button
                    onClick={() => setShowNewTagInput(true)}
                    className="px-2.5 py-1 rounded text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder="New tag..."
                      className="border border-gray-200 placeholder:text-gray-400 text-gray-900 rounded px-2.5 py-1 text-sm focus:outline-none focus:border-orange-400 w-28"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddNewTag()}
                    />
                    <button
                      onClick={handleAddNewTag}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 flex items-center"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-orange-600 
                                px-2 py-1.5 rounded hover:bg-orange-50 text-sm mt-2">
                <ImageIcon className="w-4 h-4" /> Add Image
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setNewPostContent("");
                    newPostImagePreviews.forEach(url => URL.revokeObjectURL(url));
                    setNewPostImages([]);
                    setNewPostImagePreviews([]);
                    setNewPostTag("");
                  }}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                  disabled={(!newPostContent.trim() && newPostImages.length === 0) || isPublishing}
                >
                  {isPublishing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Publishing...
                    </>
                  ) : (
                    "Publish Post"
                  )}
                </button>
              </div>
            </div>
          )}


          {/* Posts */}
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts
                .filter((p) => selectedTag === "" || p.tag === selectedTag)
                .map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    user={user}
                    onLike={handleLike}
                    onDislike={handleDislike}
                    onAddComment={handleAddComment}
                  />
                ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                <MessageCircle className="mx-auto w-8 h-8 mb-2" />
                <p className="text-sm">No posts yet. Be the first to post!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/3 space-y-5">
          {/* Top Contributors */}
          <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-semibold text-gray-900">Top Contributors</h3>
            </div>
            <div className="space-y-3">
              {topContributors.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">
                        {c.name.charAt(0)}
                      </div>
                      {i < 3 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{i + 1}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.points.toLocaleString()} points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular tags */}
          <div className="bg-white rounded-lg shadow border border-gray-100 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3"> Popular Tags</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setSelectedTag("")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedTag === ""
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                All
              </button>
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedTag === tag
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

// ---------------- PostCard Component ----------------
interface PostCardProps {
  post: Post;
  user: User | null;
  onLike: (postId: string) => void;
  onDislike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
}
function formatTime(timestamp: string) {
  const time = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now.getTime() - time.getTime()) / 1000); // difference in seconds

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return `Yesterday`;
  return time.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function PostCard({ post, user, onLike, onDislike, onAddComment }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [newComment, setNewComment] = useState("");

  const handleLike = () => {
    if (!isLiked) {
      onLike(post.id);
      setIsLiked(true);
      if (isDisliked) setIsDisliked(false);
    }
  };

  const handleDislike = () => {
    if (!isDisliked) {
      onDislike(post.id);
      setIsDisliked(true);
      if (isLiked) setIsLiked(false);
    }
  };

  const handleCommentSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(post.id, newComment.trim());
    setNewComment("");
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 p-4 space-y-3 hover:shadow-md transition">
      {/* Post Header */}
      <div className="flex items-start gap-3">
        {/* Profile */}
        <div className="relative w-12 h-12 flex-shrink-0">
          {(post.profile_picture && post.profile_picture !== "{}" && typeof post.profile_picture === "string") ? (
            <img
              src={post.profile_picture}
              alt={post.author}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-lg">
              {post.author.charAt(0)}
            </div>
          )}

          {post.author_role === "mentor" && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">M</span>
            </div>
          )}
        </div>

        {/* Name + Time */}
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">{post.author}</p>
          <p className="text-xs text-gray-500">{formatTime(post.time)}</p>
        </div>

        {/* Tags on the right */}
        {post.tag && (
          <div className="flex flex-wrap gap-1 justify-end max-w-[40%]">
            <span
              className="text-xs px-2 py-0.5 rounded-full border border-orange-300 text-orange-600 bg-orange-50 whitespace-nowrap"
            >
              {post.tag}
            </span>
          </div>
        )}
      </div>


      {/* Post Content */}
      <p className="text-gray-900 leading-relaxed text-sm">{post.content}</p>

      {/* Post Images */}
      {(post.images || []).filter(img => img && img !== "{}").length > 0 && (
        <div
          className={`mt-2 grid gap-2 ${post.images?.filter(img => img && img !== "{}").length === 1 ? "grid-cols-1" : "grid-cols-2"
            }`}
        >
          {post.images?.filter(img => img && img !== "{}").map((img: string, i: number) => (
            <img
              key={i}
              src={img}
              alt={`post-${post.id}-${i}`}
              className={`rounded-lg object-cover w-full ${post.images?.filter(img => img && img !== "{}").length === 1 ? "h-[500px]" : "h-44"}`}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-gray-100 pt-3">
        {/* Like */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleLike}
            className={`p-1 rounded-full transition-colors ${isLiked
              ? "text-green-600 bg-green-50"
              : "text-gray-500 hover:text-green-600 hover:bg-green-50"
              }`}
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-600">{post.likes}</span>
        </div>

        {/* Dislike */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDislike}
            className={`p-1 rounded-full transition-colors ${isDisliked
              ? "text-red-600 bg-red-50"
              : "text-gray-500 hover:text-red-600 hover:bg-red-50"
              }`}
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-600">{post.dislikes}</span>
        </div>

        {/* Comment */}
        <button
          onClick={() => setShowCommentInput(!showCommentInput)}
          className="flex items-center gap-1 p-1 rounded hover:bg-gray-50 transition"
        >
          <MessageCircle className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-600">{post.comments.length}</span>
        </button>
      </div>

      {/* Comments */}
      {showCommentInput && (
        <>
          {post.comments.length > 0 && (
            <div className="mt-2 space-y-2">
              {post.comments.map((c) => (
                <div
                  key={c.id}
                  className="flex gap-2 border-b border-gray-200 pb-2"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    {c.profile_picture ? (
                      <img
                        src={c.profile_picture}
                        alt={c.author}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-sm font-semibold">
                        {c.author.charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      {c.author}
                    </p>
                    <p className="text-gray-800 text-sm">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment */}
          {user && (
            <div className="mt-3 flex gap-2 items-start">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-sm font-semibold">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>

              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleCommentSubmit()
                }
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:border-orange-400"
              />

              <button
                onClick={handleCommentSubmit}
                className="px-3 py-1.5 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
              >
                Comment
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}