"use client";

import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { Crown, Menu, User, Settings, LogOut } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import Image from "next/image";

export default function Home() {
    const { theme } = useTheme();
    const router = useRouter(); // Added router
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };
    const [recentPosts, setRecentPosts] = useState<any[]>([]);
    const [userName, setUserName] = useState("Amigo");

    const [spot, setSpot] = useState<any>(null);
    const [isHighlighted, setIsHighlighted] = useState(false);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            window.location.href = "/"; // Force reload/redirect to landing
            return;
        }
        fetchRecentPosts();
        getUserName();
        fetchSpot();
    }, []);

    const getUserName = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase.from('profiles').select('group_name').eq('id', session.user.id).single();
            if (data) setUserName(data.group_name);
        }
    };

    const fetchSpot = async () => {
        // 1. Buscar pin destacado activo
        const { data: highlighted } = await supabase
            .from("map_pins")
            .select("*")
            .gt('highlighted_until', new Date().toISOString())
            .order('highlighted_until', { ascending: false })
            .limit(1)
            .single();

        if (highlighted) {
            setSpot(highlighted);
            setIsHighlighted(true);
            return;
        }

        // 2. Si no, random
        const { data } = await supabase.from("map_pins").select("*");
        if (data && data.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.length);
            setSpot(data[randomIndex]);
            setIsHighlighted(false);
        }
    };

    const fetchRecentPosts = async () => {
        const { data } = await supabase
            .from("gallery_posts")
            .select("photo_url, id")
            .order("created_at", { ascending: false })
            .limit(4);

        if (data) setRecentPosts(data);
    };

    return (
        <div
            className="pb-24 min-h-screen bg-fixed bg-cover bg-center transition-all duration-500"
            style={{
                backgroundImage: theme.backgrounds.home
                    ? `url('${theme.backgrounds.home}')`
                    : "url('https://images.unsplash.com/photo-1512354739413-1b45788c6b9e?q=80&w=1000&auto=format&fit=crop')"
            }}
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Menú Desplegable Overlay */}
            {showMenu && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl p-6 flex flex-col justify-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={() => setShowMenu(false)} className="absolute top-6 right-6 text-white p-2">
                        ✕ CERRAR
                    </button>

                    <h2 className="text-4xl font-graffiti text-primary text-center mb-8 rotate-[-3deg]">Menú</h2>

                    <Link href="/profile" onClick={() => setShowMenu(false)}>
                        <div className="bg-white/10 p-4 rounded-xl flex items-center gap-4 text-white hover:bg-primary hover:text-black transition-all transform hover:scale-105">
                            <User className="w-8 h-8" />
                            <span className="font-urban text-xl font-bold">Ver Perfil</span>
                        </div>
                    </Link>

                    <Link href="/gallery" onClick={() => setShowMenu(false)}>
                        <div className="bg-white/10 p-4 rounded-xl flex items-center gap-4 text-white hover:bg-white/20 transition-all text-left">
                            <span className="text-2xl">📸</span>
                            <span className="font-urban text-xl font-bold">Galería Real</span>
                        </div>
                    </Link>

                    <button onClick={() => alert("Próximamente: Conectar Google")} className="bg-white/10 p-4 rounded-xl flex items-center gap-4 text-white hover:bg-white/20 transition-all text-left">
                        <span className="text-2xl">⚡</span>
                        <span className="font-urban text-xl font-bold">Iniciar con Google</span>
                    </button>

                    <Link href="/admin" onClick={() => setShowMenu(false)}>
                        <div className="bg-white/5 p-4 rounded-xl flex items-center gap-4 text-gray-500 hover:text-white transition-colors">
                            <Settings className="w-8 h-8" />
                            <span className="font-urban text-xl font-bold">Configuración (Admin)</span>
                        </div>
                    </Link>

                    <button onClick={handleLogout} className="bg-red-500/10 p-4 rounded-xl flex items-center gap-4 text-red-500 hover:bg-red-500/20 transition-colors mt-auto">
                        <LogOut className="w-8 h-8" />
                        <span className="font-urban text-xl font-bold">Cerrar Sesión</span>
                    </button>
                </div>
            )}

            <div className="relative z-10 p-6 space-y-8">
                {/* Header */}
                <header className="flex justify-between items-center bg-[#1a1a1a]/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-[#c0ff00]">
                            <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
                        </div>
                        <div>
                            <h1 className="text-xl font-graffiti text-white leading-none">La Peñada</h1>
                            <p className="text-gray-400 text-xs font-urban">Hola, <span className="text-[#c0ff00] font-bold">{userName}</span></p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowMenu(true)}
                        className="bg-white/10 p-2 rounded-full border border-white/20 text-white hover:bg-white/20 hover:scale-110 transition-all"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                {/* Spot Card (Prioritized or Random) */}
                {spot ? (
                    <Link href="/map" className="block mt-12"> {/* Added margin-top (mt-12) */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className={`sticker-btn w-full !rotate-1 flex flex-col items-start gap-1 cursor-pointer hover:scale-[1.02] transition-transform ${isHighlighted ? '!bg-red-600 text-white border-4 border-white shadow-[0_0_20px_red]' : '!bg-accent text-black'}`}
                        >
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isHighlighted ? 'bg-white text-red-600 animate-pulse' : 'bg-black text-white'}`}>
                                {isHighlighted ? '🔥 LIADA EN CURSO' : '¿DÓNDE VAMOS?'}
                            </span>
                            <h2 className="text-2xl font-black uppercase truncate w-full">{spot.title}</h2>
                            <div className="flex justify-between w-full font-urban text-sm font-bold mt-1">
                                <span>👤 {spot.author}</span>
                                <span>{isHighlighted ? '🚨 ÚNETE AHORA' : '🗺️ Ir al Mapa'}</span>
                            </div>
                        </motion.div>
                    </Link>
                ) : (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="sticker-btn w-full !rotate-1 !bg-gray-800 text-white flex flex-col items-start gap-1 mt-12" // Added margin-top here too
                    >
                        <span className="text-xs font-bold bg-black text-white px-2 py-0.5 rounded-full">SIN PLANES</span>
                        <h2 className="text-xl font-bold uppercase">Añade sitios al mapa</h2>
                        <div className="flex justify-between w-full font-urban text-sm font-bold mt-1">
                            <span>Ve a la sección Mapa 🗺️</span>
                        </div>
                    </motion.div>
                )}

                {/* Feed Rápido */}
                <div className="space-y-4">
                    <h3 className="font-urban text-sm font-bold text-gray-400 uppercase tracking-widest">Últimas Fotos</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {recentPosts.length > 0 ? (
                            recentPosts.map((post) => (
                                <Link href="/gallery" key={post.id}>
                                    <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden border border-white/10 relative group">
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
                                        <Image src={post.photo_url} alt="Foto reciente" fill className="object-cover" />
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="text-xs text-gray-500 col-span-2 text-center py-4">Sin fotos aún. ¡Sube la primera!</p>
                        )}
                    </div>
                </div>
            </div>

            <Navbar />
        </div>
    );
}
