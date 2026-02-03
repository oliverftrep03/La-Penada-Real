"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { Send, User } from "lucide-react";
import Navbar from "@/components/Navbar";

type Message = {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles?: {
        group_name: string;
        avatar_url: string;
    };
};

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [currentUser, setCurrentUser] = useState<any>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getCurrentUser();
        fetchMessages();

        const channel = supabase
            .channel('public:chat_messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    // Fetch the complete message with profile data because the payload only has the raw insert
                    fetchSingleMessage(payload.new.id);
                })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getCurrentUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setCurrentUser(session.user);
        }
    };

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from("chat_messages")
            .select(`
                id, content, created_at, user_id,
                profiles (group_name, avatar_url)
            `)
            .order("created_at", { ascending: true });

        if (data) {
            setMessages(data as any);
        }
    };

    const fetchSingleMessage = async (id: string) => {
        const { data } = await supabase
            .from("chat_messages")
            .select(`
                id, content, created_at, user_id,
                profiles (group_name, avatar_url)
            `)
            .eq("id", id)
            .single();

        if (data) {
            setMessages((prev) => [...prev, data as any]);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        const content = newMessage;
        setNewMessage(""); // Optimistic clear

        await supabase.from("chat_messages").insert({
            content,
            user_id: currentUser.id
        });
    };

    return (
        <div className="flex flex-col h-screen bg-[#121212] pb-20">
            <Navbar />

            {/* Header */}
            <div className="p-4 bg-black/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-10">
                <h1 className="text-xl font-bold text-white font-graffiti text-center">
                    Chat Real <span className="text-[#c0ff00]">💬</span>
                </h1>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                    const isMe = msg.user_id === currentUser?.id;
                    const avatar = msg.profiles?.avatar_url || null;
                    const name = msg.profiles?.group_name || "Anónimo";

                    return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
                            {!isMe && (
                                <div className="flex-shrink-0 mt-1">
                                    {avatar ? (
                                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
                                            <Image src={avatar} alt={name} fill className="object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={`max-w-[75%] space-y-1 ${isMe ? "items-end flex flex-col" : ""}`}>
                                {!isMe && <span className="text-xs text-gray-400 ml-1">{name}</span>}
                                <div
                                    className={`
                                        p-3 rounded-2xl text-sm break-words
                                        ${isMe
                                            ? "bg-[#c0ff00] text-black rounded-tr-none font-medium"
                                            : "bg-[#2a2a2a] text-white rounded-tl-none border border-white/10"
                                        }
                                    `}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 bg-black border-t border-white/10 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe algo..."
                    className="flex-1 bg-[#1a1a1a] text-white rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#c0ff00] transition-all"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-[#c0ff00] text-black p-3 rounded-full hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    <Send className="w-5 h-5 ml-0.5" />
                </button>
            </form>
        </div>
    );
}
