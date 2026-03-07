"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { XCircle, Loader2, RefreshCcw, ArrowLeft } from "lucide-react";

function PaymentFailedContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        // Clear the pending booking from localStorage since it failed
        localStorage.removeItem("pending_booking");
        
        // Check if there's a specific message from eSewa (usually they just redirect to failure URL)
        const q = searchParams.get("q");
        if (q === "fu") {
            toast.error("Payment failed. Please try again.");
        } else {
            toast.error("Transaction was unsuccessful or cancelled.");
        }
    }, [searchParams]);

    return (
        <div className="max-w-md mx-auto mt-16 px-4">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center animate-in zoom-in-95 duration-500">
                <div className="py-8 space-y-6">
                    <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-100/50">
                        <XCircle className="w-12 h-12" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Failed</h2>
                        <p className="text-gray-500 font-medium">Your transaction could not be completed. Your session was not booked.</p>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-sm text-orange-800 text-left">
                        <p className="font-semibold mb-1">What can I do next?</p>
                        <ul className="list-disc pl-5 space-y-1 opacity-90">
                            <li>Try booking the session again.</li>
                            <li>Check your account balance or limits.</li>
                            <li>Contact support if the issue persists.</li>
                        </ul>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Go Back
                        </button>
                        <button
                            onClick={() => router.push("/home")}
                            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentFailedPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            </div>
        }>
            <PaymentFailedContent />
        </Suspense>
    );
}
