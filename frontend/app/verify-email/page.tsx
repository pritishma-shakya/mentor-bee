"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Logo from "@/components/logo";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Validation token is missing.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/auth/verify-email?token=${token}`);
        const data = await res.json();
        
        if (res.ok && data.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Invalid or expired token.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Something went wrong verifying your email.");
      }
    };
    
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden p-10 text-center">
        <div className="flex justify-center mb-8"><Logo width={60} height={60} /></div>
        
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying...</h2>
            <p className="text-gray-500">Please wait while we establish a secure connection relative to your email.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{message}</h2>
            <p className="text-gray-500 mb-6">You can now access your dashboard securely without locking.</p>
            <a href="/login" className="px-6 py-3 w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition">
              Log In Now
            </a>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-red-500 mb-6">{message}</p>
            <a href="/login" className="px-6 py-3 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-bold transition">
              Return to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}
