"use client";

import { useState } from "react";
import Illustration from "@/components/illustration";
import Button from "@/components/button";
import InputField from "@/components/input";
import SocialIcons from "@/components/social-icons";
import Logo from "@/components/logo";
import { Check, X } from "lucide-react";

type Role = "student" | "mentor";

export default function SignUpPage() {
  const [role, setRole] = useState<Role>("student");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const [passwordFocused, setPasswordFocused] = useState(false);

  /* Password rules */
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  const showRequirements = passwordFocused || password.length > 0;

  const validateName = (name: string) => {
    if (!name) return "Please enter your name";
    if (!/^[A-Za-z]/.test(name)) return "Name must start with a letter";
    return "";
  };

  const validateEmail = (email: string) => {
    if (!email) return "Please enter your email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email address";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setGeneralError("");

    let hasError = false;

    const nameErr = validateName(name);
    if (nameErr) {
      setNameError(nameErr);
      hasError = true;
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      hasError = true;
    }

    if (!isPasswordValid) {
      setPasswordError("Password does not meet requirements");
      hasError = true;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGeneralError(data.message || "Signup failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", role);

      window.location.href =
        role === "mentor" ? "/mentor/setup" : "/home";
    } catch (error: any) {
      setGeneralError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* LEFT */}
          <div className="p-6 md:p-10 flex flex-col justify-center">
            <Logo width={80} height={80} />

            {/* Role Switch */}
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
                Student Signup
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
                Mentor Signup
              </button>
            </div>

            <h1 className="text-xl font-bold text-gray-800 mb-1">
              {role === "mentor"
                ? "Become a Mentor"
                : "Create Your Account"}
            </h1>

            <p className="text-sm text-gray-600 mb-6">
              {role === "mentor"
                ? "Join MentorBee and start mentoring students"
                : "Join MentorBee and start your learning journey"}
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <InputField
                placeholder="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {nameError && (
                <p className="text-red-500 text-xs">{nameError}</p>
              )}

              <InputField
                placeholder={
                  role === "mentor" ? "Mentor Email" : "Student Email"
                }
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError && (
                <p className="text-red-500 text-xs">{emailError}</p>
              )}

              <InputField
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              {passwordError && (
                <p className="text-red-500 text-xs">{passwordError}</p>
              )}

              {showRequirements && (
                <ul className="text-xs space-y-1">
                  {[
                    ["At least 8 characters", hasMinLength],
                    ["One uppercase letter", hasUppercase],
                    ["One lowercase letter", hasLowercase],
                    ["One number", hasNumber],
                    ["One special character", hasSpecial],
                  ].map(([label, ok], i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-2 ${
                        ok ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      {ok ? <Check size={14} /> : <X size={14} />}
                      {label}
                    </li>
                  ))}
                </ul>
              )}

              <InputField
                placeholder="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPasswordError && (
                <p className="text-red-500 text-xs">
                  {confirmPasswordError}
                </p>
              )}

              {generalError && (
                <p className="text-red-500 text-xs">{generalError}</p>
              )}

              <Button
                text={
                  loading
                    ? "Creating account..."
                    : role === "mentor"
                    ? "Sign up as Mentor"
                    : "Sign up as Student"
                }
              />
            </form>

            <div className="my-5 flex items-center">
              <div className="flex-1 border-t" />
              <span className="px-3 text-xs text-gray-500">
                Or continue with
              </span>
              <div className="flex-1 border-t" />
            </div>

            <SocialIcons role = {role}/>

            <p className="text-center mt-5 text-xs text-gray-600">
              Already have an account?
              <a
                href="/login"
                className="text-orange-600 font-semibold hover:underline"
              >
                {" "}
                Login
              </a>
            </p>
          </div>
          <Illustration role={role} />
        </div>
      </div>
    </div>
  );
}
