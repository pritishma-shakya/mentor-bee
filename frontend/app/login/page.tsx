"use client";

import { useState } from "react";
import Illustration from "@/components/illustration";
import Button from "@/components/button";
import InputField from "@/components/input";
import SocialIcons from "@/components/social-icons";
import Logo from "@/components/logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    let hasError = false;

    if (!email) {
      setEmailError("Please enter your email");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Please enter your password");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ cookie-based auth
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("LOGIN RESPONSE 👉", data);

      if (!res.ok || !data.success) {
        setGeneralError(data.message || "Invalid credentials");
        return;
      }

      // ✅ Your backend response shape
      const user = data.user;

      if (!user || !user.role) {
        setGeneralError("Invalid login response from server");
        return;
      }

      // Store role only (token is in httpOnly cookie)
      localStorage.setItem("role", user.role);

      // 🔀 Redirect based on role
      if (user.role === "admin") {
        window.location.href = "/admin/dashboard";
      } else if (user.role === "mentor") {
        window.location.href = "/mentor/dashboard";
      } else {
        window.location.href = "/home";
      }
    } catch (err: any) {
      console.error(err);
      setGeneralError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* LEFT */}
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <Logo width={80} height={80} />

            <h1 className="text-2xl font-bold text-gray-800 mt-4 mb-1">
              Welcome back 👋
            </h1>

            <p className="text-sm text-gray-600 mb-6">
              Login to continue to MentorBee
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <InputField
                  placeholder="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {emailError && (
                  <p className="text-red-500 text-xs mt-1">{emailError}</p>
                )}
              </div>

              <div>
                <InputField
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {passwordError && (
                  <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                )}
              </div>

              {generalError && (
                <p className="text-red-500 text-xs">{generalError}</p>
              )}

              <div className="flex justify-end">
                <a
                  href="/forgot-password"
                  className="text-xs text-orange-600 hover:underline font-medium"
                >
                  Forgot Password?
                </a>
              </div>

              <Button text={loading ? "Logging in..." : "Login"} />
            </form>

            <div className="my-5 flex items-center">
              <div className="flex-1 border-t border-gray-300" />
              <span className="px-3 text-xs text-gray-500">
                Or continue with
              </span>
              <div className="flex-1 border-t border-gray-300" />
            </div>

            <SocialIcons mode="login" />

            <p className="text-center mt-5 text-xs text-gray-600">
              Don’t have an account?
              <a
                href="/signup"
                className="text-orange-600 font-semibold hover:underline"
              >
                {" "}
                Sign Up
              </a>
            </p>
          </div>

          {/* RIGHT */}
          <Illustration isMentor={false} />
        </div>
      </div>
    </div>
  );
}
