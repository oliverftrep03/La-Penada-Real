"use client";

import Navbar from "@/components/Navbar";
import { Send } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Message {
    id: number;
    content: string;
    sender: string; // Apodo
    created_at: string;
}

import { useTheme } from "@/components/ThemeProvider";

export default function Chat() {
    const { theme } = useTheme();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [currentUser, setCurrentUser] = useState("Anónimo");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Cargar usuario y mensajes viejos al inicio
    useEffect(() => {
        const user = localStorage.getItem("penada_user");
        if (user) setCurrentUser(user);

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: true });

            if (data) setMessages(data as any);
        };

        fetchMessages();

        // 2. Suscribirse a nuevos mensajes en tiempo real
        const channel = supabase
            .channel('chat_room')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const newMsg = payload.new as Message;
                setMessages((prev) => [...prev, newMsg]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Scroll automático abajo
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        // Enviar a Supabase
        const { error } = await supabase
            .from('messages')
            .insert([
                { content: newMessage, sender: currentUser }
            ]);

        if (!error) {
            setNewMessage("");
        } else {
            console.error("Error enviando:", error);
        }
    };

    return (
        <div
            className="flex flex-col min-h-screen bg-black pb-20 bg-cover bg-center transition-all duration-500"
            style={{
                backgroundImage: theme.backgrounds.chat ? `url('${theme.backgrounds.chat}')` : undefined
            }}
        >
            {/* Overlay oscuro para leer bien */}
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />

            <header className="fixed top-0 w-full z-10 p-4 bg-black/80 backdrop-blur-md border-b border-white/10 flex justify-between items-center">
                <h1 className="text-2xl font-graffiti text-secondary">Chat General</h1>
                <span className="text-xs text-gray-400 font-urban">Tu: {currentUser}</span>
            </header>

            <div className="flex-1 overflow-y-auto p-4 pt-20 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        <p>Nadie ha hablado aún... 🦗</p>
                        <p className="text-sm">¡Sé el primero!</p>
                    </div>
                )}

                {messages.map((msg) => {
                    const isMe = msg.sender === currentUser;
                    return (
                        <div key={msg.id} className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
                            <span className="text-[10px] text-gray-500 mb-1 px-2 uppercase tracking-wide">{msg.sender}</span>
                            <div className={`max-w-[80%] p-3 rounded-2xl break-words ${isMe
                                ? "bg-primary text-black rounded-tr-none"
                                : "bg-gray-800 text-white rounded-tl-none border border-white/10"
                                }`}>
                                <p className="font-urban text-sm">{msg.content}</p>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="fixed bottom-24 left-0 right-0 px-4">
                <div className="flex gap-2 max-w-sm mx-auto">
                    <input
                        type="text"
                        placeholder="Escribe algo..."
                        className="flex-1 bg-gray-900 border border-white/20 rounded-full px-4 py-3 text-white focus:outline-none focus:border-primary font-urban"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        className="bg-primary p-3 rounded-full text-black hover:scale-105 transition-transform"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <Navbar />
        </div>
    );
}
