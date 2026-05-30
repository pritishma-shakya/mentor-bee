import Logo from "@/components/logo";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl md:p-10">
        <Logo width={72} height={72} />

        <h1 className="mt-6 text-3xl font-bold text-gray-900">Terms and Conditions</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: May 29, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-gray-700">
          <section>
            <h2 className="text-base font-bold text-gray-900">Account Responsibility</h2>
            <p className="mt-2">
              You are responsible for keeping your account information accurate and protecting your login details. You agree not to impersonate others or use MentorBee for misleading, harmful, or unlawful activity.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900">Community Conduct</h2>
            <p className="mt-2">
              Students and mentors must communicate respectfully. Harassment, spam, abusive behavior, fraud, or content that violates community safety rules may lead to warnings, suspension, or a permanent ban.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900">Bookings and Payments</h2>
            <p className="mt-2">
              Session bookings, cancellations, payments, refunds, and rescheduling must follow the policies shown in the platform. Mentors are expected to provide accurate availability and session information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900">Profile and Content</h2>
            <p className="mt-2">
              You are responsible for posts, messages, profile details, documents, and other content you submit. MentorBee may remove content or restrict visibility when it violates safety, trust, or platform policies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900">Platform Safety</h2>
            <p className="mt-2">
              MentorBee may review reports and take action to protect users, including hiding suspended or banned accounts, posts, profiles, and conversations from the platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900">Changes to These Terms</h2>
            <p className="mt-2">
              We may update these terms as MentorBee grows. Continued use of the platform after updates means you accept the revised terms.
            </p>
          </section>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <a href="/signup" className="text-sm font-semibold text-orange-600 hover:underline">
            Back to signup
          </a>
        </div>
      </div>
    </main>
  );
}
