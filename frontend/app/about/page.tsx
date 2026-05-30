"use client";

import { Award, Users, Shield, Target, BookOpen, ChevronRight } from "lucide-react";

export default function AboutPage() {
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
            <a href="/" className="hover:text-orange-700 transition-colors">Home</a>
            <a href="/about" className="text-orange-700">About</a>
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
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-orange-700 text-xs font-bold uppercase tracking-wider bg-orange-50 px-3 py-1.5 rounded-full">
            Our Story
          </span>
          <h1 className="text-4xl font-extrabold text-gray-950 mt-4 mb-6 leading-tight">
            Empowering Mentees, Inspiring Mentors
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            MentorBee was founded to bridge the gap between aspiring individuals and industry leaders. We believe that everyone deserves access to personalized guidance to unlock their true potential.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-6xl mx-auto py-16 px-6 w-full">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex gap-5">
            <div className="w-12 h-12 shrink-0 bg-orange-50 text-orange-700 rounded-xl flex items-center justify-center border border-orange-100">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-950 mb-3">Our Mission</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                To create a global, accessible network where experts can share knowledge and mentees can find tailored mentorship, accelerating career and personal development globally.
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex gap-5">
            <div className="w-12 h-12 shrink-0 bg-orange-50 text-orange-700 rounded-xl flex items-center justify-center border border-orange-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-950 mb-3">Our Vision</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                To foster a world where guidance is just a click away, making life-changing mentorship democratic, affordable, and highly engaging for learners everywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-white border-y border-gray-100 py-16 px-6 w-full">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-950">Our Core Values</h2>
            <p className="text-gray-600 mt-2 text-sm">The principles that drive every connection we facilitate.</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
              <div className="w-10 h-10 bg-orange-50 text-orange-700 rounded-lg flex items-center justify-center border border-orange-100">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-950">Community First</h3>
              <p className="text-gray-600 text-xs leading-relaxed">
                We believe in supporting one another. Our community is built on mutual respect, collaboration, and constructive growth.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
              <div className="w-10 h-10 bg-orange-50 text-orange-700 rounded-lg flex items-center justify-center border border-orange-100">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-950">Excellence</h3>
              <p className="text-gray-600 text-xs leading-relaxed">
                We screen our mentors and verify their academic credentials to maintain high-quality mentorship standards across the platform.
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
              <div className="w-10 h-10 bg-orange-50 text-orange-700 rounded-lg flex items-center justify-center border border-orange-100">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-950">Trust & Security</h3>
              <p className="text-gray-600 text-xs leading-relaxed">
                From secure video calls to verified mentor ratings, we prioritize absolute safety and privacy for both parties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-6xl mx-auto py-16 px-6 w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-950">Meet Our Leadership Team</h2>
          <p className="text-gray-600 mt-2 text-sm">The passionate minds driving the MentorBee vision.</p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {[
            { name: "Priya Sharma", role: "Founder & CEO", initials: "PS" },
            { name: "Arjun Adhikari", role: "Head of Mentor Relations", initials: "AA" },
            { name: "Sita Thapa", role: "Lead Student Success", initials: "ST" }
          ].map((member, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
              <div className="w-20 h-20 bg-orange-50 text-orange-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100 text-xl font-bold">
                {member.initials}
              </div>
              <h3 className="font-bold text-gray-950 text-lg">{member.name}</h3>
              <p className="text-orange-700 text-xs font-semibold mt-1 mb-3">{member.role}</p>
              <p className="text-gray-500 text-xs leading-relaxed">
                Dedicated to helping members of our community establish long-term success.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-950 text-white py-16 px-6 text-center w-full">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to start your journey?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto text-sm">
            Whether you want to learn new skills or give back to the next generation, MentorBee is the platform for you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/signup" className="bg-white text-gray-950 hover:bg-gray-100 font-bold px-8 py-3 rounded-xl transition-colors shadow-sm text-sm">
              Get Started as Student
            </a>
            <a href="/signup?role=mentor" className="bg-orange-700 hover:bg-orange-800 text-white font-bold px-8 py-3 rounded-xl border border-orange-600/30 transition-colors shadow-sm text-sm flex items-center gap-1.5">
              Become a Mentor <ChevronRight className="w-4 h-4" />
            </a>
          </div>
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
