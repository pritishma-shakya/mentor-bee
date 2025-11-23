// app/page.tsx (Next.js 13+)
"use client";

export default function Home() {
  return (
    <main className="bg-gray-50 text-gray-900">
      {/* Navbar */}
      <header className="bg-black text-white">
        <div className="max-w-6xl mx-auto flex justify-between items-center py-4 px-6">
          <h1 className="text-xl font-bold">MentorBee</h1>
          <nav className="hidden md:flex gap-6">
            <a href="#" className="hover:text-yellow-400">Home</a>
            <a href="#" className="hover:text-yellow-400">About</a>
            <a href="#" className="hover:text-yellow-400">Contact</a>
            <a href="#" className="hover:text-yellow-400">Find Mentor</a>
            <a href="#" className="hover:text-yellow-400">Become a Mentor</a>
          </nav>
          <div className="flex gap-2">
            <button><a href="/login"> Login </a></button>
            <button><a href ="/signup"> Signup </a></button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-black text-white py-20 text-center px-6">
        <h2 className="text-4xl font-bold mb-4">
          Unlock Your Potential. Find Your Perfect Mentor.
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-8">
          Whether you're looking to grow your career or share your expertise, MentorBee connects you with the right people.
        </p>
        <div className="flex justify-center gap-4 mb-10">
          <button>Find a Mentor</button>
          <button>Become a Mentor</button>
        </div>
        <div className="flex justify-center gap-12 text-gray-300 text-sm">
          <div><span className="text-white text-xl font-bold">500+</span><br/>Expert Mentors</div>
          <div><span className="text-white text-xl font-bold">10,000+</span><br/>Students</div>
          <div><span className="text-white text-xl font-bold">95%</span><br/>Success Rate</div>
        </div>
      </section>

      {/* Accelerate Your Growth */}
      <section className="max-w-6xl mx-auto py-20 px-6 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h3 className="text-3xl font-bold mb-4">Accelerate Your Growth</h3>
          <p className="text-gray-600 mb-6">
            Gain insights, guidance, and support from experienced professionals. Set clear goals, overcome challenges, and achieve your aspirations with personalized mentorship.
          </p>
          <ul className="space-y-4 text-gray-700 mb-6">
            <li>✔️ Browse Diverse Mentors – Filter by industry, expertise, and availability.</li>
            <li>✔️ Easy Booking & Scheduling – Book sessions directly through the platform.</li>
            <li>✔️ Personalized Guidance – Choose video call, chat, or in-person mentorship.</li>
          </ul>
          <button>Start your student journey</button>
        </div>
        <div className="w-full h-64 bg-gray-300 rounded-xl" />
      </section>

      {/* Share Your Expertise */}
      <section className="bg-gray-100 py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          <div className="w-full h-64 bg-gray-300 rounded-xl md:order-1 order-2" />
          <div className="order-1 md:order-2">
            <h3 className="text-3xl font-bold mb-4">Share Your Expertise. Make an Impact.</h3>
            <p className="text-gray-600 mb-6">
              Give back to the community, refine your leadership skills, and expand your professional network by guiding aspiring individuals. Set your own availability and pricing.
            </p>
            <ul className="space-y-4 text-gray-700 mb-6">
              <li>✔️ Expand Your Network – Connect with professionals and mentees.</li>
              <li>✔️ Build Your Reputation – Receive ratings and testimonials.</li>
              <li>✔️ Flexible Earning Potential – Set your own rates and schedule.</li>
            </ul>
            <button>Become a Mentor Today</button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white text-center">
        <h3 className="text-3xl font-bold mb-3">How It Works</h3>
        <p className="text-gray-600 mb-12">Get started with mentorship in four simple steps</p>

        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 px-6">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className="relative bg-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition"
            >
              {/* Placeholder for Image/Icon */}
              <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mt-6 mb-4" />

              {/* Step Title */}
              <h4 className="font-semibold text-lg mb-2">Find Your Mentor</h4>

              {/* Step Description */}
              <p className="text-gray-600 text-sm">
                Browse through our curated list of expert mentors and find the perfect
                match for your learning goals.
              </p>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}