"use client";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

export default function ShopPage() {
    const [items, setItems] = useState<any[]>([]);
    const [inventory, setInventory] = useState<Set<string>>(new Set());
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        fetchData();
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
        <div className="min-h-screen bg-black text-white pb-24">
            <div className="p-4 sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-warning">
                <h1 className="text-3xl font-graffiti text-yellow-500">Tienda <span className="text-white text-sm font-mono block text-right mt-[-30px]">💰 {balance} Monedas</span></h1>
            </div>

            <div className="p-4 space-y-8">
                {/* Marcos */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">🖼️ Marcos <span className="text-xs font-normal text-gray-500">Para tus fotos</span></h2>
                    <div className="grid grid-cols-2 gap-4">
                        {items.filter(i => i.type === 'frame').map(item => (
                            <ShopItem key={item.id} item={item} owned={inventory.has(item.id)} onBuy={() => buyItem(item)} />
                        ))}
                    </div>
                </section>

                {/* Iconos */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">📍 Iconos Mapa <span className="text-xs font-normal text-gray-500">Destaca en el mapa</span></h2>
                    <div className="grid grid-cols-3 gap-4">
                        {items.filter(i => i.type === 'map_icon').map(item => (
                            <ShopItem key={item.id} item={item} owned={inventory.has(item.id)} onBuy={() => buyItem(item)} />
                        ))}
                    </div>
                </section>

                {/* Coleccionables */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">💎 Coleccionables <span className="text-xs font-normal text-gray-500">Para tu perfil</span></h2>
                    <div className="grid grid-cols-2 gap-4">
                        {items.filter(i => i.type === 'collectible').map(item => (
                            <ShopItem key={item.id} item={item} owned={inventory.has(item.id)} onBuy={() => buyItem(item)} />
                        ))}
                    </div>
                </section>
            </div>
            <Navbar />
        </div>
    );
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
            {owned && <div className="absolute top-2 right-2 text-green-500 font-bold text-xs bg-black/50 px-2 py-1 rounded">ADQUIRIDO ✅</div>}

            <div className="h-16 flex items-center justify-center mb-2">
                {item.type === 'frame' && <div className={`w-12 h-12 bg-gray-700 ${item.content}`}></div>}
                {item.type === 'map_icon' && <span className="text-4xl filter drop-shadow hover:scale-125 transition-transform">{item.content}</span>}
                {item.type === 'collectible' && <span className="text-4xl animate-pulse">{item.content}</span>}
            </div>

            <h3 className="font-bold text-white leading-tight">{item.name}</h3>
            {item.rarity && <div className="text-[10px] uppercase font-bold opacity-80 mb-2">{item.rarity}</div>}

            <button
                onClick={onBuy}
                disabled={owned}
                className={`w-full py-2 rounded-lg font-bold text-sm mt-2 transition-all ${owned ? 'bg-gray-800 text-gray-500 cursor-default' : 'bg-white text-black hover:scale-105 active:scale-95'}`}
            >
                {owned ? "EN POSESIÓN" : `${item.price} 🪙 COMPRAR`}
            </button>
        </div>
    );
}
