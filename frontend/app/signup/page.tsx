'use client';

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Illustration from "@/components/illustration";
import Button from "@/components/button";
import InputField from "@/components/input";
import SocialIcons from "@/components/social-icons";
import Logo from "@/components/logo";

export default function SignUpPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const validatePassword = (pwd: string) => {
        if (pwd.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter";
        if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must contain at least one special character";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !password || !confirmPassword) {
            toast.error("Please fill out all fields");
            return;
        }

        if (!validateEmail(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            toast.error(passwordError);
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("http://localhost:5000/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Signup failed");
            }

            localStorage.setItem("token", data.token);
            toast.success("Account created successfully!");
            console.log("Signed up user:", data.user);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
            <Toaster position="top-right" />
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                    <div className="p-4 md:p-8 flex flex-col justify-center">
                        <Logo width={80} height={80} />
                        <h1 className="text-xl font-bold text-gray-800 mb-1">Create Your Account</h1>
                        <p className="text-sm text-gray-600 mb-6">
                            Join MentorBee and start your learning journey today!
                        </p>

                        <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
                            <InputField
                                placeholder="Name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <InputField
                                placeholder="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <InputField
                                placeholder="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <InputField
                                placeholder="Confirm Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <Button text={loading ? "Signing up..." : "Sign Up"}/>
                        </form>

                        <div className="my-5 flex items-center">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-3 text-xs text-gray-500">Or Sign Up With</span>
                            <div className="flex-1 border-t border-gray-300"></div>
                        </div>

                        <SocialIcons />

                        <p className="text-center mt-5 text-xs text-gray-600">
                            Already have an account?
                            <a href="/login" className="text-orange-600 font-semibold hover:underline"> Login </a>
                        </p>
                    </div>

                    <Illustration />
                </div>
            </div>
        </div>
    );
}
