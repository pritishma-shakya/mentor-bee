"use client";

import { useState } from "react";
import Button from "@/components/button";
import InputField from "@/components/input";
import Illustration from "@/components/illustration";
import Logo from "@/components/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not send reset link");
        return;
      }

      setMessage(data.message || "If an account exists for that email, a password reset link has been sent.");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <Logo width={80} height={80} />

            <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-1">
              Forgot password?
            </h1>

            <p className="text-sm text-gray-600 mb-6">
              Enter your email and we will send you a secure reset link.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <InputField
                  placeholder="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                {message && <p className="text-green-600 text-xs mt-1">{message}</p>}
              </div>

              <Button text={loading ? "Sending..." : "Send Reset Link"} />
            </form>

            <p className="text-center mt-5 text-xs text-gray-600">
              Remembered your password?
              <a href="/login" className="text-orange-600 font-semibold hover:underline">
                {" "}
                Login
              </a>
            </p>
          </div>

          <Illustration isMentor={false} />
        </div>
      </div>
    </div>
  );
}
