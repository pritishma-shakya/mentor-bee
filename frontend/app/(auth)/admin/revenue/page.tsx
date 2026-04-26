"use client";

import { useEffect, useState } from "react";
import Pagination from "@/components/pagination";
import AuthLayout from "../../layout"; 
import { toast } from "react-hot-toast";

interface Transaction {
  id: string;
  transaction_uuid: string;
  total_amount: string;
  admin_revenue: string;
  mentor_revenue: string;
  created_at: string;
  student_name: string;
  mentor_name: string;
}

export default function RevenuePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/auth/profile", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUser(data.user);
      })
      .catch(err => console.error(err));

    const fetchTransactions = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/transactions", { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setTransactions(data.data);
          const total = data.data.reduce((sum: number, t: Transaction) => sum + parseFloat(t.admin_revenue), 0);
          setTotalRevenue(total);
        }
      } catch (err) {
        toast.error("Failed to load transactions.");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);


  const totalPages = Math.ceil((transactions || []).length / ITEMS_PER_PAGE);
  const paginatedData = (transactions || []).slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
    <AuthLayout header={{ title: "Manage Revenue", subtitle: "View platform earnings and transactions", user }}>
      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="bg-white rounded-xl shadow border border-gray-100 p-6 flex-1 text-center">
            <h3 className="text-gray-500 text-sm font-medium">Total Platform Revenue </h3>
            <p className="text-3xl font-black text-orange-600 mt-2">Rs. {totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Mentor</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Admin </th>
                  <th className="px-6 py-4">Mentor </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Loading transactions...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No transactions found.</td></tr>
                ) : (
                  paginatedData.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString()}
                        <div className="text-xs text-gray-400">{new Date(t.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{t.student_name}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{t.mentor_name}</td>
                      <td className="px-6 py-4">Rs. {parseFloat(t.total_amount).toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold text-orange-600">Rs. {parseFloat(t.admin_revenue).toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold text-green-600">Rs. {parseFloat(t.mentor_revenue).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </AuthLayout>
  );
}