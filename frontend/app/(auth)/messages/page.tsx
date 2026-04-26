"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Send, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import AuthLayout from "../layout";
import { Socket } from "socket.io-client";
import { useSocket } from "@/context/SocketContext";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender: "me" | "other";
  created_at: string;
  conversation_id?: string;
  is_read?: boolean;
}

interface Conversation {
  id: string;
  mentor_id: string;
  mentor_name: string;
  mentor_picture?: string;
  messages: Message[];
  last_message?: string;
  last_time?: string;
  unread_count?: number;
}

interface UserProps {
  id: string;
  name: string;
  email: string;
  role: "student" | "mentor" | "admin";
  profile_picture?: string;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const mentorIdParam = searchParams.get("mentorId");

  const [user, setUser] = useState<UserProps | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const selectedChatIdRef = useRef<string | null>(null);

  // Sync ref with state
  useEffect(() => {
    selectedChatIdRef.current = selectedChat?.id || null;
  }, [selectedChat?.id]);

  // Replace local effect with context sync
  const [localSocket, setLocalSocket] = useState<Socket | null>(null);
  
  useEffect(() => {
    if (socket) {
      setLocalSocket(socket);
      
      const receiveHandler = (msg: Message) => {
        const activeId = selectedChatIdRef.current;
        const isForActiveChat = activeId === msg.conversation_id;

        // Update selected chat if active
        if (isForActiveChat) {
          setSelectedChat((prev) => {
            if (prev && prev.id === msg.conversation_id) {
              const alreadyExists = prev.messages.some(m => m.id === msg.id);
              if (alreadyExists) return { ...prev, unread_count: 0 };
              return { ...prev, messages: [...(prev.messages || []), { ...msg, sender: msg.sender_id === user?.id ? "me" : "other" }], unread_count: 0 };
            }
            return prev;
          });
        }

        // Update sidebar
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === msg.conversation_id);
          if (!exists) {
            refreshConversations();
            return prev;
          }
          return prev.map((c) => {
            if (c.id === msg.conversation_id) {
              return {
                ...c,
                last_message: msg.content,
                last_time: msg.created_at,
                unread_count: isForActiveChat || msg.sender_id === user?.id ? 0 : (c.unread_count || 0) + 1
              };
            }
            return c;
          });
        });

        if (isForActiveChat && msg.sender_id !== user?.id) {
          socket.emit("mark_read", msg.conversation_id);
        }
      };

      socket.on("receive_message", receiveHandler);
      return () => {
        socket.off("receive_message", receiveHandler);
      };
    }
  }, [socket, user?.id]);

  // Join rooms when conversations are loaded
  useEffect(() => {
    if (socket && conversations.length > 0) {
      conversations.forEach((c) => {
        if (c.id) socket.emit("join_conversation", c.id);
      });
    }
  }, [socket, conversations.length]);

  const refreshConversations = async () => {
    try {
      const convRes = await fetch("http://localhost:5000/api/conversations", {
        credentials: "include",
      });
      const convData = await convRes.json();
      let convs: Conversation[] = convData.data || [];

      if (mentorIdParam) {
        let conv = convs.find((c) => c.mentor_id === mentorIdParam);
        if (!conv) {
          conv = {
            id: "",
            mentor_id: mentorIdParam,
            mentor_name: "Mentor",
            mentor_picture: "",
            messages: [],
          };
          convs = [conv, ...convs];
        }
        setSelectedChat(conv);
      }

      setConversations(convs);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load conversations");
    }
  };

  // Fetch user & initial conversations
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRes = await fetch("http://localhost:5000/api/auth/profile", {
          credentials: "include",
        });
        if (!userRes.ok) throw new Error("Unauthorized");
        const userData = await userRes.json();
        setUser(userData.user);
        await refreshConversations();
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [mentorIdParam]);

  // Load messages & mark as read
  useEffect(() => {
    if (!selectedChat?.id || !user) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/conversations/${selectedChat.id}/messages`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (data.success) {
          const msgs: Message[] = data.data.map((m: any) => ({
            id: m.id,
            content: m.content,
            sender_id: m.sender_id,
            sender: m.sender_id === user.id ? "me" : "other",
            created_at: m.created_at,
          }));
          setSelectedChat((prev) => (prev ? { ...prev, messages: msgs, unread_count: 0 } : null));
          
          // Mark as read via API for reliability
          fetch(`http://localhost:5000/api/conversations/${selectedChat.id}/read`, {
            method: "PATCH",
            credentials: "include",
          }).catch(console.error);

          // Also keep socket for real-time synchronization if needed
          socket?.emit("mark_read", selectedChat.id);
          
          setConversations(prev => prev.map(c => c.id === selectedChat.id ? { ...c, unread_count: 0 } : c));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
  }, [selectedChat?.id, user?.id, socket]);

  // Smart auto-scroll
  useEffect(() => {
    if (!chatContainerRef.current) return;

    const container = chatContainerRef.current;
    const scrollThreshold = 50; // px

    // Only scroll if user is near bottom
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < scrollThreshold;

    if (isAtBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [selectedChat?.messages]);

  // Send message
  const sendMessageHandler = async () => {
    if (!messageInput.trim() || !user || !selectedChat || !socket) return;

    try {
      const isNew = !selectedChat.id;
      const endpoint = isNew
        ? "http://localhost:5000/api/conversations/messages"
        : `http://localhost:5000/api/conversations/${selectedChat.id}/messages`;

      const body = isNew
        ? { content: messageInput.trim(), mentor_id: selectedChat.mentor_id }
        : { content: messageInput.trim() };

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Send failed");

      const newMsg: Message = {
        id: data.data.id,
        content: data.data.content,
        sender_id: user.id,
        sender: "me",
        created_at: data.data.created_at,
      };

      // update local state instantly for better UX
      if (isNew) {
        const newConv: Conversation = {
          ...selectedChat,
          id: data.data.conversation_id,
          messages: [newMsg],
          unread_count: 0
        };
        setSelectedChat(newConv);
        setConversations((prev) => [newConv, ...prev.filter(c => c.mentor_id !== selectedChat.mentor_id)]);
        
        // Join the new room
        socket.emit("join_conversation", data.data.conversation_id);
      } else {
        setSelectedChat((prev) => {
            if (!prev || prev.id !== selectedChat.id) return prev;
            if (prev.messages.some(m => m.id === newMsg.id)) return prev;
            return { ...prev, messages: [...(prev.messages || []), newMsg], unread_count: 0 };
        });
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedChat.id ? { ...c, last_message: newMsg.content, last_time: newMsg.created_at, unread_count: 0 } : c))
        );
        
        // Also ensure server knows it's read
        socket?.emit("mark_read", selectedChat.id);
      }

      setMessageInput("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  }

  return (
    <AuthLayout
      header={{
        title: "Messages",
        subtitle: "Chat with mentors & peers in real time",
        user,
      }}
    >
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden h-[calc(100vh-140px)] flex">
        {/* Left panel */}
        <div className="w-full lg:w-80 border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm">No conversations yet</div>
            ) : (
              conversations.map((chat) => {
                const lastMsg = chat.messages?.[chat.messages.length - 1];
                const preview = lastMsg
                  ? lastMsg.sender === "me"
                    ? `You: ${lastMsg.content}`
                    : lastMsg.content
                  : chat.last_message || "Start chatting • Say hi!";
                const time = lastMsg?.created_at || chat.last_time;
                const timeDisplay = time
                  ? new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : null;

                return (
                  <div
                    key={chat.id || chat.mentor_id}
                    onClick={() => {
                      setSelectedChat({ ...chat, unread_count: 0 });
                      if (chat.id) {
                        setConversations(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c));
                        socket?.emit("mark_read", chat.id);
                      }
                    }}
                    className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition ${selectedChat?.mentor_id === chat.mentor_id
                      ? "bg-orange-50 border-l-4 border-orange-500"
                      : ""
                      }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden shrink-0">
                      {chat.mentor_picture ? (
                        <img src={chat.mentor_picture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-orange-600 font-bold text-lg">
                          {chat.mentor_name?.[0]?.toUpperCase() ?? "?"}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-medium truncate text-gray-900">{chat.mentor_name || "Unknown"}</p>
                        {timeDisplay && <span className="text-xs text-gray-500 whitespace-nowrap">{timeDisplay}</span>}
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className={`text-sm truncate flex-1 ${chat.unread_count ? "text-gray-900 font-semibold" : "text-gray-500"}`}>
                          {preview}
                        </p>
                        {chat.unread_count ? (
                          <span className="ml-2 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                            {chat.unread_count}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                  {selectedChat.mentor_picture ? (
                    <img src={selectedChat.mentor_picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-orange-600 font-bold text-lg">
                      {selectedChat.mentor_name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-gray-900">{selectedChat.mentor_name || "Unknown"}</p>
              </div>

              {/* Chat messages */}
              <div
                className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3"
                ref={chatContainerRef}
              >
                {selectedChat.messages?.length ? (
                  selectedChat.messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${msg.sender === "me"
                          ? "bg-orange-500 text-white rounded-br-none"
                          : "bg-white text-gray-900 rounded-bl-none border border-gray-200"
                          }`}
                      >
                        {msg.content}
                        <p className="text-[10px] mt-1 text-right opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm text-center mt-20">
                    No messages yet — start the conversation!
                  </p>
                )}
              </div>

              {/* Input box */}
              <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessageHandler()}
                  placeholder="Type your message..."
                  className="flex-1 px-5 py-3 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800 text-sm"
                />
                <button
                  onClick={sendMessageHandler}
                  disabled={!messageInput.trim()}
                  className={`p-3 rounded-full transition ${messageInput.trim()
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
              <p className="text-lg font-medium">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center p-10"><p>Loading messages...</p></div>}>
      <MessagesContent />
    </Suspense>
  );
}

// Helper to get cookie
function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
  return null;
}
