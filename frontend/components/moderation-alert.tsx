"use client";

import { ShieldAlert, Ban, Mail, AlertTriangle } from "lucide-react";

interface ModerationAlertProps {
  status: "warned" | "suspended" | "banned";
  message?: string;
  isFullPage?: boolean;
}

export default function ModerationAlert({ status, message, isFullPage = false }: ModerationAlertProps) {
  const config = {
    warned: {
      icon: <ShieldAlert className="w-6 h-6 text-orange-600" />,
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-900",
      subText: "text-orange-700",
      title: "Account Warning",
      defaultMessage: "Your account has received a formal warning. Please ensure you follow our community guidelines to avoid further action.",
    },
    suspended: {
      icon: <AlertTriangle className="w-10 h-10 text-red-600" />,
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-900",
      subText: "text-red-700",
      title: "Account Suspended",
      defaultMessage: "Your account is temporarily suspended due to safety concerns or policy violations.",
    },
    banned: {
      icon: <Ban className="w-12 h-12 text-gray-900" />,
      bg: "bg-gray-50",
      border: "border-gray-900/10",
      text: "text-gray-900",
      subText: "text-gray-600",
      title: "Account Permanently Banned",
      defaultMessage: "This account has been permanently banned from the platform for severe violations of our terms of service.",
    }
  }[status];

  if (isFullPage) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className={`max-w-xl w-full ${config.bg} border-2 ${config.border} rounded-2xl p-10 text-center shadow-xl space-y-6 animate-in zoom-in-95 duration-500`}>
          <div className="flex justify-center flex-col items-center gap-4">
             <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm border border-inherit">
               {config.icon}
             </div>
             <h1 className={`text-2xl font-black uppercase tracking-tight ${config.text}`}>
               {config.title}
             </h1>
          </div>
          
          <p className={`${config.subText} text-sm font-medium leading-relaxed`}>
            {message || config.defaultMessage}
          </p>

          <div className="pt-6 border-t border-inherit/30 flex flex-col items-center gap-4">
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Next Steps</p>
             <div className="flex gap-4 w-full">
               <a 
                 href="mailto:support@mentorbee.com" 
                 className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-white border ${config.border} ${config.text} hover:bg-white/50 transition shadow-sm`}
               >
                 <Mail className="w-4 h-4" /> Contact Support
               </a>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Banner mode for 'warned'
  return (
    <div className={`${config.bg} border ${config.border} rounded-xl p-4 flex items-start gap-4 shadow-sm animate-in slide-in-from-top-2 duration-300`}>
      <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${config.text} shrink-0 border border-inherit shadow-sm`}>
        {config.icon}
      </div>
      <div className="flex-1">
        <h4 className={`text-sm font-bold ${config.text}`}>{config.title}</h4>
        <p className={`text-xs ${config.subText} mt-1 leading-relaxed inline-block max-w-2xl`}>
          {message || config.defaultMessage}
        </p>
      </div>
    </div>
  );
}
