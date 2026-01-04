"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home,
  Calendar,
  MessageCircle,
  Users,
  Trophy,
  Settings,
  LogOut,
  Compass,
  UserCheck,
  DollarSign,
  BarChart3,
  Shield,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor" | "admin";
  profile_picture?: string;
}

interface NavItem {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });

        if (!res.ok) {
          router.push("/login");
          return;
        }

        const data = await res.json();
        setUser(data.user || null);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        toast.error("Session expired. Please login again.");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) return null;
  if (!user) return null;

  const studentNav: NavItem[] = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: Calendar, label: "My Sessions", path: "/sessions" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: Users, label: "My Community", path: "/community" },
    { icon: Trophy, label: "Rewards", path: "/rewards" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const mentorNav: NavItem[] = [
    { icon: Home, label: "Dashboard", path: "/mentor/dashboard" },
    { icon: Calendar, label: "My Sessions", path: "/mentor/sessions" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: UserCheck, label: "My Students", path: "/mentor/students" },
    { icon: DollarSign, label: "Earnings", path: "/mentor/earnings" },
    { icon: Trophy, label: "Ratings & Reviews", path: "/mentor/reviews" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const adminNav: NavItem[] = [
    { icon: BarChart3, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "All Users", path: "/admin/users" },
    { icon: UserCheck, label: "Manage Mentors", path: "/admin/mentors" },
    { icon: Calendar, label: "All Sessions", path: "/admin/sessions" },
    { icon: DollarSign, label: "Revenue", path: "/admin/revenue" },
    { icon: Shield, label: "Manage Points", path: "/admin/manage-points" },
    { icon: Settings, label: "System Settings", path: "/admin/settings" },
  ];

  const navItems =
    user.role === "student" ? studentNav :
    user.role === "mentor" ? mentorNav :
    user.role === "admin" ? adminNav : [];

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      toast.success("Logged out successfully!");
    } catch {
      toast.error("Logout failed, redirecting anyway...");
    } finally {
      router.push("/login");
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 w-60 bg-white shadow-lg p-5 flex flex-col overflow-y-auto border-r border-gray-100">
      <div className="mb-8 text-center">
        <img
          src="/images/mentor-bee-logo.png"
          width={70}
          height={40}
          alt="MentorBee logo"
          className="ml-5"
        />
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path);
          return (
            <Link
              key={item.label}
              href={item.path}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? "bg-orange-50 text-orange-600 border border-orange-200 shadow-sm"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-auto w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  );
}
