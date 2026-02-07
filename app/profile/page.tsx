"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { Edit2, LogOut, Shield, Zap, X } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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

export default function ProfilePage() {
    const router = useRouter();
    const [rewards, setRewards] = useState<any[]>([]);
    const [userUnlocks, setUserUnlocks] = useState<Set<string>>(new Set());
    const [collectibles, setCollectibles] = useState<any[]>([]); // New state
    const [profile, setProfile] = useState<any>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [selectedTrophy, setSelectedTrophy] = useState<any>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("ProfilePage: Mounted");
        if (!isSupabaseConfigured) {
            console.warn("ProfilePage: Supabase not configured");
            window.location.href = "/";
            return;
        }

        // Execute fetches safely
        const loadData = async () => {
            console.log("ProfilePage: Starting loadData...");
            try {
                await fetchProfile(); // Critical
                console.log("ProfilePage: fetchProfile completed");
            } catch (err) {
                console.error("ProfilePage: fetchProfile FAILED", err);
            }

            // Secondary data (don't block UI)
            fetchRewards().catch(e => console.warn("Failed to load rewards", e));
            fetchCollectibles().catch(e => console.warn("Failed to load collectibles", e));
        };

        loadData();
    }, []);

    const fetchCollectibles = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data, error } = await supabase
                    .from("user_inventory")
                    .select(`
                        id,
                        store_items!inner(id, name, type, content, rarity, image_url)
                    `)
                    .eq("user_id", session.user.id)
                    .eq("store_items.type", "collectible");

                if (error) throw error;
                if (data) {
                    // Filter out any null store_items or items causing render issues
                    const safeItems = data
                        .map((i: any) => i.store_items)
                        .filter((item: any) => item && item.name);
                    setCollectibles(safeItems);
                }
            }
        } catch (e) {
            console.warn("Collectibles Fetch Error (Ignored):", e);
            setCollectibles([]); // Ensure array
        }
    };

    const fetchRewards = async () => {
        try {
            // Safe fetch definitions
            const { data: defs, error: defsError } = await supabase.from("reward_definitions").select("*").order("slot_index");
            if (!defsError && defs) {
                setRewards(defs);
            } else {
                setRewards([]); // Fallback
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: unlocks, error: unlocksError } = await supabase.from("user_rewards").select("reward_id").eq("user_id", session.user.id);
                if (!unlocksError && unlocks) {
                    setUserUnlocks(new Set(unlocks.map((u: any) => u.reward_id)));
                }
            }
        } catch (e) {
            console.warn("Rewards Fetch Error (Ignored):", e);
            setRewards([]);
        }
    };

    const fetchProfile = async () => {
        try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                console.log("No session found in profile page.");
                router.push("/");
                return;
            }

            let { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

            // Auto-create/Fix profile if missing
            if (!data) {
                console.log("Profile missing, creating default...");
                const defaultProfile = {
                    id: session.user.id,
                    group_name: session.user.email?.split('@')[0] || "Nuevo Miembro",
                    description: "Miembro de La Peñada Real",
                    level: 1,
                    coins: 0,
                    xp: 0,
                    frames_unlocked: ["basic"],
                    current_frame: "basic",
                    avatar_url: ""
                };

                // Optimistic update
                data = defaultProfile;

                // Try to save to DB (Fire and forget to avoid blocking UI)
                await supabase.from("profiles").upsert(defaultProfile).then(({ error }: { error: any }) => {
                    if (error) console.error("Error creating default profile:", error);
                });
            }

            setProfile(data);
        } catch (e) {
            console.error("Critical Profile Error:", e);
            // Fallback purely client-side if everything fails
            setProfile({
                group_name: "Error User",
                description: "Modo offline",
                level: 1,
                coins: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const handleLinkGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
        if (error) toast.error("Error al vincular con Google");
    };

    const [editing, setEditing] = useState(false);
    const [myPhotos, setMyPhotos] = useState<any[]>([]);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    {/* Trophy Details Modal */ }
    {
        selectedTrophy && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#1e1e1e] w-full max-w-sm rounded-2xl border border-yellow-500/30 p-6 shadow-[0_0_30px_rgba(234,179,8,0.2)] animate-in zoom-in-50">
                    <div className="flex justify-end">
                        <button onClick={() => setSelectedTrophy(null)} className="text-gray-400 hover:text-white"><X /></button>
                    </div>
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="text-6xl animate-bounce">{selectedTrophy.icon}</div>
                        <div>
                            <h3 className="text-xl font-bold text-yellow-500 font-graffiti">{selectedTrophy.name}</h3>
                            <div className={`text-xs font-bold uppercase tracking-widest mt-1 px-2 py-0.5 rounded-full inline-block ${userUnlocks.has(selectedTrophy.id) ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-800 text-gray-500'}`}>
                                {userUnlocks.has(selectedTrophy.id) ? 'Desbloqueado' : 'Bloqueado'}
                            </div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {selectedTrophy.description || "Un misterioso trofeo esperando ser descubierto."}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    {/* ACHIEVEMENTS */ }
    {/* ... (keep achievements logic same, just context) ... */
        /* Actually, I am appending this at the end of content, wait. Replacing the Achievements section is easier if I include it or just insert before it  */
        /* Let me re-read the file content to place it correctly. I will insert state at top and modal at bottom. */
    }

    useEffect(() => {
        if (profile?.featured_photos) {
            setSelectedPhotos(profile.featured_photos);
        }
    }, [profile]);

    // Early return ONLY after all hooks
    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-black">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c0ff00]"></div>
        </div>
    );

    const trophies = rewards.filter(r => r.type === 'trophy');
    const achievements = rewards.filter(r => r.type === 'achievement');

    const handleEditOpen = async () => {
        setEditing(true);
        // Fetch user's gallery photos for selection
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase.from("gallery_posts").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false });
            if (data) setMyPhotos(data);
        }
    };

    const togglePhotoSelection = (url: string) => {
        if (selectedPhotos.includes(url)) {
            setSelectedPhotos(prev => prev.filter(p => p !== url));
        } else {
            if (selectedPhotos.length >= 3) return toast.error("Máximo 3 fotos destacadas");
            setSelectedPhotos(prev => [...prev, url]);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploadingAvatar(true);
        const file = e.target.files[0];
        try {
            const fileName = `avatars/${profile.id}/${Math.random()}`;
            await supabase.storage.from('gallery').upload(fileName, file);
            const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(fileName);

            await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id);
            setProfile({ ...profile, avatar_url: publicUrl });
            toast.success("Avatar actualizado");
        } catch (e) { console.error(e); toast.error("Error al subir avatar"); }
        finally { setUploadingAvatar(false); }
    };

    const saveProfile = async () => {
        const { error } = await supabase.from("profiles").update({
            featured_photos: selectedPhotos,
            description: profile.description
        }).eq("id", profile.id);
        if (error) toast.error("Error al guardar");
        else {
            toast.success("Perfil actualizado");
            setProfile({ ...profile, featured_photos: selectedPhotos });
            setEditing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#000000] text-white pb-24">
            <Navbar />

            {/* ERROR / LOADING STATE */}
            {(!profile && !loading) && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Error al cargar perfil</h2>
                    <p className="text-gray-400 mb-4">No se pudo encontrar tu información.</p>
                    <button onClick={() => window.location.reload()} className="bg-white/10 px-4 py-2 rounded-lg text-sm">Reintentar</button>
                </div>
            )}

            {/* Edit Modal */}
            {editing && profile && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] w-full max-w-lg rounded-2xl border border-white/10 p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold font-graffiti text-[#c0ff00]">Editar Perfil</h2>
                            <button onClick={() => setEditing(false)}><X /></button>
                        </div>

                        <div className="space-y-6">
                            {/* Avatar (Removed Upload Feature as requested) */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Foto de Perfil</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-800 overflow-hidden relative border border-white/20">
                                        {profile?.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            disabled={uploadingAvatar}
                                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#c0ff00] file:text-black hover:file:bg-[#b0e600]"
                                        />
                                        {uploadingAvatar && <p className="text-xs text-[#c0ff00] mt-1">Subiendo...</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Featured Photos */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Fotos Destacadas ({selectedPhotos.length}/3)</label>
                                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-black/20 rounded-lg border border-white/5">
                                    {myPhotos.map(photo => (
                                        <div
                                            key={photo.id}
                                            onClick={() => togglePhotoSelection(photo.photo_url)}
                                            className={`relative aspect-square cursor-pointer rounded-md overflow-hidden border-2 ${selectedPhotos.includes(photo.photo_url) ? 'border-[#c0ff00] opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                        >
                                            <img src={photo.photo_url} className="w-full h-full object-cover" alt="Thumb" />
                                            {selectedPhotos.includes(photo.photo_url) && (
                                                <div className="absolute top-1 right-1 w-4 h-4 bg-[#c0ff00] rounded-full flex items-center justify-center text-black text-[10px] font-bold">✓</div>
                                            )}
                                        </div>
                                    ))}
                                    {myPhotos.length === 0 && <p className="col-span-3 text-center text-gray-500 text-xs py-4">Sube fotos a la galería para destacarlas aquí.</p>}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Biografía</label>
                                <textarea
                                    value={profile.description || ""}
                                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white focus:border-[#c0ff00] outline-none resize-none h-24"
                                    placeholder="Cuéntanos algo sobre ti..."
                                    maxLength={150}
                                />
                                <div className="text-right text-xs text-gray-500 mt-1">
                                    {(profile.description || "").length}/150
                                </div>
                            </div>

                            <button onClick={saveProfile} className="w-full bg-[#c0ff00] text-black font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform">
                                GUARDAR CAMBIOS
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                    <button onClick={handleEditOpen} className="absolute bottom-1 right-1 z-20 bg-[#c0ff00] text-black p-2 rounded-full border-4 border-black shadow-lg hover:scale-110 transition-transform">
                        <Edit2 size={16} />
                    </button>
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

                {/* XP Bar */}
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
                        {/* Strips overlay */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-30"></div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 text-center">
                        Siguiente nivel: +20 monedas {((profile?.level || 1) + 1) % 5 === 0 && "& Cofre 🎁"}
                    </p>
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
                                <div
                                    key={trophy.id}
                                    onClick={() => setSelectedTrophy(trophy)}
                                    className={`aspect-square rounded-lg border flex items-center justify-center relative group cursor-pointer transition-transform hover:scale-105 ${unlocked ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-white/5 border-white/10 grayscale opacity-50'}`}
                                >
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
                                <div
                                    key={achievement.id}
                                    onClick={() => setSelectedTrophy(achievement)}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-transform hover:scale-[1.02] ${unlocked ? 'bg-purple-500/10 border-purple-500/50' : 'bg-white/5 border-white/10 opacity-50'}`}
                                >
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
                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-400 font-graffiti text-2xl">
                        💎 Coleccionables <span className="text-xs font-mono text-gray-500 ml-2">({collectibles.length})</span>
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                        {collectibles.map((item, i) => (
                            <div key={i} className={`aspect-square rounded-xl bg-gradient-to-br from-black to-slate-900 border border-white/10 flex items-center justify-center relative overflow-hidden group hover:border-cyan-400/50 transition-colors`}>
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-20"></div>
                                {item.image_url ? (
                                    <div className="relative w-full h-full p-2">
                                        <img src={item.image_url} className="w-full h-full object-contain p-2" alt={item.name} />
                                    </div>
                                ) : (
                                    <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse">{item.content || '💎'}</span>
                                )}
                                <div className="absolute bottom-1 text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 rounded text-cyan-400">{item.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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

            <div className="mt-8 flex flex-col gap-4 text-center">
                <button
                    onClick={handleLinkGoogle}
                    className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 mx-auto hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                    Vincular con Google
                </button>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Vincula tu cuenta para no perder tu progreso si cambias de móvil.
                </p>
                <button
                    onClick={handleLogout}
                    className="text-red-500 flex items-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity"
                >
                    <LogOut size={16} /> Cerrar Sesión
                </button>
            </div>

        </div>

    );
}
