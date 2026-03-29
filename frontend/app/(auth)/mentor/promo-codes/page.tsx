"use client";

import { useEffect, useState } from "react";
import AuthLayout from "../../layout";
import { toast } from "react-hot-toast";
import { Tag, Plus, Calendar, Percent, Hash, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { getTimeRemaining } from "../../../../utils/dateUtils";

interface PromoCode {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: string;
    status: 'pending' | 'approved' | 'rejected';
    expiry_date: string | null;
    usage_limit: number | null;
    usage_count: number;
    description: string | null;
    is_active: boolean;
    created_at: string;
}

export default function MentorPromoCodesPage() {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state
    const [newCode, setNewCode] = useState("");
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [usageLimit, setUsageLimit] = useState("");
    const [description, setDescription] = useState("");

    const fetchPromoCodes = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/promo-codes", {
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                setPromoCodes(data.promoCodes);
            }
        } catch (err) {
            toast.error("Failed to load promo codes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromoCodes();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode || !discountValue) return toast.error("Please fill required fields");

        const val = parseFloat(discountValue);
        if (isNaN(val) || val <= 0) return toast.error("Discount value must be positive");
        if (discountType === 'percentage' && val > 20) return toast.error("Percentage cannot exceed 20%");
        if (discountType === 'fixed' && val > 250) return toast.error("Fixed amount cannot exceed Rs. 250");

        try {
            const res = await fetch("http://localhost:5000/api/promo-codes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: newCode,
                    discount_type: discountType,
                    discount_value: discountValue,
                    expiry_date: expiryDate || null,
                    usage_limit: usageLimit ? parseInt(usageLimit) : null,
                    description: description || null
                }),
                credentials: "include",
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Promo code proposal sent!");
                setShowCreateModal(false);
                setNewCode("");
                setDiscountValue("");
                setExpiryDate("");
                setUsageLimit("");
                setDescription("");
                fetchPromoCodes();
            } else {
                toast.error(data.message || "Failed to create promo code");
            }
        } catch (err) {
            toast.error("Network error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this promo code?")) return;

        try {
            const res = await fetch(`http://localhost:5000/api/promo-codes/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Promo code deleted");
                fetchPromoCodes();
            } else {
                toast.error(data.message || "Failed to delete");
            }
        } catch (err) {
            toast.error("Network error");
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-yellow-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: any = {
            approved: "bg-green-50 text-green-700 border-green-200",
            rejected: "bg-red-50 text-red-700 border-red-200",
            pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <AuthLayout header={{ title: "Promo Codes", subtitle: "Create and manage discounts for your sessions" }}>
            <div className="p-4 space-y-6">

                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Your Promo Codes</h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create New Code
                    </button>
                </div>

                {/* Promo Codes Table */}
                <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Code</th>
                                    <th className="px-6 py-4">Discount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Usage</th>
                                    <th className="px-6 py-4">Expires</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">Loading codes...</td></tr>
                                ) : promoCodes.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Tag className="w-8 h-8 text-gray-300" />
                                                <p className="text-gray-400 font-medium">No promo codes yet</p>
                                                <p className="text-xs text-gray-400">Create one to offer discounts to your students</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    promoCodes.map((pc) => (
                                        <tr key={pc.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-gray-900 px-2 py-1">
                                                    {pc.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {pc.discount_type === 'percentage' ? `${pc.discount_value}%` : `Rs. ${pc.discount_value}`}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(pc.status)}
                                                    {getStatusBadge(pc.status)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-400 font-medium">{pc.usage_count}</span>
                                                {pc.usage_limit && <span className="text-gray-400 text-xs ml-1">/ {pc.usage_limit}</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 font-medium">
                                                        {pc.expiry_date ? new Date(pc.expiry_date).toLocaleDateString() : "Never"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(pc.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Promo Code"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Create Promo Code</h3>
                                <p className="text-sm text-gray-500 mb-6">Mentors' codes require admin approval before being active.</p>

                                <form onSubmit={handleCreate} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Promo Code</label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500/60" />
                                            <input
                                                type="text"
                                                value={newCode}
                                                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none font-black tracking-widest text-gray-900 placeholder:text-gray-500 placeholder:font-normal placeholder:tracking-normal"
                                                placeholder="e.g. SAVE50"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Discount Type</label>
                                            <select
                                                value={discountType}
                                                onChange={(e) => setDiscountType(e.target.value as any)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none text-gray-900"
                                            >
                                                <option value="percentage">Percentage (%)</option>
                                                <option value="fixed">Fixed Amount (Rs.)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Value</label>
                                            <div className="relative">
                                                {discountType === 'percentage' ? <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500/60" /> : <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500/60" />}
                                                <input
                                                    type="number"
                                                    value={discountValue}
                                                    onChange={(e) => setDiscountValue(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none font-bold text-gray-900 placeholder:text-gray-500"
                                                    placeholder="0"
                                                    min="1"
                                                    max={discountType === 'percentage' ? "20" : "250"}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 ml-1">Expiry</label>
                                            <input
                                                type="date"
                                                value={expiryDate}
                                                onChange={(e) => setExpiryDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none text-gray-900"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2 ml-1">Limit</label>
                                            <input
                                                type="number"
                                                value={usageLimit}
                                                onChange={(e) => setUsageLimit(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none text-gray-900 placeholder:text-gray-500"
                                                placeholder="∞"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2 ml-1">Description</label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none text-gray-900 placeholder:text-gray-500 resize-none"
                                            placeholder="Show students what this code is for..."
                                            rows={2}
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition shadow-sm"
                                        >
                                            Create Code
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}
