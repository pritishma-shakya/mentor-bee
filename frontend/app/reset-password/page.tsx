"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/button";
import InputField from "@/components/input";
import Illustration from "@/components/illustration";
import Logo from "@/components/logo";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Reset link is missing or invalid");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not reset password");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setMessage("Password reset successfully. You can now log in.");
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
              Set new password
            </h1>

            <p className="text-sm text-gray-600 mb-6">
              Choose a new password for your MentorBee account.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <InputField
                placeholder="New password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <InputField
                placeholder="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {error && <p className="text-red-500 text-xs">{error}</p>}
              {message && <p className="text-green-600 text-xs">{message}</p>}

              <Button text={loading ? "Resetting..." : "Reset Password"} />
            </form>

            <p className="text-center mt-5 text-xs text-gray-600">
              Back to
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
