import { FaFacebookF, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

interface SocialIconsProps {
  mode: "login" | "signup";
}

export default function SocialIcons({ mode }: SocialIconsProps) {
  return (
    <div className="flex justify-center space-x-4">
      <a href={`http://localhost:5000/api/auth/google?mode=${mode}`}>
        <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition group">
          <FcGoogle className="w-5 h-5 group-hover:scale-110 transition" />
        </button>
      </a>
    </div>
  );
}
