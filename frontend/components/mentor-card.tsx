// components/mentor-card.tsx
"use client";

import { Star, User } from "lucide-react";
import { useRouter } from "next/navigation";

interface MentorCardProps {
  mentor: {
    id: string;
    name: string;
    expertise: string;
    rating: number;
    tags?: string[];
    price: number;
  };
}

export default function MentorCard({ mentor }: MentorCardProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center mb-2">
          <User className="w-6 h-6 text-white" />
        </div>

        <h4 className="text-sm font-semibold text-gray-900">{mentor.name}</h4>

        <div className="flex items-center gap-1 mt-1">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <span className="text-[12px] text-yellow-500">{mentor.rating}</span>
        </div>

        <div className="flex gap-1 mt-2 flex-wrap justify-center">
          {(mentor.tags || []).map((t) => (
            <span key={t} className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-md text-gray-700">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-3 w-full flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] text-gray-500">Price</p>
            <p className="text-xs font-semibold text-gray-900">
              Rs. {mentor.price}/session
            </p>
          </div>

          <button
            onClick={() => router.push(`/mentor-profile`)}
            className="py-1.5 px-2 bg-orange-500 text-white text-[10px] rounded-md font-medium"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}
