"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export default function VideoCallClient({ roomId, user }: { roomId: string, user: any }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const zpRef = useRef<any>(null);
    const socketRef = useRef<any>(null);
    const apiCalledRef = useRef(false);

    useEffect(() => {
        let active = true;

        if (!user || !containerRef.current || !roomId) return;

        // Initialize Socket.io
        const socket = io("http://localhost:5000", { withCredentials: true });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join_session", roomId);
        });

        socket.on("session_completed", () => {
            toast.success("Session finished!");
            setTimeout(() => {
                if (user.role === 'mentor') {
                    window.location.href = '/mentor/bookings';
                } else {
                    window.location.href = '/sessions';
                }
            }, 1500);
        });

        const myMeeting = async () => {
            const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID?.trim());
            const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET?.trim() || "";
            
            if (!appID || !serverSecret) {
                toast.error("Video call credentials not configured.");
                return;
            }

            try {
                const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
                
                if (!active || !containerRef.current) return;

                const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
                    appID,
                    serverSecret,
                    roomId,
                    user.id || Date.now().toString(),
                    user.name || "Guest User"
                );

                const zp = ZegoUIKitPrebuilt.create(kitToken);
                zpRef.current = zp;

                zp.joinRoom({
                    container: containerRef.current,
                    sharedLinks: [
                        {
                            name: 'Copy link',
                            url: window.location.protocol + '//' + window.location.host + window.location.pathname + '?roomID=' + roomId,
                        },
                    ],
                    scenario: {
                        mode: ZegoUIKitPrebuilt.OneONoneCall,
                    },
                    showPreJoinView: true,
                    onLeaveRoom: async () => {
                        // Notify the user they are leaving
                        toast.success("Leaving call...");
                        
                        // Small delay for the toast
                        await new Promise(resolve => setTimeout(resolve, 1000));

                        // Redirection back to dashboard/sessions
                        if (user.role === 'mentor') {
                            window.location.href = '/mentor/bookings';
                        } else {
                            window.location.href = '/sessions';
                        }
                    }
                });
                
            } catch (error) {
                console.error("ZegoCloud initialization error:", error);
            }
        };

        if (!zpRef.current) {
            myMeeting();
        }

        return () => {
            active = false;
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            if (zpRef.current) {
                try {
                    zpRef.current.destroy();
                } catch (e) {
                    console.warn("Zego destroy error:", e);
                }
                zpRef.current = null;
            }
        };
    }, [user, roomId]);

    return (
        <div className="w-full h-screen bg-black">
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
}
