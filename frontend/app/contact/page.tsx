"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !subject || !message) {
      setError("Please fill in all the fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Simulate form submission
    setSubmitted(true);
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

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
            <a href="/about" className="hover:text-orange-700 transition-colors">About</a>
            <a href="/contact" className="text-orange-700">Contact</a>
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
      <section className="bg-white border-b border-gray-100 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-orange-700 text-xs font-bold uppercase tracking-wider bg-orange-50 px-3 py-1.5 rounded-full">
            Contact Us
          </span>
          <h1 className="text-4xl font-extrabold text-gray-950 mt-4 mb-4">
            We'd Love to Hear From You
          </h1>
          <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            Have questions about MentorBee? Whether you are a student looking for a mentor, or an industry expert wanting to join us, our support team is ready to help.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto py-16 px-6 w-full flex-grow grid md:grid-cols-5 gap-12">
        {/* Left Column: Contact info */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-990 mb-2">Get in Touch</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Reach out via any of the options below, or fill out the form and we'll reply within 24 hours.
          </p>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 bg-orange-50 text-orange-700 rounded-lg flex items-center justify-center border border-orange-100">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-950 text-sm">Email Support</h3>
              <p className="text-gray-600 text-xs mt-1">support@mentorbee.com</p>
              <p className="text-gray-600 text-xs">info@mentorbee.com</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 bg-orange-50 text-orange-700 rounded-lg flex items-center justify-center border border-orange-100">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-950 text-sm">Call Us</h3>
              <p className="text-gray-600 text-xs mt-1">+977 1 4455667</p>
              <p className="text-gray-600 text-xs">+977 9801234567</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 bg-orange-50 text-orange-700 rounded-lg flex items-center justify-center border border-orange-100">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-950 text-sm">Office Location</h3>
              <p className="text-gray-600 text-xs mt-1">MentorBee HQ, Pulchowk</p>
              <p className="text-gray-600 text-xs">Lalitpur, Nepal</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 shrink-0 bg-orange-50 text-orange-700 rounded-lg flex items-center justify-center border border-orange-100">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-950 text-sm">Business Hours</h3>
              <p className="text-gray-600 text-xs mt-1">Sunday - Friday</p>
              <p className="text-gray-600 text-xs">9:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Form */}
        <div className="md:col-span-3">
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-950 mb-6">Send Us a Message</h2>

            {submitted ? (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-8 text-center space-y-4">
                <div className="w-14 h-14 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center mx-auto border border-orange-200">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-950">Thank You!</h3>
                <p className="text-gray-600 text-sm max-w-sm mx-auto">
                  Your message has been sent successfully. We will review your inquiry and get back to you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-orange-700 hover:bg-orange-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg p-3.5 font-medium">
                    {error}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-1.5">Your Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="How can we help you?"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5">Message</label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message details here..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50/50 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-orange-700 hover:bg-orange-800 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            )}
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
