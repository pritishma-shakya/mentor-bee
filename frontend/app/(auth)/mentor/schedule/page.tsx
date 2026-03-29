"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToSessions() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/mentor/bookings?tab=Schedule");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Redirecting to updated Schedule manager...</p>
            </div>
        </div>
    );
}
