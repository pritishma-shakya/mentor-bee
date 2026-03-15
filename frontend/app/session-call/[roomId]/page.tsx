"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";

const VideoCallClient = dynamic(() => import("./VideoCallClient"), {
    ssr: false,
    loading: () => <div className="min-h-screen flex items-center justify-center text-white bg-black">Loading Video Call...</div>
});

export default function VideoCallRoom() {
    const { roomId } = useParams() as { roomId: string };
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/auth/profile", {
                    credentials: "include",
                });
                if (!res.ok) throw new Error("Failed to fetch user");
                const data = await res.json();
                setUser(data.user);
            } catch (err) {
                console.error(err);
                toast.error("Please log in to join the call.");
                router.push("/login");
            }
        };
        fetchUser();
    }, [router]);

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading User Profile...</div>;
    }

    return (
        <>
            <VideoCallClient roomId={roomId} user={user} />
            <Toaster position="top-center" />
        </>
    );
}
