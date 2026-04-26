"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { CheckCircle2, Loader2, CalendarClock, ArrowRight } from "lucide-react";

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const verifyAndBook = async () => {
            const dataParam = searchParams.get("data");

            if (!dataParam) {
                setStatus("error");
                setErrorMessage("Invalid payment response. Missing data payload.");
                return;
            }

            try {
                // Retrieve pending booking data
                const pendingBookingStr = localStorage.getItem("pending_booking");
                if (!pendingBookingStr) {
                    setStatus("error");
                    setErrorMessage("Payment verified, but booking details were lost. Please contact support.");
                    return;
                }

                const payload = JSON.parse(pendingBookingStr);
                payload.payment_status = "Paid"; // Force status to Paid on success

                // Decode eSewa base64 payload
                const decodedData = JSON.parse(atob(dataParam));

                if (decodedData.status !== "COMPLETE") {
                    setStatus("error");
                    setErrorMessage("Payment was not marked as complete by eSewa.");
                    return;
                }

                // Pass eSewa transaction details
                payload.transaction_uuid = decodedData.transaction_uuid || null;
                payload.total_amount = decodedData.total_amount
                    ? parseFloat(decodedData.total_amount)
                    : null;

                // Book the session
                const bookRes = await fetch("http://localhost:5000/api/sessions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(payload),
                });

                if (bookRes.ok) {
                    setStatus("success");
                    localStorage.removeItem("pending_booking");
                    toast.success("Session successfully booked!");
                } else {
                    const errorData = await bookRes.json();
                    setStatus("error");
                    setErrorMessage(errorData.message || "Payment verified, but failed to create session in database.");
                }

            } catch (err) {
                console.error("Verification error:", err);
                setStatus("error");
                setErrorMessage("An error occurred while verifying your payment.");
            }
        };

        verifyAndBook();
    }, [searchParams]);

    return (
        <div className="max-w-md mx-auto mt-16 px-4">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center animate-in zoom-in-95 duration-500">
                {status === "verifying" && (
                    <div className="py-8 space-y-4">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Verifying Payment...</h2>
                        <p className="text-gray-500">Please do not close this window.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="py-8 space-y-6">
                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100/50">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                            <p className="text-gray-500 font-medium">Your session has been securely booked.</p>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => router.push("/sessions")}
                                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
                            >
                                <CalendarClock className="w-5 h-5" />
                                View My Sessions
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="py-8 space-y-6">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">!</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                            <p className="text-red-500 font-medium text-sm px-4">{errorMessage}</p>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={() => router.push("/sessions")}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                                Go to Sessions
                            </button>
                            <button
                                onClick={() => router.push("/home")}
                                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
                            >
                                Find Mentors
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
}
