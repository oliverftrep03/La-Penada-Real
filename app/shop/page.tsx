"use client";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { X, Gift } from "lucide-react";
import LootChest from "@/components/LootChest";

export default function ShopPage() {
    const [items, setItems] = useState<any[]>([]);
    const [inventory, setInventory] = useState<Set<string>>(new Set());
    const [balance, setBalance] = useState(0);
    const [myChests, setMyChests] = useState<any[]>([]);
    const [openingChest, setOpeningChest] = useState<string | null>(null);
    const [reward, setReward] = useState<any>(null); // For modal

    useEffect(() => {
        fetchData();
        fetchChests();
    }, []);

    const fetchData = async () => {
        const { data: itemsData } = await supabase.from("store_items").select("*").order("price");
        if (itemsData) setItems(itemsData);

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: profile } = await supabase.from("profiles").select("coins").eq("id", session.user.id).single();
            if (profile) setBalance(profile.coins);

            const { data: inv } = await supabase.from("user_inventory").select("item_id").eq("user_id", session.user.id);
            if (inv) setInventory(new Set(inv.map(i => i.item_id)));
        }
    };

    const fetchChests = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase.from("user_chests")
                .select("*")
                .eq("user_id", session.user.id)
                .is("opened_at", null)
                .order("created_at", { ascending: false });
            if (data) setMyChests(data);
        }
    };

    const handleClaimWelcome = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        toast.loading("Reclamando...");
        const { data } = await supabase.rpc("claim_welcome_chest", { target_user_id: session.user.id });
        toast.dismiss();
        if (data.success) {
            toast.success(data.message);
            fetchChests();
        } else {
            toast.error(data.message);
        }
    };

    const handleOpenChest = async (chestId: string) => {
        setOpeningChest(chestId);
        // Artificial delay for suspense
        await new Promise(r => setTimeout(r, 2000));

        const { data } = await supabase.rpc("open_chest", { chest_uuid: chestId });

        if (data.success && data.item) {
            setReward(data.item);
            toast.success(`¡Conseguiste: ${data.item.name}!`);
            fetchChests();
            fetchData(); // Refresh inventory/balance
        } else {
            toast.error(data.message || "Error al abrir");
        }
        setOpeningChest(null);
    };

    const buyItem = async (item: any) => {
        if (balance < item.price) return toast.error("No tienes suficientes monedas 💸");

        toast.loading("Comprando...");
        const { data: success, error } = await supabase.rpc("buy_item", { item_id: item.id, item_price: item.price });

        toast.dismiss();
        if (success) {
            toast.success(`¡Comprado: ${item.name}! 🎉`);
            fetchData(); // Refresh balance and inventory
        } else {
            toast.error("Error en la compra");
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white pb-24 font-urban">
            {/* Header */}
            <div className="p-4 sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#c0ff00]/20 flex justify-between items-center shadow-[0_4px_20px_rgba(192,255,0,0.1)]">
                <h1 className="text-3xl font-graffiti text-[#c0ff00] drop-shadow-[0_2px_0_rgba(0,0,0,1)]">TIENDA REAL</h1>
                <div className="bg-[#1a1a1a] px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <span className="font-mono font-bold text-white text-lg">{balance}</span>
                </div>
            </div>

            <div className="p-4 space-y-10 max-w-2xl mx-auto">

                {/* LOOT SECTION */}
                <section className="bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#c0ff00]/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[#c0ff00]/20 transition-all"></div>

                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white font-graffiti tracking-wide">
                        <Gift className="text-[#c0ff00]" /> COFRES DE BOTÍN
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Welcome Claim */}
                        <div className="flex-1 bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4 hover:border-[#c0ff00]/50 transition-colors">
                            <div className="w-16 h-16 bg-[#c0ff00] rounded-lg flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(192,255,0,0.4)] animate-pulse">🎁</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white">Cofre de Bienvenida</h3>
                                <p className="text-xs text-gray-400 mb-2">Gratis para miembros nuevos</p>
                                <button onClick={handleClaimWelcome} className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider hover:scale-105 transition-transform">
                                    Reclamar
                                </button>
                            </div>
                        </div>



                        {/* My Chests */}
                        <div className="flex-1 bg-white/5 p-6 rounded-xl border border-white/10 min-h-[160px] flex flex-col justify-center">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                🎒 Mis Cofres <span className="text-[#c0ff00] bg-[#c0ff00]/10 px-2 rounded text-xs">{myChests.length}</span>
                            </h3>
                            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide items-center">
                                {myChests.length === 0 && (
                                    <div className="text-gray-500 text-sm italic w-full text-center py-4 border-2 border-dashed border-white/10 rounded-xl">
                                        No tienes cofres pendientes.
                                    </div>
                                )}
                                {myChests.map(chest => (
                                    <LootChest
                                        key={chest.id}
                                        type={chest.type}
                                        onClick={() => handleOpenChest(chest.id)}
                                        opening={openingChest === chest.id}
                                        disabled={openingChest !== null && openingChest !== chest.id}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ITEMS GRID */}
                {/* Marcos */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-white/10 pb-2">🖼️ Marcos <span className="text-xs font-normal text-gray-500 ml-auto">Estilo visual</span></h2>
                    <div className="grid grid-cols-2 gap-4">
                        {items.filter(i => i.type === 'frame').map(item => (
                            <ShopItem key={item.id} item={item} owned={inventory.has(item.id)} onBuy={() => buyItem(item)} />
                        ))}
                    </div>
                </section>

                {/* Iconos */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-white/10 pb-2">📍 Iconos <span className="text-xs font-normal text-gray-500 ml-auto">Para el mapa</span></h2>
                    <div className="grid grid-cols-3 gap-4">
                        {items.filter(i => i.type === 'map_icon').map(item => (
                            <ShopItem key={item.id} item={item} owned={inventory.has(item.id)} onBuy={() => buyItem(item)} />
                        ))}
                    </div>
                </section>

                {/* Coleccionables */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-white/10 pb-2">💎 Coleccionables <span className="text-xs font-normal text-gray-500 ml-auto">Raros</span></h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {items.filter(i => i.type === 'collectible').map(item => (
                            <ShopItem key={item.id} item={item} owned={inventory.has(item.id)} onBuy={() => buyItem(item)} />
                        ))}
                    </div>
                </section>
            </div>
            <Navbar />

            {/* REWARD MODAL */}
            {reward && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#1a1a1a] border-2 border-[#c0ff00] rounded-2xl p-8 max-w-sm w-full text-center relative shadow-[0_0_50px_rgba(192,255,0,0.2)] animate-in zoom-in-50 duration-500">
                        <button onClick={() => setReward(null)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><X /></button>

                        <h2 className="text-2xl font-graffiti text-[#c0ff00] mb-2 uppercase tracking-widest animate-pulse">¡Recompensa!</h2>

                        <div className="my-8 flex justify-center">
                            <div className={`w-32 h-32 bg-black/50 rounded-xl flex items-center justify-center border-4 relative ${getFrameColor(reward.rarity)}`}>
                                {reward.type === 'frame' && <div className={`w-20 h-20 bg-gray-700 ${reward.content}`}></div>}
                                {reward.type === 'map_icon' && <span className="text-6xl filter drop-shadow-[0_0_10px_white]">{reward.content}</span>}
                                {reward.type === 'collectible' && <span className="text-6xl animate-bounce">{reward.content}</span>}
                                {reward.rarity === 'unique' && <div className="absolute inset-0 bg-white/10 animate-pulse"></div>}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-1">{reward.name}</h3>
                        <p className={`text-sm font-bold uppercase tracking-wider ${getRarityText(reward.rarity)}`}>{reward.rarity}</p>

                        <button onClick={() => setReward(null)} className="mt-8 bg-[#c0ff00] text-black w-full py-3 rounded-xl font-black uppercase tracking-wider hover:scale-105 transition-transform">
                            ¡Increíble!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helpers
const getFrameColor = (rarity: string) => {
    switch (rarity) {
        case 'unique': return 'border-cyan-400 shadow-[0_0_30px_cyan]';
        case 'legendary': return 'border-yellow-500 shadow-[0_0_20px_gold]';
        case 'epic': return 'border-purple-500 shadow-[0_0_15px_purple]';
        case 'rare': return 'border-blue-500 shadow-[0_0_10px_blue]';
        default: return 'border-gray-600';
    }
}

const getRarityText = (rarity: string) => {
    switch (rarity) {
        case 'unique': return 'text-cyan-400';
        case 'legendary': return 'text-yellow-500';
        case 'epic': return 'text-purple-500';
        case 'rare': return 'text-blue-500';
        default: return 'text-gray-500';
    }
}

function ShopItem({ item, owned, onBuy }: { item: any, owned: boolean, onBuy: () => void }) {
    const rarityColors: any = {
        common: "border-gray-500 text-gray-500",
        rare: "border-blue-500 text-blue-500 shadow-[0_0_10px_blue]",
        epic: "border-purple-500 text-purple-500 shadow-[0_0_15px_purple]",
        legendary: "border-red-500 text-red-500 shadow-[0_0_20px_red]",
        unique: "border-cyan-400 text-cyan-400 shadow-[0_0_25px_cyan]",
    };

    return (
        <div className={`p-4 rounded-xl border bg-white/5 relative overflow-hidden group ${item.rarity ? rarityColors[item.rarity] || "border-white/20" : "border-white/20"}`}>
            {owned && <div className="absolute top-2 right-2 text-green-500 font-bold text-xs bg-black/50 px-2 py-1 rounded z-10">ADQUIRIDO ✅</div>}

            <div className="h-24 flex items-center justify-center mb-2 bg-black/20 rounded-lg group-hover:scale-105 transition-transform">
                {item.type === 'frame' && <div className={`w-14 h-14 bg-gray-700 ${item.content}`}></div>}
                {item.type === 'map_icon' && <span className="text-5xl filter drop-shadow">{item.content}</span>}
                {item.type === 'collectible' && <span className="text-5xl animate-pulse">{item.content}</span>}
            </div>

            <h3 className="font-bold text-white leading-tight mb-1">{item.name}</h3>
            {item.rarity && <div className="text-[10px] uppercase font-bold opacity-80 mb-3">{item.rarity}</div>}

            <button
                onClick={onBuy}
                disabled={owned}
                className={`w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${owned ? 'bg-gray-800 text-gray-600 cursor-default' : 'bg-white text-black hover:bg-[#c0ff00] hover:scale-105 active:scale-95'}`}
            >
                {owned ? "En posesión" : `${item.price} 🪙 Comprar`}
            </button>
        </div>
    );
}
