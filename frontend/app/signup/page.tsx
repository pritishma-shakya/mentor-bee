'use client';

import Illustration from "@/components/illustration";
import Button from "@/components/button";
import InputField from "@/components/input";
import SocialIcons from "@/components/social-icons";
import Logo from "@/components/logo";

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
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
                        <form className="space-y-4">
                        {/* Smaller Input Fields */}
                        <InputField placeholder="Username" type="text"></InputField>
                        <InputField placeholder="Email" type="text"></InputField>
                        <InputField placeholder="Password" type="password"></InputField>
                        <InputField placeholder="Confirm Password" type="password"></InputField>
                        <Button text="Sign Up"></Button>
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