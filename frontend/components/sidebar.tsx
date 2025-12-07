"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  MessageCircle,
  Users,
  Trophy,
  Settings,
  LogOut,
  Compass,
} from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: Calendar, label: "My Sessions", path: "/sessions" },
    { icon: MessageCircle, label: "Messages", path: "/messages" },
    { icon: Users, label: "My Community", path: "/community" },
    { icon: Trophy, label: "Rewards", path: "/rewards" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="fixed h-full w-60 bg-white shadow-md p-5 flex flex-col">
      <img
        src="/images/mentor-bee-logo.png"
        width={70}
        height={40}
        className="mx-2 mb-8"
        alt="MentorBee logo"
      />

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[13px] font-medium transition 
                ${isActive 
                  ? "bg-orange-50 text-orange-600 border border-orange-200" 
                  : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}

        <button
          onClick={() => router.push("/logout")}
          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg mt-5 text-[13px] font-medium"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </nav>
    </div>
  );
}
