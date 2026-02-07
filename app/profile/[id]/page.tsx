"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { Shield, Zap, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// Helpers
const getXpRequirement = (lvl: any) => {
    const level = Number(lvl) || 1;
    if (level < 10) return Math.max(10, level * 10);
    return 90 + ((level - 9) * 15);
};

const getLevelTitle = (lvl: any) => {
    const level = Number(lvl) || 1;
    if (level >= 50) return "Sacristan de la Peñada Real";
    if (level >= 40) return "Peñonrado";
    if (level >= 30) return "Cabo de la Peñiscola";
    if (level >= 20) return "Peñista Experimentado";
    if (level >= 10) return "Peñaprendiz";
    if (level >= 5) return "Blandengue de la Peñada";
    return "Recién Llegado";
};

export default function PublicProfilePage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [trophies, setTrophies] = useState<any[]>([]);
    const [achievements, setAchievements] = useState<any[]>([]);
    const [userUnlocks, setUserUnlocks] = useState<Set<string>>(new Set());
    const [collectibles, setCollectibles] = useState<any[]>([]);

    useEffect(() => {
        if (userId) {
            fetchProfileData();
        }
    }, [userId]);

    const fetchProfileData = async () => {
        try {
            // 1. Fetch Profile
            const { data: profileData, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();

            if (error || !profileData) {
                console.error("Error fetching profile", error);
                setLoading(false);
                return;
            }
            setProfile(profileData);

            // 2. Fetch Rewards Definitions
            const { data: rewards } = await supabase.from("reward_definitions").select("*");
            if (rewards) {
                setTrophies(rewards.filter(r => r.type === 'trophy'));
                setAchievements(rewards.filter(r => r.type === 'achievement'));
            }

            // 3. Fetch User Unlocks
            const { data: unlocks } = await supabase.from("user_rewards").select("reward_id").eq("user_id", userId);
            if (unlocks) {
                setUserUnlocks(new Set(unlocks.map((u: any) => u.reward_id)));
            }

            // 4. Fetch Collectibles
            const { data: inventory } = await supabase
                .from("user_inventory")
                .select(`
                    id,
                    store_items!inner(id, name, type, content, rarity, image_url)
                `)
                .eq("user_id", userId)
                .eq("store_items.type", "collectible");

            if (inventory) {
                // @ts-ignore
                setCollectibles(inventory.map((i: any) => i.store_items));
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-black">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c0ff00]"></div>
        </div>
    );

    if (!profile) return (
        <div className="flex h-screen items-center justify-center bg-black text-white flex-col gap-4">
            <h1 className="text-2xl font-bold text-red-500">Usuario no encontrado</h1>
            <button onClick={() => router.back()} className="text-gray-400 hover:text-white">Volver</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#000000] text-white pb-24">
            <Navbar />

            {/* Back Button */}
            <div className="fixed top-4 left-4 z-50">
                <button onClick={() => router.back()} className="bg-black/50 backdrop-blur p-2 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                    <ArrowLeft />
                </button>
            </div>

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
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        )}
                    </div>
                    {/* Level Badge */}
                    <div className="absolute -top-2 -right-8 bg-red-600 text-white font-bold px-3 py-1 text-xs rounded-full border-2 border-black rotate-12 z-0">
                        Nivel {profile?.level}
                    </div>
                </div>

                {/* Name & Title */}
                <div>
                    <h1 className="text-3xl font-graffiti text-white">{profile?.group_name}</h1>
                    <div className="bg-[#c0ff00]/10 text-[#c0ff00] text-xs font-bold px-2 py-0.5 rounded inline-block mb-1 border border-[#c0ff00]/20 uppercase tracking-wider">
                        {getLevelTitle(profile?.level || 1)}
                    </div>
                    <p className="text-gray-400 text-sm mt-1 max-w-xs">{profile?.description}</p>
                </div>

                {/* XP Bar (Read Only) */}
                <div className="mt-4 bg-[#1a1a1a] p-4 rounded-xl border border-white/5 relative overflow-hidden">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-white">Nivel {profile?.level || 1}</span>
                        <span className="text-xs text-gray-400 font-mono">
                            {profile?.xp || 0} / {getXpRequirement(profile?.level || 1)} XP
                        </span>
                    </div>
                    <div className="h-4 bg-black rounded-full overflow-hidden border border-white/10 relative">
                        <div
                            className="h-full bg-gradient-to-r from-[#c0ff00] to-green-400"
                            style={{ width: `${Math.min(100, ((profile?.xp || 0) / getXpRequirement(profile?.level || 1)) * 100)}%` }}
                        ></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-30"></div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                        <div className="bg-yellow-500/20 p-2 rounded-lg">
                            <Shield className="text-yellow-500" size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold font-mono">{profile?.coins || 0}</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Monedas</div>
                        </div>
                    </div>
                    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                        <div className="bg-purple-500/20 p-2 rounded-lg">
                            <Zap className="text-purple-500" size={20} />
                        </div>
                        <div>
                            <div className="text-xl font-bold font-mono text-white">Top 10%</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Ranking</div>
                        </div>
                    </div>
                </div>

                {/* FEATURED PHOTOS */}
                {profile?.featured_photos && profile.featured_photos.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm text-gray-400 font-bold mb-3 uppercase tracking-wider flex items-center gap-2">
                            📸 Destacadas
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {profile.featured_photos?.map((url: string, i: number) => (
                                <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden relative border border-white/10 bg-white/5">
                                    <img src={url} className="w-full h-full object-cover" alt="Featured" />
                                </div>
                            )) || <p className="col-span-3 text-gray-500 text-xs text-center py-4">No hay fotos destacadas.</p>}
                        </div>
                    </div>
                )}

                {/* TROPHIES */}
                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-500 font-graffiti text-2xl">
                        🏆 Trofeos <span className="text-xs font-mono text-gray-500 ml-2">({trophies.filter(t => userUnlocks.has(t.id)).length}/30)</span>
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                        {trophies.map((trophy) => {
                            const unlocked = userUnlocks.has(trophy.id);
                            return (
                                <div key={trophy.id} className={`aspect-square rounded-lg border flex items-center justify-center relative group ${unlocked ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-white/5 border-white/10 grayscale opacity-50'}`}>
                                    <span className="text-2xl">{trophy.icon}</span>
                                    {unlocked && <div className="absolute inset-0 bg-yellow-500/20 blur-xl"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ACHIEVEMENTS */}
                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-500 font-graffiti text-2xl">
                        ⭐ Logros <span className="text-xs font-mono text-gray-500 ml-2">({achievements.filter(a => userUnlocks.has(a.id)).length}/30)</span>
                    </h3>
                    <div className="space-y-2">
                        {achievements.map((achievement) => {
                            const unlocked = userUnlocks.has(achievement.id);
                            return (
                                <div key={achievement.id} className={`flex items-center gap-3 p-3 rounded-lg border ${unlocked ? 'bg-purple-500/10 border-purple-500/50' : 'bg-white/5 border-white/10 opacity-50'}`}>
                                    <div className={`w-10 h-10 rounded flex items-center justify-center text-xl ${unlocked ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-gray-500'}`}>
                                        {achievement.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`font-bold text-sm truncate ${unlocked ? 'text-white' : 'text-gray-500'}`}>{achievement.name}</div>
                                        <div className="text-xs text-gray-500 truncate">{achievement.description}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* COLLECTIBLES */}
            {collectibles.length > 0 && (
                <div className="mt-8 px-5">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-400 font-graffiti text-2xl">
                        💎 Coleccionables <span className="text-xs font-mono text-gray-500 ml-2">({collectibles.length})</span>
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                        {collectibles.map((item, i) => (
                            <div key={i} className={`aspect-square rounded-xl bg-gradient-to-br from-black to-slate-900 border border-white/10 flex items-center justify-center relative overflow-hidden group transition-colors`}>
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-20"></div>
                                {item.image_url ? (
                                    <div className="relative w-full h-full p-2">
                                        <img src={item.image_url} className="w-full h-full object-contain p-2" alt={item.name} />
                                    </div>
                                ) : (
                                    <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse">{item.content || '💎'}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Frames Section */}
            <div className="mt-8 px-5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    Marcos Desbloqueados
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
        </div>
    );
}
