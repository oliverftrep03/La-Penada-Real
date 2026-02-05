"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { Edit2, LogOut, Shield, Zap, X } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ProfilePage() {
    const router = useRouter();
    const [rewards, setRewards] = useState<any[]>([]);
    const [userUnlocks, setUserUnlocks] = useState<Set<string>>(new Set());
    const [collectibles, setCollectibles] = useState<any[]>([]); // New state
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
        fetchRewards();
        fetchCollectibles();
    }, []);

    const fetchCollectibles = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase
                .from("user_inventory")
                .select(`
                    id,
                    store_items!inner(id, name, type, content, rarity)
                `)
                .eq("user_id", session.user.id)
                .eq("store_items.type", "collectible");

            if (data) {
                setCollectibles(data.map((i: any) => i.store_items));
            }
        }
    };

    const fetchRewards = async () => {
        const { data: defs } = await supabase.from("reward_definitions").select("*").order("slot_index");
        if (defs) setRewards(defs);

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: unlocks } = await supabase.from("user_rewards").select("reward_id").eq("user_id", session.user.id);
            if (unlocks) {
                setUserUnlocks(new Set(unlocks.map(u => u.reward_id)));
            }
        }
    };

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

    const trophies = rewards.filter(r => r.type === 'trophy');
    const achievements = rewards.filter(r => r.type === 'achievement');

    const [editing, setEditing] = useState(false);
    const [myPhotos, setMyPhotos] = useState<any[]>([]);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        if (profile?.featured_photos) {
            setSelectedPhotos(profile.featured_photos);
        }
    }, [profile]);

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
            const fileName = `${profile.id}/avatar_${Math.random()}`;
            await supabase.storage.from('avatars').upload(fileName, file);
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

            await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id);
            setProfile({ ...profile, avatar_url: publicUrl });
            toast.success("Avatar actualizado");
        } catch (e) { console.error(e); toast.error("Error al subir avatar"); }
        finally { setUploadingAvatar(false); }
    };

    const saveProfile = async () => {
        const { error } = await supabase.from("profiles").update({ featured_photos: selectedPhotos }).eq("id", profile.id);
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

            {/* Edit Modal */}
            {editing && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] w-full max-w-lg rounded-2xl border border-white/10 p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold font-graffiti text-[#c0ff00]">Editar Perfil</h2>
                            <button onClick={() => setEditing(false)}><X /></button>
                        </div>

                        <div className="space-y-6">
                            {/* Avatar */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Foto de Perfil</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-800 overflow-hidden relative border border-white/20">
                                        {profile?.avatar_url && <Image src={profile.avatar_url} fill className="object-cover" alt="Avatar" />}
                                    </div>
                                    <label className="bg-white/10 px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-white/20 transition-colors">
                                        {uploadingAvatar ? "Subiendo..." : "Cambiar Foto"}
                                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                                    </label>
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
                                            <Image src={photo.photo_url} fill className="object-cover" alt="Thumb" />
                                            {selectedPhotos.includes(photo.photo_url) && (
                                                <div className="absolute top-1 right-1 w-4 h-4 bg-[#c0ff00] rounded-full flex items-center justify-center text-black text-[10px] font-bold">✓</div>
                                            )}
                                        </div>
                                    ))}
                                    {myPhotos.length === 0 && <p className="col-span-3 text-center text-gray-500 text-xs py-4">Sube fotos a la galería para destacarlas aquí.</p>}
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
                            <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" />
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
                            <div className="text-2xl font-bold font-mono">{profile?.xp || 0}</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Puntos XP</div>
                        </div>
                    </div>
                    <div className="bg-[#1a1a1a] p-4 rounded-xl border border-white/5 flex items-center gap-3">
                        <div className="bg-yellow-500/20 p-2 rounded-lg">
                            <Shield className="text-yellow-500" size={20} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold font-mono">{profile?.coins || 0}</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Monedas</div>
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
                            {profile.featured_photos.map((url: string, i: number) => (
                                <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden relative border border-white/10 bg-white/5">
                                    <Image src={url} fill className="object-cover" alt="Featured" />
                                </div>
                            ))}
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
