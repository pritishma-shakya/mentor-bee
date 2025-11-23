'use client';

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Illustration from "@/components/illustration";
import Button from "@/components/button";
import InputField from "@/components/input";
import SocialIcons from "@/components/social-icons";
import Logo from "@/components/logo";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const validatePassword = (pwd: string) => {
        if (pwd.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter";
        if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Password must contain at least one special character";
        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error("Please enter both username and password");
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            toast.error(passwordError);
            return;
        }

        // Proceed with login logic
        toast.success("Logged in successfully!");
        console.log("Logging in with:", { username, password });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
            <Toaster position="top-right" />
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="grid md:grid-cols-2 gap-0">
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                        <Logo width={80} height={80} />
                        <h1 className="text-2xl font-bold text-gray-800 mb-1"> Welcome Back! </h1>
                        <p className="text-sm text-gray-600 mb-6">
                            Login to Your Account to continue your learning journey!
                        </p>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <InputField
                                placeholder="Username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <InputField
                                placeholder="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <a href="#" className="text-xs text-orange-600 hover:underline font-medium">
                                    Forgot Password?
                                </a>
                            </div>
                            <Button text="Login"/>
                        </form>

                        <div className="my-5 flex items-center">
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-3 text-xs text-gray-500">Or Sign Up With</span>
                            <div className="flex-1 border-t border-gray-300"></div>
                        </div>
                        <SocialIcons />
                        <p className="text-center mt-5 text-xs text-gray-600">
                            Don’t have an account?  
                            <a href="/signup" className="text-orange-600 font-semibold hover:underline"> Sign Up </a>
                        </p>
                    </div>
                    <Illustration />
                </div>
            </div>
        </div>
    );
}
