"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { Edit2, LogOut, Shield, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push("/");
            return;
        }

        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

        setProfile(data);
        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-[#000000] text-white pb-24">
            <Navbar />

            {/* Cover */}
            <div className="h-40 w-full bg-gradient-to-r from-[#c0ff00]/20 via-[#c0ff00]/5 to-black relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
            </div>

            {/* Profile Info */}
            <div className="px-5 -mt-16 flex flex-col gap-4">

                {/* Avatar Badge */}
                <div className="relative self-start">
                    <div className="w-32 h-32 rounded-full border-4 border-black bg-gray-800 relative z-10 overflow-hidden shadow-[0_0_20px_rgba(192,255,0,0.3)]">
                        {profile?.avatar_url && (
                            <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" />
                        )}
                    </div>
                    <button className="absolute bottom-1 right-1 z-20 bg-[#c0ff00] text-black p-2 rounded-full border-4 border-black shadow-lg">
                        <Edit2 size={16} />
                    </button>
                    {/* Level Badge */}
                    <div className="absolute -top-2 -right-8 bg-red-600 text-white font-bold px-3 py-1 text-xs rounded-full border-2 border-black rotate-12 z-0">
                        Nivel {profile?.level}
                    </div>
                </div>

                {/* Name & Bio */}
                <div>
                    <h1 className="text-3xl font-graffiti text-white">{profile?.group_name}</h1>
                    <p className="text-gray-400 text-sm mt-1 max-w-xs">{profile?.description}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                        <div className="bg-[#c0ff00]/20 p-2 rounded-lg">
                            <Zap className="text-[#c0ff00]" size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold font-mono">{profile?.xp}</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Puntos XP</div>
                        </div>
                    </div>
                    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                        <div className="bg-yellow-500/20 p-2 rounded-lg">
                            <Shield className="text-yellow-500" size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold font-mono">{profile?.coins}</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Monedas</div>
                        </div>
                    </div>
                </div>

                {/* Frames Section */}
                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        Marcos Desbloqueados <span className="text-[#c0ff00] text-xs px-2 py-0.5 border border-[#c0ff00] rounded ml-auto">Tienda</span>
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                        {(profile?.frames_unlocked || ['basic']).map((frame: string) => (
                            <div key={frame} className="flex flex-col items-center gap-2 min-w-[80px]">
                                <div className={`w-16 h-16 bg-gray-800 rounded-lg ${frame === 'neon' ? 'border-2 border-[#c0ff00] shadow-[0_0_10px_#c0ff00]' : ''}`}></div>
                                <span className="text-xs text-gray-500 capitalize">{frame}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <button
                        onClick={handleLogout}
                        className="text-red-500 flex items-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity"
                    >
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>

            </div>
        </div>
    );
}
