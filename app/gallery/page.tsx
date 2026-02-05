"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { Camera, Heart, MessageCircle, X } from "lucide-react";
import toast from "react-hot-toast";

type Post = {
    id: string;
    photo_url: string;
    caption: string;
    frame_style: string;
    created_at: string;
    profiles: {
        group_name: string;
        avatar_url: string;
    };
    gallery_likes: { user_id: string }[]; // Para contar y ver si di like
};

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function GalleryPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFrame, setSelectedFrame] = useState("basic");

    const frames = {
        basic: "border-0 shadow-none",
        gold: "border-4 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]",
        neon: "border-4 border-[#c0ff00] shadow-[0_0_15px_rgba(192,255,0,0.6)]",
        red: "border-4 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)]"
    };

    useEffect(() => {
        getCurrentUser();
        fetchPosts();

        // Realtime subscription (Optional enhancement)
        const channel = supabase
            .channel('gallery_posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_posts' }, () => {
                fetchPosts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, []);

    const getCurrentUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) setCurrentUser(session.user);
    };

    const fetchPosts = async () => {
        const { data, error } = await supabase
            .from("gallery_posts")
            .select(`
                *,
                profiles (group_name, avatar_url),
                gallery_likes (user_id)
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error(error);
            toast.error("Error cargando fotos");
        }
        if (data) setPosts(data as any);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !currentUser) {
            if (!currentUser) toast.error("Debes iniciar sesión");
            return;
        }
        setUploading(true);
        const file = e.target.files[0];

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${currentUser.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('gallery')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('gallery')
                .getPublicUrl(filePath);

            const { error: dbError } = await supabase
                .from("gallery_posts")
                .insert({
                    user_id: currentUser.id,
                    photo_url: publicUrl,
                    caption: "",
                    frame_style: selectedFrame
                });

            if (dbError) throw dbError;

            toast.success("Foto subida 📸");
            fetchPosts();

        } catch (error: any) {
            console.error(error);
            toast.error(`Error: ${error.message || "No se pudo subir"}`);
        } finally {
            setUploading(false);
        }
    };

    const toggleLike = async (postId: string, hasLiked: boolean) => {
        if (!currentUser) return;

        if (hasLiked) {
            await supabase.from("gallery_likes").delete().match({ post_id: postId, user_id: currentUser.id });
        } else {
            await supabase.from("gallery_likes").insert({ post_id: postId, user_id: currentUser.id });
        }
        fetchPosts();
    };

    return (
        <div className="min-h-screen bg-[#121212] pb-24 text-white">
            <Navbar />

            <div className="p-4 bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-20 flex justify-between items-center shadow-lg">
                <h1 className="text-xl font-bold font-graffiti tracking-wider">Galería <span className="text-[#c0ff00]">Real</span></h1>

                <div className="relative group">
                    <div className="absolute inset-0 bg-[#c0ff00] blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                        <button className="bg-[#c0ff00] text-black px-4 py-2 rounded-full text-sm font-black uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-transform active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                            {uploading ? <div className="animate-spin">⏳</div> : <Camera size={18} strokeWidth={2.5} />}
                            {uploading ? "Subiendo..." : "Subir Foto"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-8 p-4 max-w-lg mx-auto mt-4">
                {posts.length === 0 && (
                    <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-4 animate-in fade-in zoom-in">
                        <Camera size={48} className="opacity-50" />
                        <p className="text-lg">No hay fotos aún.</p>
                        <p className="text-sm">¡Sé el primero en hacer historia!</p>
                    </div>
                )}

                {posts.map((post) => {
                    const hasLiked = post.gallery_likes.some(l => l.user_id === currentUser?.id);
                    // @ts-ignore
                    const frameClass = frames[post.frame_style] || frames.basic;

                    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es });

                    return (
                        <div key={post.id} className="bg-[#1e1e1e] rounded-3xl overflow-hidden shadow-2xl border border-white/5 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Header: Author & Time */}
                            <div className="p-4 flex items-center justify-between bg-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#c0ff00]">
                                        <Image
                                            src={post.profiles.avatar_url || "https://via.placeholder.com/150"}
                                            alt={post.profiles.group_name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white text-sm tracking-wide">{post.profiles.group_name}</span>
                                        <span className="text-xs text-gray-400 font-medium capitalize">{timeAgo}</span>
                                    </div>
                                </div>
                                <button className="text-gray-500 hover:text-white transition-colors">
                                    <div className="w-1 h-1 bg-current rounded-full mx-0.5"></div>
                                    <div className="w-1 h-1 bg-current rounded-full mx-0.5"></div>
                                    <div className="w-1 h-1 bg-current rounded-full mx-0.5"></div>
                                </button>
                            </div>

                            {/* Image */}
                            <div className={`relative aspect-square w-full bg-black/50 ${frameClass} transition-all`}>
                                <Image
                                    src={post.photo_url}
                                    alt="Post"
                                    fill
                                    className="object-cover"
                                />
                            </div>

                            {/* Actions & Caption */}
                            <div className="p-4">
                                <div className="flex gap-6 mb-3">
                                    <button
                                        onClick={() => toggleLike(post.id, hasLiked)}
                                        className={`flex items-center gap-2 transition-all active:scale-90 group ${hasLiked ? "text-red-500" : "text-white"}`}
                                    >
                                        <Heart className={`${hasLiked ? "fill-current" : "group-hover:scale-110"} transition-transform`} size={28} strokeWidth={hasLiked ? 0 : 2} />
                                        <span className={`font-bold text-lg ${hasLiked ? "text-red-500" : "text-gray-400"}`}>{post.gallery_likes.length}</span>
                                    </button>
                                    <button className="text-white hover:text-[#c0ff00] transition-colors active:scale-95">
                                        <MessageCircle size={28} />
                                    </button>
                                </div>

                                {post.caption && (
                                    <p className="text-gray-300 text-sm">
                                        <span className="font-bold text-white mr-2">{post.profiles.group_name}</span>
                                        {post.caption}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
