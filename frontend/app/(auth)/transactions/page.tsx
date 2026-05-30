"use client";

import { useEffect, useState, Suspense } from "react";
import AuthLayout from "@/app/(auth)/layout";
import Pagination from "@/components/pagination";
import toast from "react-hot-toast";

interface Transaction {
  id: string;
  session_id: number;
  student_id: string;
  mentor_id: string;
  transaction_uuid: string | null;
  total_amount: string;
  admin_revenue: string;
  mentor_revenue: string;
  discount_amount: string;
  promo_code_id: string | null;
  created_at: string;
  course: string;
  mentor_name?: string;
  student_name?: string;
}

interface Refund {
  id: string;
  course: string;
  mentor_name?: string;
  refund_amount: string;
  refund_percentage: number;
  status: string;
  created_at: string;
  processed_at?: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor" | "admin";
}

function TransactionsContent() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [activeTab, setActiveTab] = useState<"payments" | "refunds">("payments");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const [paymentsRes, refundsRes] = await Promise.all([
          fetch("http://localhost:5000/api/payment/history", { credentials: "include" }),
          fetch("http://localhost:5000/api/refunds/history", { credentials: "include" }),
        ]);

        if (!paymentsRes.ok) throw new Error("Failed to fetch transactions");

        const paymentsData = await paymentsRes.json();
        setTransactions(paymentsData);

        if (refundsRes.ok) {
          const refundsData = await refundsRes.json();
          setRefunds(refundsData.data || []);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const activeItems = activeTab === "payments" ? transactions : refunds;
  const totalPages = Math.ceil(activeItems.length / itemsPerPage);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const paginatedRefunds = refunds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-1 space-y-6 min-h-[calc(100vh-80px)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Paid</p>
          <h3 className="text-2xl font-black text-gray-900">
            Rs. {transactions.reduce((acc, t) => acc + parseFloat(t.total_amount), 0).toLocaleString()}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Savings</p>
          <h3 className="text-2xl font-black text-orange-600">
            Rs. {transactions.reduce((acc, t) => acc + parseFloat(t.discount_amount), 0).toLocaleString()}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Count</p>
          <h3 className="text-2xl font-black text-gray-900">{transactions.length}</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 bg-gray-50/50 p-2">
          <button
            onClick={() => {
              setActiveTab("payments");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${activeTab === "payments" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          >
            Payments
          </button>
          <button
            onClick={() => {
              setActiveTab("refunds");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${activeTab === "refunds" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          >
            Refunds
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === "payments" ? (
            <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Session Details</th>
                <th className="px-6 py-4 text-center">Method</th>
                <th className="px-6 py-4 text-center">Amount</th>
                <th className="px-6 py-4 text-center">Discount</th>
                <th className="px-6 py-4 text-center">Date</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
              ) : paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-base">{t.course}</span>
                        <span className="text-xs text-gray-500 mt-0.5">
                          {t.mentor_name ? `Mentor: ${t.mentor_name}` : ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {t.transaction_uuid ? "eSewa" : parseFloat(t.total_amount) === 0 ? "Promo Full" : "Cash"}
                    </td>
                    <td className="px-6 py-4 text-center font-black text-gray-900">
                      Rs. {parseFloat(t.total_amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {parseFloat(t.discount_amount) > 0 ? (
                        <span className="text-orange-600 font-bold">
                          - Rs. {parseFloat(t.discount_amount).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-tighter">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Session</th>
                  <th className="px-6 py-4 text-center">Policy</th>
                  <th className="px-6 py-4 text-center">Refund Amount</th>
                  <th className="px-6 py-4 text-center">Date</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
                ) : paginatedRefunds.length > 0 ? (
                  paginatedRefunds.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-base">{r.course}</span>
                          <span className="text-xs text-gray-500 mt-0.5">{r.mentor_name ? `Mentor: ${r.mentor_name}` : ""}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium">{r.refund_percentage}%</td>
                      <td className="px-6 py-4 text-center font-black text-gray-900">Rs. {Number(r.refund_amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-center text-gray-600">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter border ${r.status === "processed" ? "bg-green-50 text-green-700 border-green-200" : r.status === "not_eligible" ? "bg-gray-50 text-gray-600 border-gray-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>
                          {r.status.replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No refunds found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50/20">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/auth/profile", { credentials: "include" })
      .then(res => res.json())
      .then(data => setUser(data.user))
      .catch(console.error);
  }, []);

  if (user && user.role !== "student") {
    return (
      <AuthLayout header={{ title: "Access Denied", user }}>
        <div className="p-12 text-center">
          <p className="text-gray-500 font-medium">This page is only accessible to students.</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      header={{
        title: "Transaction History",
        subtitle: "Review your recent payments and savings",
        user
      }}
    >
      <Suspense fallback={<p className="p-6 text-sm text-gray-500">Loading your history...</p>}>
        <TransactionsContent />
      </Suspense>
    </AuthLayout>
  );
}
