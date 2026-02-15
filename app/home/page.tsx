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

            {/* Menú Desplegable Overlay - STITCH STYLE */}
            {showMenu && (
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] opacity-20 bg-cover bg-center"></div>

                    <button onClick={() => setShowMenu(false)} className="absolute top-8 right-8 text-white font-graffiti text-xl hover:text-primary transition-colors flex items-center gap-2 z-50">
                        <span className="text-3xl">✕</span> CERRAR
                    </button>

                    <h2 className="text-6xl font-graffiti text-cyan-400 text-center mb-12 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] -rotate-3 tracking-widest relative z-10">
                        MENÚ
                    </h2>

                    <div className="flex flex-col gap-4 w-full max-w-sm relative z-10">
                        <Link href="/profile" onClick={() => setShowMenu(false)}>
                            <div className="bg-metal p-5 rounded-sm flex items-center gap-4 text-white hover:scale-105 transition-all shadow-[0_5px_0_#999] active:shadow-none active:translate-y-1 relative overflow-hidden group">
                                <User className="w-6 h-6 text-primary group-hover:animate-bounce" />
                                <span className="font-graffiti text-2xl tracking-wide">Ver Perfil</span>
                            </div>
                        </Link>

                        <Link href="/gallery" onClick={() => setShowMenu(false)}>
                            <div className="bg-metal p-5 rounded-sm flex items-center gap-4 text-white hover:scale-105 transition-all shadow-[0_5px_0_#999] active:shadow-none active:translate-y-1 group">
                                <span className="text-2xl group-hover:rotate-12 transition-transform">📸</span>
                                <span className="font-graffiti text-2xl tracking-wide">Galería Real</span>
                            </div>
                        </Link>

                        <button onClick={() => alert("Próximamente: Conectar Google")} className="bg-metal p-5 rounded-sm flex items-center gap-4 text-white hover:scale-105 transition-all shadow-[0_5px_0_#999] active:shadow-none active:translate-y-1 group">
                            <span className="text-2xl group-hover:text-yellow-400">⚡</span>
                            <span className="font-graffiti text-2xl tracking-wide">Iniciar con Google</span>
                        </button>

                        <Link href="/admin" onClick={() => setShowMenu(false)}>
                            <div className="bg-metal p-5 rounded-sm flex items-center gap-4 text-gray-400 hover:text-white hover:scale-105 transition-all shadow-[0_5px_0_#999] active:shadow-none active:translate-y-1">
                                <Settings className="w-6 h-6" />
                                <span className="font-graffiti text-xl tracking-wide">Configuración (Admin)</span>
                            </div>
                        </Link>

                        <div className="h-4"></div>

                        <button onClick={handleLogout} className="bg-gradient-to-r from-red-900 to-black border-2 border-red-600 p-4 rounded-sm flex items-center justify-center gap-4 text-red-500 hover:text-red-400 hover:border-red-400 hover:shadow-[0_0_20px_red] transition-all mt-4 group">
                            <LogOut className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-graffiti text-xl">Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="relative z-10 p-6 space-y-8">
                {/* Header */}
                {/* Header - STITCH STYLE */}
                <header className="flex justify-between items-center relative z-20">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-graffiti text-white drop-shadow-[0_2px_0_black] -rotate-2">
                            La <span className="text-white">Peñada</span>
                        </h1>
                    </div>
                    <button
                        onClick={() => setShowMenu(true)}
                        className="bg-white/10 p-3 rounded-lg border-2 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all backdrop-blur-md shadow-[4px_4px_0_black]"
                    >
                        <Menu className="w-8 h-8" strokeWidth={3} />
                    </button>
                </header>

                <div className="px-1">
                    <p className="text-gray-400 font-bold font-mono text-xs mb-[-10px] ml-1">Hola, {userName}</p>
                </div>

                {/* Spot Card (Prioritized or Random) - STITCH STYLE */}
                {spot ? (
                    <Link href="/map" className="block relative group">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#c0ff00]/80 rotate-[-1deg] z-20 shadow-sm"></div>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-black/10 rotate-[-1deg] z-20 animate-pulse mix-blend-overlay"></div>
                        <div className="absolute top-[-8px] text-xs font-black uppercase tracking-widest text-black z-30 left-1/2 -translate-x-1/2 -rotate-1">¿DÓNDE VAMOS?</div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className={`relative p-0 overflow-hidden transform rotate-1 transition-transform group-hover:scale-[1.01] group-hover:rotate-0 shadow-[0_10px_20px_rgba(0,0,0,0.5)]`}
                        >
                            {/* Paper Tear Effect Top */}
                            <div className="h-4 bg-transparent w-full relative z-10" style={{ backgroundImage: "linear-gradient(135deg, transparent 66%, #000 66%), linear-gradient(45deg, #000 33%, transparent 33%)", backgroundPosition: "top", backgroundSize: "10px 100%", backgroundRepeat: "repeat-x", marginTop: "-10px" }}></div>

                            <div className={`p-6 ${isHighlighted ? 'bg-gradient-to-br from-cyan-400 to-blue-500' : 'bg-white'} text-black min-h-[140px] flex flex-col justify-center items-center text-center border-l-4 border-r-4 border-white/50 clip-path-polygon relative`}>
                                <h2 className="text-3xl font-graffiti uppercase leading-none mb-2 drop-shadow-sm">{spot.title}</h2>

                                <div className="flex items-center gap-2 mt-2">
                                    <User size={14} />
                                    <span className="font-bold text-sm tracking-tighter">{spot.author}</span>
                                </div>

                                <div className="mt-4 bg-black text-white px-4 py-1 rounded-full font-bold text-xs uppercase flex items-center gap-2 hover:bg-white hover:text-black transition-colors border-2 border-black">
                                    <span className="animate-pulse">🗺️</span> Ir al Mapa
                                </div>
                            </div>

                            {/* Tear Bottom */}
                            <div className="h-3 w-full bg-cover relative z-10 -mt-1" style={{ background: "url('https://i.imgur.com/MoS1mE2.png')", opacity: 0.8 }}></div>
                        </motion.div>
                    </Link>
                ) : (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="p-6 bg-[#222] border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                        <h2 className="text-xl font-graffiti text-gray-400 uppercase relative z-10">Sin planes activos</h2>
                        <Link href="/map" className="relative z-10 text-[#c0ff00] font-bold text-sm underline decoration-wavy hover:text-white">Añadir sitio al mapa -&gt;</Link>
                    </motion.div>
                )}

                {/* Feed Rápido - STITCH STYLE - Paint Drips & Graffiti */}
                <div className="space-y-4 pt-4 border-t-2 border-white/5 relative">
                    <h3 className="font-graffiti text-2xl text-black relative z-10 inline-block">
                        <span className="absolute inset-0 bg-[#c0ff00] skew-y-1 block -z-10 blur-sm scale-110"></span>
                        <span className="relative px-2">ÚLTIMAS FOTOS</span>
                    </h3>

                    <div className="grid grid-cols-2 gap-4 auto-rows-fr">
                        {recentPosts.length > 0 ? (
                            recentPosts.map((post, index) => (
                                <Link href="/gallery" key={post.id} className={`${index % 2 === 0 ? 'rotate-[-2deg] mt-2' : 'rotate-[2deg]'}`}>
                                    <div className="bg-white p-2 pb-8 shadow-[0_5px_15px_rgba(0,0,0,0.5)] relative transition-transform hover:scale-105 hover:z-20 group">
                                        {/* TAPE */}
                                        <div className="tape"></div>

                                        <div className="aspect-square bg-gray-200 overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-500">
                                            <Image src={post.photo_url} alt="Foto reciente" fill className="object-cover" />
                                        </div>
                                        <div className="absolute bottom-2 right-3 font-graffiti text-black text-xs opacity-50">#real</div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-2 border-2 border-dashed border-white/10 p-8 rounded-xl text-center">
                                <p className="text-sm text-gray-500 font-bold">Sin fotos recientes</p>
                                <Link href="/gallery" className="text-primary text-xs underline mt-2 block">Sube una ahora</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Navbar />
        </div>
    );
}
