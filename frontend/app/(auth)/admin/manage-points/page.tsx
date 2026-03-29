import { useEffect, useState } from "react";
import AuthLayout from "../../layout"; // adjust path if needed

export default function ManagePointsPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/auth/profile", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUser(data.user);
      })
      .catch(err => console.error("Failed to fetch profile:", err));
  }, []);

  return (
    <AuthLayout
      header={{
        title: "Manage Points",
        subtitle: "Admin panel to manage user points",
        user
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
