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
    const [myFrames, setMyFrames] = useState<any[]>([{ id: 'basic', name: 'Básico', content: 'border-0' }]);

    // Comment System State
    const [activePostId, setActivePostId] = useState<string | null>(null); // Modal open
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");

    const frames: any = {
        basic: "border-0 shadow-none",
        gold: "border-4 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]",
        neon: "border-4 border-[#c0ff00] shadow-[0_0_15px_rgba(192,255,0,0.6)]",
        red: "border-4 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)]"
    };

    useEffect(() => {
        getCurrentUser();
        fetchPosts();
        fetchMyFrames();
        // rt subscription...
        const channel = supabase
            .channel('gallery_posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_posts' }, () => fetchPosts())
            .subscribe();
        return () => { supabase.removeChannel(channel); }
    }, []);

    const fetchMyFrames = async () => { /* ... existing ... */
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        try {
            const { data } = await supabase.from("user_inventory").select(`item_id, store_items!inner(id, name, type, content)`).eq("user_id", session.user.id).eq("store_items.type", "frame");
            if (data) {
                const purchased = data.map((i: any) => i.store_items);
                setMyFrames([{ id: 'basic', name: 'Básico', content: 'border-0' }, ...purchased]);
            }
        } catch (e) { console.error(e); }
    };

    const getCurrentUser = async () => { /* ... existing ... */
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);
    };

    const fetchPosts = async () => { /* ... existing ... */
        try {
            const { data } = await supabase.from("gallery_posts").select(`*, profiles (group_name, avatar_url), gallery_likes (user_id)`).order("created_at", { ascending: false });
            if (data) setPosts(data);
        } catch (e) { console.error(e); }
    };

    const toggleLike = async (postId: string, hasLiked: boolean) => { /* ... existing ... */
        if (!currentUser) return toast.error("Inicia sesión");
        if (hasLiked) await supabase.from("gallery_likes").delete().eq("post_id", postId).eq("user_id", currentUser.id);
        else await supabase.from("gallery_likes").insert({ post_id: postId, user_id: currentUser.id });
        fetchPosts();
    };

    const deletePost = async (postId: string) => {
        if (!confirm("¿Borrar esta foto para siempre?")) return;
        const { error } = await supabase.from("gallery_posts").delete().eq("id", postId);
        if (error) toast.error("Error al borrar");
        else {
            toast.success("Foto eliminada");
            fetchPosts();
        }
    };

    const openComments = async (postId: string) => {
        setActivePostId(postId);
        const { data } = await supabase.from("gallery_comments")
            .select(`*, profiles(group_name, avatar_url)`)
            .eq("post_id", postId)
            .order("created_at", { ascending: true });
        if (data) setComments(data);
    };

    const sendComment = async () => {
        if (!newComment.trim() || !currentUser || !activePostId) return;
        const { error } = await supabase.from("gallery_comments").insert({
            post_id: activePostId,
            user_id: currentUser.id,
            content: newComment
        });
        if (error) toast.error("Error al comentar");
        else {
            setNewComment("");
            openComments(activePostId); // Refresh
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { /* ... existing ... */
        if (!e.target.files?.length || !currentUser) return toast.error("Error");
        setUploading(true);
        try {
            const file = e.target.files[0];
            const fileName = `${currentUser.id}/${Math.random()}.${file.name.split('.').pop()}`;
            await supabase.storage.from('gallery').upload(fileName, file);
            const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(fileName);
            const frameContent = myFrames.find(f => f.id === selectedFrame)?.content || "border-0";
            await supabase.from("gallery_posts").insert({ user_id: currentUser.id, photo_url: publicUrl, caption: "", frame_style: frameContent });
            await supabase.rpc('add_coins', { user_id: currentUser.id, amount: 10 });
            toast.success("+10 Monedas 🪙");
            fetchPosts();
        } catch (e) { console.error(e); toast.error("Error subiendo"); }
        finally { setUploading(false); }
    };

    return (
        <div className="min-h-screen bg-[#121212] pb-24 text-white">
            <Navbar />

            {/* ... Existing Header/Frame Selector ... */}
            <div className="p-4 bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-20 flex flex-col gap-4 shadow-lg">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold font-graffiti tracking-wider">Galería <span className="text-[#c0ff00]">Real</span></h1>
                    <div className="relative group">
                        <div className="relative">
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={handleUpload} disabled={uploading} />
                            <button className="bg-[#c0ff00] text-black px-4 py-2 rounded-full text-sm font-black uppercase tracking-wider flex items-center gap-2 hover:scale-105 transition-transform">
                                {uploading ? <div className="animate-spin">⏳</div> : <Camera size={18} />}
                                {uploading ? "Subiendo..." : "Subir Foto"}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="w-full overflow-x-auto scrollbar-hide flex gap-3 pb-2">
                    {myFrames.map(frame => (
                        <button key={frame.id} onClick={() => setSelectedFrame(frame.id)} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-lg border transition-all ${selectedFrame === frame.id ? "bg-white/10 border-[#c0ff00]" : "border-transparent opacity-50 hover:opacity-100"}`}>
                            <div className={`w-10 h-10 bg-gray-800 rounded-md ${frame.content}`}></div>
                            <span className="text-[10px] truncate max-w-full">{frame.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-8 p-4 max-w-lg mx-auto mt-4">
                {posts.map((post) => {
                    const hasLiked = post.gallery_likes?.some(l => l.user_id === currentUser?.id);
                    const isOwner = currentUser?.id === post.profiles?.id || currentUser?.id === post.user_id; // Check ownership logic later, need user_id in post
                    // ... frame logic ...
                    let frameClass = "border-0";
                    if (post.frame_style) {
                        // @ts-ignore
                        if (frames[post.frame_style]) frameClass = frames[post.frame_style];
                        else frameClass = post.frame_style;
                    }
                    const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es });
                    const avatarUrl = post.profiles?.avatar_url || "https://via.placeholder.com/150";
                    const groupName = post.profiles?.group_name || "Desconocido";

                    return (
                        <div key={post.id} className="bg-[#1e1e1e] rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative group">
                            {/* Delete Button (if owner) - Assuming we can check against current user */}
                            {/* Note: post.user_id might need to be selected specifically if not in * */}
                            <button className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500" onClick={() => deletePost(post.id)}>
                                <X size={16} />
                            </button>

                            <div className="p-4 flex items-center gap-3 bg-white/5">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#c0ff00]">
                                    <Image src={avatarUrl} alt={groupName} fill className="object-cover" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-white text-sm">{groupName}</span>
                                    <span className="text-xs text-gray-400 capitalize">{timeAgo}</span>
                                </div>
                            </div>

                            <div className={`relative aspect-square w-full bg-black/50 ${frameClass}`}>
                                <Image src={post.photo_url} alt="Post" fill className="object-cover" />
                            </div>

                            <div className="p-4">
                                <div className="flex gap-6 mb-3">
                                    <button onClick={() => toggleLike(post.id, hasLiked || false)} className={`flex items-center gap-2 ${hasLiked ? "text-red-500" : "text-white"}`}>
                                        <Heart className={`${hasLiked ? "fill-current" : ""}`} size={28} />
                                        <span className="font-bold text-lg">{post.gallery_likes?.length || 0}</span>
                                    </button>
                                    <button onClick={() => openComments(post.id)} className="text-white hover:text-[#c0ff00]">
                                        <MessageCircle size={28} />
                                    </button>
                                </div>
                                {post.caption && <p className="text-gray-300 text-sm"><span className="font-bold text-white mr-2">{groupName}</span>{post.caption}</p>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Comments Modal */}
            {activePostId && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-[#1e1e1e] w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="font-bold">Comentarios</h3>
                            <button onClick={() => setActivePostId(null)}><X /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {comments.length === 0 ? <p className="text-center text-gray-500 text-sm">Sé el primero en comentar...</p> :
                                comments.map(c => (
                                    <div key={c.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden relative flex-shrink-0">
                                            {c.profiles?.avatar_url && <Image src={c.profiles.avatar_url} fill className="object-cover" alt="Avatar" />}
                                        </div>
                                        <div className="bg-white/5 p-2 rounded-r-xl rounded-bl-xl text-sm">
                                            <span className="font-bold text-[#c0ff00] block text-xs">{c.profiles?.group_name}</span>
                                            {c.content}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>

                        <div className="p-4 border-t border-white/10 bg-black/20">
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-sm outline-none focus:border-[#c0ff00]"
                                    placeholder="Escribe algo épico..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendComment()}
                                />
                                <button onClick={sendComment} className="bg-[#c0ff00] text-black p-2 rounded-full font-bold">
                                    <MessageCircle size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
