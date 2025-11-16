import { FaFacebookF, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export default function SocialIcons(){
    return(
        <div className="flex justify-center space-x-4">
            <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition group">
            <FaFacebookF className="w-5 h-5 text-blue-600 group-hover:scale-110 transition" />
            </button>
            <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition group">
            <FcGoogle className="w-5 h-5 group-hover:scale-110 transition" />
            </button>
            <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition group">
            <FaApple className="w-5 h-5 text-black group-hover:scale-110 transition" />
            </button>
        </div>
    )
}