"use client";

import { useState } from "react";
import Illustration from "@/components/illustration";
import Button from "@/components/button";
import InputField from "@/components/input";
import SocialIcons from "@/components/social-icons";
import Logo from "@/components/logo";

type Role = "student" | "mentor";

export default function LoginPage() {
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setGeneralError(data.message || "Login failed");
        return;
      }

      // ✅ Save token and role correctly
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("role", data.data.user.role);

      // Redirect based on role
      window.location.href =
        data.data.user.role === "mentor" ? "/mentor/dashboard" : "/home";
    } catch (err: any) {
      setGeneralError(err.message || "Something went wrong");
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

            {/* Role Switch Tabs */}
            <div className="flex mt-4 mb-6 bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                  role === "student"
                    ? "bg-white shadow text-orange-600"
                    : "text-gray-500"
                }`}
              >
                Student Login
              </button>

              <button
                type="button"
                onClick={() => setRole("mentor")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                  role === "mentor"
                    ? "bg-white shadow text-orange-600"
                    : "text-gray-500"
                }`}
              >
                Mentor Login
              </button>
            </div>

            {/* Dynamic Text */}
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              {role === "mentor" ? "Welcome back, Mentor!" : "Welcome back!"}
            </h1>

            <p className="text-sm text-gray-600 mb-6">
              {role === "mentor"
                ? "Login to manage your students and sessions"
                : "Login to continue your learning journey"}
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <InputField
                  placeholder={role === "mentor" ? "Mentor Email" : "Student Email"}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
              </div>

              <div>
                <InputField
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
              </div>

              {generalError && <p className="text-red-500 text-xs">{generalError}</p>}

              <div className="flex justify-end">
                <a
                  href="/forgot-password"
                  className="text-xs text-orange-600 hover:underline font-medium"
                >
                  Forgot Password?
                </a>
              </div>

              <Button
                text={
                  loading
                    ? "Logging in..."
                    : role === "mentor"
                    ? "Login as Mentor"
                    : "Login as Student"
                }
              />
            </form>

            <div className="my-5 flex items-center">
              <div className="flex-1 border-t border-gray-300" />
              <span className="px-3 text-xs text-gray-500">Or continue with</span>
              <div className="flex-1 border-t border-gray-300" />
            </div>

            <SocialIcons role={role} />

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

          <Illustration role={role} />
        </div>
      </div>
    </div>
  );
}
