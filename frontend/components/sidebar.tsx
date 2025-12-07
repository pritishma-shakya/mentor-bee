import { Home, Calendar, MessageCircle, Users, Trophy, Settings, LogOut, Compass } from "lucide-react";

export default function Sidebar() {
  const navItems = [
    { icon: Home, label: "Home", active: true },
    { icon: Compass, label: "Explore" },
    { icon: Calendar, label: "My Sessions" },
    { icon: MessageCircle, label: "Messages" },
    { icon: Users, label: "My Community" },
    { icon: Trophy, label: "Rewards" },
    { icon: Settings, label: "Settings" },
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
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[13px] font-medium transition 
              ${item.active ? "bg-orange-50 text-orange-600" : "text-gray-700 hover:bg-gray-100"}`}
            aria-current={item.active ? "page" : undefined}
          >
            <item.icon className="w-4 h-4" /> {item.label}
          </button>
        ))}

        <button className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg mt-5 text-[13px] font-medium">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </nav>
    </div>
  );
}
