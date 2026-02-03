"use client";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import { ShoppingBag, Star, Coins, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast, Toaster } from "react-hot-toast";

// Definición de colores por rareza
const RARITY_COLORS: any = {
    common: "border-gray-500 text-gray-400 bg-gray-900/50",      // Peñomún
    rare: "border-blue-500 text-blue-400 bg-blue-900/20",         // Peñarro
    epic: "border-purple-500 text-purple-400 bg-purple-900/20",    // Peñepico
    legendary: "border-red-500 text-red-500 bg-red-900/20",        // Peñitico
    mythic: "border-yellow-400 text-yellow-400 bg-yellow-900/20", // Peñandario
    unique: "border-white text-white bg-white/10 shadow-[0_0_15px_white]" // Peñada Real (Platino)
};

export default function Shop() {
    const [items, setItems] = useState<any[]>([]);
    const [userCoins, setUserCoins] = useState(0);
    const [inventory, setInventory] = useState<number[]>([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    // Cargar datos
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const user = localStorage.getItem("penada_user");
        if (!user) return;

        // 1. Cargar Items
        const { data: itemsData } = await supabase.from("items").select("*").eq("is_active", true).order("price");
        if (itemsData) setItems(itemsData);

        // 2. Cargar Monedas del usuario
        const { data: profile } = await supabase.from("profiles").select("coins").eq("username", user).single();
        if (profile) setUserCoins(profile.coins || 0);

        // 3. Cargar Inventario (qué tiene ya comprado)
        const { data: inv } = await supabase.from("inventory").select("item_id").eq("user_id", user);
        if (inv) setInventory(inv.map(i => i.item_id));

        setLoading(false);
    };

    const buyItem = async (item: any) => {
        const user = localStorage.getItem("penada_user");
        if (!user) return;

        if (inventory.includes(item.id)) {
            toast("¡Ya tienes esto, ansias!", { icon: "🎒" });
            return;
        }

        if (userCoins < item.price) {
            toast.error("¡No tienes pasta suficiente!");
            return;
        }

        if (confirm(`¿Comprar ${item.name} por ${item.price} monedas?`)) {
            // TRANSACCIÓN DE COMPRA
            try {
                // 1. Restar monedas
                const { error: payError } = await supabase
                    .from("profiles")
                    .update({ coins: userCoins - item.price })
                    .eq("username", user);

                if (payError) throw payError;

                // 2. Añadir a inventario
                const { error: invError } = await supabase
                    .from("inventory")
                    .insert([{ user_id: user, item_id: item.id }]);

                if (invError) throw invError;

                // Éxito
                toast.success(`¡Comprado: ${item.name}!`);
                setUserCoins(prev => prev - item.price);
                setInventory(prev => [...prev, item.id]);

            } catch (e) {
                toast.error("Error en la compra...");
                console.error(e);
            }
        }
    };

    const filteredItems = filter === "all" ? items : items.filter(i => i.rapity === filter); // Typo 'rapity' corregido abajo en la lógica si pasara, pero usamos 'type' o 'rarity'

    return (
        <div className="min-h-screen bg-black pb-24 p-4 text-white">
            <Toaster position="top-center" />

            {/* Header Monedas */}
            <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-md py-4 mb-6 border-b border-white/10 flex justify-between items-center">
                <h1 className="text-3xl font-graffiti text-primary -rotate-2">Tienda</h1>
                <div className="bg-yellow-500/20 px-4 py-2 rounded-full border border-yellow-500/50 flex items-center gap-2">
                    <Coins className="text-yellow-400 w-5 h-5" />
                    <span className="font-bold font-mono text-xl text-yellow-100">{userCoins}</span>
                </div>
            </header>

            {/* Filtros */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                {["all", "frame", "title", "sticker"].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1 rounded-full text-sm font-bold capitalize whitespace-nowrap transition-colors ${filter === f ? "bg-primary text-black" : "bg-white/10 text-gray-400"}`}
                    >
                        {f === "all" ? "Todo" : f}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20 animate-pulse text-gray-500">Cargando mercancía...</div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {items.filter(i => filter === "all" || i.type === filter).map(item => {
                        const isOwned = inventory.includes(item.id);
                        const colorClass = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;

                        return (
                            <div
                                key={item.id}
                                onClick={() => buyItem(item)}
                                className={`relative group rounded-xl border-2 p-3 flex flex-col items-center gap-3 transition-all cursor-pointer ${colorClass} ${isOwned ? "opacity-50 grayscale" : "hover:scale-105 active:scale-95"}`}
                            >
                                {/* Etiqueta Rareza */}
                                <div className="absolute top-2 right-2">
                                    {item.rarity === 'mythic' && <Star className="w-4 h-4 text-yellow-400 animate-spin-slow" />}
                                </div>

                                {/* Imagen / Preview */}
                                <div className="w-full aspect-square bg-black/40 rounded-lg flex items-center justify-center overflow-hidden relative">
                                    {item.image_url ? (
                                        <img src={item.image_url} className="w-full h-full object-contain" />
                                    ) : (
                                        <ShoppingBag className="w-8 h-8 opacity-50" />
                                    )}
                                    {isOwned && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="font-bold text-green-500 rotate-[-10deg] border-2 border-green-500 px-2 py-1 rounded">EN PROPIEDAD</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="text-center w-full">
                                    <h3 className="font-bold text-sm leading-tight mb-1">{item.name}</h3>
                                    <div className="flex justify-center items-center gap-1 font-mono text-yellow-400">
                                        <Coins className="w-3 h-3" />
                                        <span>{item.price}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {items.length === 0 && !loading && (
                <div className="text-center py-10 text-gray-500">
                    <p>La tienda está vacía, jefe Admin.</p>
                    <p className="text-xs mt-2">Ve al panel para crear items.</p>
                </div>
            )}

            <Navbar />
        </div>
    );
}
