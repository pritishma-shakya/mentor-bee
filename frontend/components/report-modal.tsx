"use client";

import { useState } from "react";
import { AlertCircle, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  evidenceUrl?: string;
}

const REASONS = [
  "Inappropriate Behavior",
  "Harassment",
  "Spam / Advertising",
  "No-show for session",
  "Other"
];

export function ReportModal({ isOpen, onClose, reportedUserId, reportedUserName, evidenceUrl }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason for reporting");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reported_user_id: reportedUserId,
          reason,
          description,
          evidence_url: evidenceUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit report");
      }

      toast.success("Report submitted successfully.");
      setReason("");
      setDescription("");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50/30">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="font-bold text-sm">Report User</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            You are reporting <span className="font-bold text-gray-900">{reportedUserName}</span>.
            Please select a reason below to help our moderators review this incident.
          </p>

          {/* Quick Select Reason Badges */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider">
              Reason
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REASONS.map((r) => {
                const isSelected = reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      isSelected
                        ? "bg-red-50 border-red-500 text-red-700 shadow-sm"
                        : "bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Details */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              placeholder="Provide any details to help us investigate..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition h-20 resize-none placeholder:text-gray-400 text-gray-900"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !reason}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Submitting
                </>
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
