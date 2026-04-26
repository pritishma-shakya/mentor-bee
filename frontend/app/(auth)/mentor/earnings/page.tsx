"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/pagination";
import AuthLayout from "../../layout";
import { toast } from "react-hot-toast";
import { DollarSign, TrendingUp, ArrowRight } from "lucide-react";

interface Transaction {
  id: string;
  transaction_uuid: string;
  total_amount: string;
  mentor_revenue: string;
  created_at: string;
  student_name: string;
}

interface EarningsData {
  totalRevenue: number;
  totalPayments: number;
  monthlyEarnings: { month: string; revenue: string }[];
  transactions: Transaction[];
}

export default function MentorEarningsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/mentors/earnings", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setEarnings(data.data);
        } else {
          toast.error("Failed to load earnings");
        }
      } catch (err) {
        toast.error("Failed to load earnings.");
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);


  const totalPages = Math.ceil((earnings?.transactions || []).length / ITEMS_PER_PAGE);
  const paginatedData = (earnings?.transactions || []).slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
    <AuthLayout header={{ title: "My Earnings", subtitle: "Track your revenue and payments" }}>
      <div className="p-4 space-y-5">

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Earnings</p>
            </div>
            <p className="text-3xl font-black text-gray-900">
              Rs. {earnings ? earnings.totalRevenue.toFixed(2) : "--"}
            </p>
            <p className="text-xs text-gray-400 mt-1">From all eSewa online payments</p>
          </div>

          <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Paid Sessions</p>
            </div>
            <p className="text-3xl font-black text-gray-900">
              {earnings ? earnings.totalPayments : "--"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Sessions completed with online payment</p>
          </div>
        </div>

        {/* Monthly Breakdown */}
        {earnings && earnings.monthlyEarnings.length > 0 && (
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Monthly Earnings (Last 6 Months)</h2>
            <div className="space-y-3">
              {earnings.monthlyEarnings.map((m, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600 font-medium">{m.month}</span>
                  <span className="text-sm font-bold text-green-600">Rs. {parseFloat(m.revenue).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900">Transaction History</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Session Amount</th>
                  <th className="px-6 py-4">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">Loading transactions...</td></tr>
                ) : !earnings || earnings.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="w-8 h-8 text-gray-300" />
                        <p className="text-gray-400 font-medium">No transactions yet</p>
                        <p className="text-xs text-gray-400">Earnings will appear once students pay via eSewa</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString()}
                        <div className="text-xs text-gray-400">{new Date(t.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{t.student_name}</td>
                      <td className="px-6 py-4 text-gray-700">Rs. {parseFloat(t.total_amount).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-green-600">Rs. {parseFloat(t.mentor_revenue).toFixed(2)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ArrowRight className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Revenue Split Policy</p>
              <p className="text-xs text-blue-600 mt-1">
                For every eSewa online payment, you receive <strong>80%</strong> of the session fee.
                The remaining <strong>20%</strong> goes to MentorBee as a platform fee.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </AuthLayout>
  );
}
