"use client";

import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Package, User } from "lucide-react";

export default function InventoryPage() {
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data } = await supabase
            .from("user_inventory")
            .select(`
                *,
                store_items (*)
            `)
            .eq("user_id", session.user.id)
            .order("acquired_at", { ascending: false });

        if (data) {
            setInventory(data.map((i: any) => i.store_items));
        }
        setLoading(false);
    };

    // Rarity styles helper
    const getRarityClass = (rarity: string) => {
        const styles: any = {
            common: "border-gray-500 text-gray-400",
            rare: "border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
            epic: "border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]",
            legendary: "border-yellow-500 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.5)]",
            unique: "border-gray-200 text-gray-200 shadow-[0_0_25px_rgba(255,255,255,0.7)]" // Platinum
        };
        return styles[rarity] || styles.common;
    };

    const getRarityName = (rarity: string) => {
        const names: any = {
            common: "Peñomún",
            rare: "Peñarro",
            epic: "Peñepico",
            legendary: "Peñendario",
            unique: "Peñatino"
        };
        return names[rarity] || rarity;
    };

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            <div className="p-4 sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-white/10">
                <h1 className="text-2xl font-graffiti flex items-center gap-2">
                    <Package className="text-primary" /> Mis Objetos
                </h1>
            </div>

            <div className="p-4">
                {loading ? (
                    <p className="text-center text-gray-500 animate-pulse mt-10">Cargando inventario...</p>
                ) : inventory.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <Package size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No tienes objetos aún.</p>
                        <p className="text-sm">¡Visita la tienda!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {inventory.map((item) => (
                            <div
                                key={item.id}
                                className={`relative p-4 rounded-xl border bg-white/5 flex flex-col items-center text-center group hover:scale-[1.02] transition-transform ${getRarityClass(item.rarity)}`}
                            >
                                <div className="w-full aspect-square mb-3 bg-black/30 rounded-lg flex items-center justify-center overflow-hidden relative">
                                    {item.image_url ? (
                                        <div className="relative w-full h-full">
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                            {/* Frame preview overlay */}
                                            {item.type === 'frame' && <div className={`absolute inset-0 border-[6px] border-transparent ${item.content}`}></div>}
                                        </div>
                                    ) : (
                                        <>
                                            {item.type === 'frame' && <div className={`w-16 h-16 bg-gray-700 ${item.content}`}></div>}
                                            {item.type === 'map_icon' && <span className="text-4xl">{item.content}</span>}
                                            {item.type === 'collectible' && <span className="text-4xl animate-pulse">{item.content}</span>}
                                        </>
                                    )}
                                </div>

                                <h3 className="font-bold text-sm leading-tight mb-1">{item.name}</h3>
                                <span className={`text-[10px] px-2 py-0.5 rounded bg-white/10 uppercase font-black tracking-wider`}>
                                    {getRarityName(item.rarity)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Navbar />
        </div>
    );
}
