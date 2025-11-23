'use client';

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Illustration from "@/components/illustration";
import Button from "@/components/button";
import InputField from "@/components/input";
import SocialIcons from "@/components/social-icons";
import Logo from "@/components/logo";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Please enter both email and password");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({email, password}),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Login failed");
            }

            localStorage.setItem("token", data.token);
            toast.success("Logged in successfully!");
            console.log("User data:", data.user);
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
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                        <Logo width={80} height={80} />
                        <h1 className="text-2xl font-bold text-gray-800 mb-1"> Welcome Back! </h1>
                        <p className="text-sm text-gray-600 mb-6">
                            Login to Your Account to continue your learning journey!
                        </p>
                        <form className="space-y-4" onSubmit={handleSubmit}>
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
                            <div className="flex justify-end">
                                <a href="#" className="text-xs text-orange-600 hover:underline font-medium">
                                    Forgot Password?
                                </a>
                            </div>
                            <Button text={loading ? "Logging in..." : "Login"} />
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
