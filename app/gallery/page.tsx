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
    }, []);

    const getCurrentUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) setCurrentUser(session.user);
    };

    const fetchPosts = async () => {
        const { data } = await supabase
            .from("gallery_posts")
            .select(`
                *,
                profiles (group_name, avatar_url),
                gallery_likes (user_id)
            `)
            .order("created_at", { ascending: false });

        if (data) setPosts(data as any);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !currentUser) return;
        setUploading(true);
        const file = e.target.files[0];

        try {
            // 1. Subir imagen a Supabase Storage (bucket 'gallery')
            // NOTA: Asumimos que el bucket 'gallery' existe y es público.
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

            // 2. Crear registro en base de datos
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

        } catch (error) {
            console.error(error);
            toast.error("Error al subir (¿Bucket creado?)");
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
        fetchPosts(); // Refresh visual
    };

    return (
        <div className="min-h-screen bg-[#121212] pb-24 text-white">
            <Navbar />

            <div className="p-4 bg-black/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-10 flex justify-between items-center">
                <h1 className="text-xl font-bold font-graffiti">Galería <span className="text-[#c0ff00]">Real</span></h1>

                <div className="relative">
                    <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                    <button className="bg-[#c0ff00] text-black px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2">
                        {uploading ? "Subiendo..." : <><Camera size={16} /> Subir</>}
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-8 p-4 max-w-md mx-auto">
                {posts.map((post) => {
                    const hasLiked = post.gallery_likes.some(l => l.user_id === currentUser?.id);
                    // @ts-ignore
                    const frameClass = frames[post.frame_style] || frames.basic;

                    return (
                        <div key={post.id} className="bg-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                            {/* Header */}
                            <div className="p-3 flex items-center gap-3">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
                                    <Image
                                        src={post.profiles.avatar_url || "https://via.placeholder.com/150"}
                                        alt={post.profiles.group_name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <span className="font-bold text-sm tracking-wide">{post.profiles.group_name}</span>
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

                            {/* Actions */}
                            <div className="p-3 flex gap-4">
                                <button
                                    onClick={() => toggleLike(post.id, hasLiked)}
                                    className={`flex items-center gap-1.5 transition-all active:scale-90 ${hasLiked ? "text-red-500" : "text-white"}`}
                                >
                                    <Heart className={hasLiked ? "fill-current" : ""} size={24} />
                                    <span className="font-bold text-sm">{post.gallery_likes.length}</span>
                                </button>
                                <button className="text-white hover:text-gray-300">
                                    <MessageCircle size={24} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
