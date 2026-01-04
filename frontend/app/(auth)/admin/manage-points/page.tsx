"use client";

import AuthLayout from "../../layout"; // adjust path if needed

export default function ManagePointsPage() {
  return (
    <AuthLayout
      header={{
        title: "Manage Points",
        subtitle: "Admin panel to manage user points",
      }}
    >
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Manage Points (Admin)</h1>
        {/* Your page content here */}
        <p className="text-gray-600 text-sm">
          Use this page to adjust points for students or mentors.
        </p>
      </div>
    </AuthLayout>
  );
}
