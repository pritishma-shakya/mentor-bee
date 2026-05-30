"use client";

import { Video, Calendar, ChevronRight, CheckCircle, Search, Star } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between">
      
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex justify-between items-center py-4 px-6">
          <a href="/" className="flex items-center gap-2">
            <div className="h-12 w-44 overflow-hidden flex items-center justify-start">
              <img src="/images/mentor-bee-logo.png" alt="MentorBee" className="h-10 object-contain" />
            </div>
          </a>
          <nav className="hidden md:flex gap-8 text-sm font-semibold text-gray-600">
            <a href="/" className="text-orange-700">Home</a>
            <a href="/about" className="hover:text-orange-700 transition-colors">About</a>
            <a href="/contact" className="hover:text-orange-700 transition-colors">Contact</a>
            <a href="/login" className="hover:text-orange-700 transition-colors">Find Mentor</a>
            <a href="/signup?role=mentor" className="hover:text-orange-700 transition-colors">Become a Mentor</a>
          </nav>
          <div className="flex gap-3 items-center">
            <a href="/login" className="text-sm font-semibold text-gray-600 hover:text-orange-700 transition-colors px-3 py-2">
              Login
            </a>
            <a href="/signup" className="text-sm font-semibold bg-orange-700 hover:bg-orange-800 text-white px-5 py-2 rounded-xl shadow-sm transition-colors">
              Sign Up
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100 py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-12 gap-10 items-center">
          
          {/* Left Column */}
          <div className="md:col-span-7 space-y-6">
            <span className="text-orange-700 text-xs font-bold uppercase tracking-wider bg-orange-50 px-3 py-1.5 rounded-full inline-block">
              Welcome to MentorBee
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-950 leading-tight">
              Unlock Your Potential. <br/>
              Find Your Perfect <span className="text-orange-700">Mentor</span>.
            </h1>
            <p className="text-base text-gray-600 max-w-xl leading-relaxed">
              Connect with verified industry experts and academic professionals. Get 1-on-1 personalized guidance, schedule video calls, and accelerate your career or study goals.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="/login" className="px-6 py-3 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-xl shadow-md transition-colors text-sm">
                Find a Mentor
              </a>
              <a href="/signup?role=mentor" className="px-6 py-3 bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 font-bold rounded-xl shadow-sm transition-colors text-sm flex items-center gap-1.5">
                Become a Mentor <ChevronRight className="w-4 h-4 text-gray-500" />
              </a>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-100 max-w-md">
              <div>
                <p className="text-2xl font-black text-gray-950">500+</p>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Verified Mentors</p>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-950">10k+</p>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Mentees Joined</p>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-950">98%</p>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">Success Rate</p>
              </div>
            </div>
          </div>

          {/* Right Column Illustration */}
          <div className="md:col-span-5 flex justify-center">
            <div className="bg-gradient-to-br from-orange-50/60 to-amber-50/40 p-6 rounded-3xl border border-gray-100 shadow-sm max-w-md w-full relative">
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl p-3 shadow-sm flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-700 font-bold text-xs border border-orange-100">MB</div>
                <div>
                  <p className="text-[11px] font-bold text-gray-950 leading-none">Session Booking</p>
                  <p className="text-[9px] text-green-600 font-semibold mt-0.5">Active Now</p>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl p-3 shadow-sm flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <div>
                  <p className="text-[11px] font-bold text-gray-950 leading-none">4.9 Average Rating</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">From 2,000+ reviews</p>
                </div>
              </div>

              <img 
                src="/images/illustration.png" 
                alt="Mentorship illustration" 
                className="w-full h-auto object-contain mx-auto my-4 max-h-[300px]" 
              />
            </div>
          </div>

        </div>
      </section>

      {/* Core Features Section */}
      <section className="max-w-6xl mx-auto py-16 px-6 w-full">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-gray-950">Accelerate Your Growth</h2>
          <p className="text-gray-600 mt-2 text-sm">
            Gain insights, guidance, and support from experienced professionals. Choose the right mentor to help you overcome challenges.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-700 rounded-xl flex items-center justify-center border border-orange-100">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-950">Browse Diverse Mentors</h3>
            <p className="text-gray-600 text-xs leading-relaxed">
              Filter mentors by industry, specific technical expertise, ratings, and availability. Find exactly who you need to learn from.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-700 rounded-xl flex items-center justify-center border border-orange-100">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-950">Easy Booking & Scheduling</h3>
            <p className="text-gray-600 text-xs leading-relaxed">
              Check mentor availability in real-time, select a slot, and book your session instantly. Integrates smoothly with your calendar.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-700 rounded-xl flex items-center justify-center border border-orange-100">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-950">Personalized Live Guidance</h3>
            <p className="text-gray-600 text-xs leading-relaxed">
              Connect over secure video call and chat. Talk 1-on-1 about coding challenges, design feedback, career paths, and academic goals.
            </p>
          </div>
        </div>
      </section>

      {/* Share Expertise / Mentor Callout */}
      <section className="bg-white border-y border-gray-100 py-16 px-6 w-full">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <span className="text-orange-700 text-xs font-bold uppercase tracking-wider bg-orange-50 px-3 py-1.5 rounded-full inline-block">
              For Industry Experts
            </span>
            <h2 className="text-3xl font-extrabold text-gray-950 leading-tight">
              Share Your Expertise. <br/>
              Make a Real Impact.
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Give back to the community, refine your leadership skills, and expand your professional network by guiding aspiring individuals. Set your own schedule and hourly rates.
            </p>
            
            <ul className="space-y-3.5 text-xs text-gray-700 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-700 shrink-0" />
                <span>Expand Your Professional Network – Connect with global mentees.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-700 shrink-0" />
                <span>Build Your Reputation – Receive verified ratings and reviews.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-orange-700 shrink-0" />
                <span>Flexible Earning Potential – Manage your sessions and prices.</span>
              </li>
            </ul>

            <div className="pt-2">
              <a href="/signup?role=mentor" className="px-6 py-3 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-xl shadow-md transition-colors text-sm inline-block">
                Become a Mentor Today
              </a>
            </div>
          </div>

          {/* Simple Visual Callout Card */}
          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200 space-y-6">
            <h3 className="font-bold text-gray-950 text-lg border-b border-gray-200 pb-3">Mentor Spotlight</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center font-bold text-orange-700 text-sm">KS</div>
              <div>
                <h4 className="font-bold text-gray-950 text-sm">Kiran Shrestha</h4>
                <p className="text-xs text-orange-700 font-semibold">Senior Software Engineer at F1Soft</p>
              </div>
            </div>
            <p className="text-gray-600 text-xs italic leading-relaxed">
              "Being a mentor on MentorBee has been incredibly rewarding. I get to help students find their path in software engineering while improving my own coaching skills."
            </p>
            <div className="flex items-center gap-1.5 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3.5 h-3.5 fill-amber-500" />)}
              <span className="text-gray-500 text-[10px] font-bold ml-1">5.0 (42 reviews)</span>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 w-full max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-gray-950">How It Works</h2>
          <p className="text-gray-600 mt-2 text-sm">Get started with mentorship in four simple steps</p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { step: "01", title: "Find Your Mentor", desc: "Browse profiles and filter by field, skills, or reviews to find your ideal match." },
            { step: "02", title: "Request & Book", desc: "Select a date and time slot from the mentor's schedule that matches your availability." },
            { step: "03", title: "Join Video Call", desc: "Connect instantly using our built-in video platform for direct 1-on-1 interaction." },
            { step: "04", title: "Grow & Succeed", desc: "Achieve goals with continuous insights, code review, and professional advice." }
          ].map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative space-y-4">
              <span className="text-4xl font-black text-orange-100 absolute top-4 right-4 leading-none">
                {item.step}
              </span>
              <h3 className="font-bold text-gray-950 text-base pt-2">{item.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12 px-6 border-t border-gray-800 w-full mt-auto">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-white text-lg font-bold">MentorBee</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Empowering learners through high-quality professional 1-on-1 mentorship.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">For Mentors</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/signup?role=mentor" className="hover:text-white transition-colors">Become a Mentor</a></li>
              <li><a href="/login" className="hover:text-white transition-colors">Mentor Login</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact Info</h4>
            <ul className="space-y-2 text-xs text-gray-500">
              <li>Email: info@mentorbee.com</li>
              <li>Phone: +977 1 4455667</li>
              <li>Location: Kathmandu, Nepal</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-gray-800 mt-10 pt-6 text-center text-xs text-gray-600 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} MentorBee. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </main>
  );
}