'use client';

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Illustration from "@/components/illustration";
import Button from "@/components/button";
import InputField from "@/components/input";
import SocialIcons from "@/components/social-icons";
import Logo from "@/components/logo";

export default function SignUpPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const validatePassword = (pwd: string) => {
        if (pwd.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter";
        if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
        if (!/[!@#$%^&*(),.?\":{}|<>]/.test(pwd))
            return "Password must contain at least one special character";
        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !email || !password || !confirmPassword) {
            toast.error("Please fill out all fields");
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

        toast.success("Account created successfully!");
        console.log("Signing up:", { username, email, password });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
            <Toaster position="top-right" />
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                    <div className="p-4 md:p-8 flex flex-col justify-center">
                        <Logo width={80} height={80} />

                        <h1 className="text-xl font-bold text-gray-800 mb-1">
                            Create Your Account
                        </h1>

                        <p className="text-sm text-gray-600 mb-6">
                            Join MentorBee and start your learning journey today!
                        </p>

                        <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
                            <InputField
                                placeholder="Username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />

                            <InputField
                                placeholder="Email"
                                type="text"
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

                            <Button text="Sign Up" />
                        </form>

                        <div className="my-5 flex items-center">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-3 text-xs text-gray-500">Or Sign Up With</span>
                            <div className="flex-1 border-t border-gray-300"></div>
                        </div>

                        <SocialIcons />

                        <p className="text-center mt-5 text-xs text-gray-600">
                            Already have an account?
                            <a href="/login" className="text-orange-600 font-semibold hover:underline">
                                {" "}
                                Login{" "}
                            </a>
                        </p>
                    </div>

                    <Illustration />
                </div>
            </div>
        </div>
    );
}
