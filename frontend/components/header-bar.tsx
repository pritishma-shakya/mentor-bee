"use client";

import { Bell, User, Search } from "lucide-react";

interface UserProps {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor";
  profile_picture?: string;
}

interface HeaderBarProps {
  user: UserProps | null;
  title: string;
  subtitle?: string;
    showSearch?: boolean;
    searchQuery?: string;
    setSearchQuery?: (query: string) => void;
}

export default function HeaderBar({ user, title, subtitle, showSearch, searchQuery, setSearchQuery }: HeaderBarProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        {title && <h1 className="text-xl font-semibold text-gray-900">{title}</h1>}
        {subtitle && <p className="text-gray-600 mt-0.5 text-sm">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        {showSearch && setSearchQuery && (
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search mentors, courses, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 w-full md:w-80 bg-white rounded-full shadow-sm border border-gray-200 
                         focus:border-orange-400 focus:outline-none text-sm placeholder-gray-500"
            />
          </div>
        )}

        <button
          className="relative p-1.5 hover:bg-gray-200 rounded-full transition"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-gray-800" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden">
          {user?.profile_picture ? (
            <img
              src={user.profile_picture}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </div>
      </div>
    </header>
  );
}

