"use client";

import Navbar from "@/components/Navbar";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";
import { Upload, Image as ImageIcon, Save, Users, Trophy, Medal } from "lucide-react";
import { useState } from "react";

export default function Admin() {
    const { theme, updateTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<"design" | "users" | "shop">("design");
    const [uploading, setUploading] = useState(false);

    // Estados GAME MASTER
    const [selectedUser, setSelectedUser] = useState<any>(null); // Placeholder
    const [users, setUsers] = useState([{ id: 1, username: "El Kike", xp: 45, level: 5 }]); // Fake data por ahora

    // Estados TIENDA
    const [items, setItems] = useState<any[]>([]);
    const [newItem, setNewItem] = useState({ name: "", price: 100, rarity: "common", type: "frame" });

    const loadItems = async () => {
        const { data } = await supabase.from("items").select("*").order("id");
        if (data) setItems(data);
    };

    const createItem = async () => {
        const { error } = await supabase.from("items").insert([newItem]);
        if (!error) {
            alert("Item creado!");
            setNewItem({ name: "", price: 100, rarity: "common", type: "frame" });
            loadItems();
        } else {
            alert("Error: " + error.message);
        }
    };

    const deleteItem = async (id: number) => {
        if (!confirm("¿Borrar item?")) return;
        const { error } = await supabase.from("items").delete().eq("id", id);
        if (!error) loadItems();
    };

    // ... (Funciones de diseño existentes) ...

    const handleGiveXP = (amount: number) => {
        alert(`Has dado ${amount} XP a ${selectedUser?.username || "nadie"}`);
        // Lógica real vendría aquí
    };

    const handleColorChange = (key: keyof typeof theme.colors, value: string) => {
        updateTheme({
            colors: { ...theme.colors, [key]: value }
        });
    };

    const handleImageUpload = async (section: keyof typeof theme.backgrounds, file: File) => {
        // ... (mismo código que tenías) ...
        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${section}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('uploads')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('uploads')
                .getPublicUrl(filePath);

            updateTheme({
                backgrounds: { ...theme.backgrounds, [section]: data.publicUrl }
            });

        } catch (error) {
            alert("Error: " + (error as any).message);
        } finally {
            setUploading(false);
        }
    };


    return (
        <div className="min-h-screen bg-black text-white pb-24 p-6 overflow-y-auto">
            <header className="flex justify-between items-center mb-8 flex-wrap gap-2">
                <h1 className="text-3xl font-graffiti text-primary rotate-[-2deg]">Panel Admin</h1>
                <div className="flex bg-white/10 rounded-lg p-1 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("design")}
                        className={`px-3 py-1 rounded-md text-sm font-bold whitespace-nowrap ${activeTab === "design" ? "bg-primary text-black" : "text-gray-400"}`}
                    >
                        🎨 Diseño
                    </button>
                    <button
                        onClick={() => setActiveTab("users")}
                        className={`px-3 py-1 rounded-md text-sm font-bold whitespace-nowrap ${activeTab === "users" ? "bg-primary text-black" : "text-gray-400"}`}
                    >
                        👑 Game Master
                    </button>
                    <button
                        onClick={() => { setActiveTab("shop"); loadItems(); }}
                        className={`px-3 py-1 rounded-md text-sm font-bold whitespace-nowrap ${activeTab === "shop" ? "bg-primary text-black" : "text-gray-400"}`}
                    >
                        🛒 Tienda
                    </button>
                </div>
            </header>

            {/* PESTAÑA DISEÑO */}
            {activeTab === "design" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <section className="glass-panel p-5 space-y-4">
                        <h2 className="font-bold text-lg border-b border-white/10 pb-2 flex items-center gap-2">
                            <span className="text-2xl">🖌️</span> Colores
                        </h2>
                        {Object.entries(theme.colors).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                                <span className="capitalize font-urban text-gray-300">{key}</span>
                                <input
                                    type="color"
                                    value={value}
                                    onChange={(e) => handleColorChange(key as any, e.target.value)}
                                    className="w-10 h-10 rounded-full cursor-pointer bg-transparent border-none appearance-none"
                                />
                            </div>
                        ))}
                    </section>

                    <section className="glass-panel p-5 space-y-4">
                        <h2 className="font-bold text-lg border-b border-white/10 pb-2 flex items-center gap-2">
                            <span className="text-2xl">🖼️</span> Fondos
                        </h2>
                        {Object.entries(theme.backgrounds).map(([key, url]) => (
                            <div key={key} className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-400 uppercase font-bold">
                                    <span>{key}</span>
                                    {url ? <span className="text-green-500 text-xs">Activo</span> : <span className="text-gray-600 text-xs">Vacío</span>}
                                </div>
                                <label className="block h-20 bg-gray-900 rounded-lg border-2 border-dashed border-white/20 relative cursor-pointer hover:border-primary transition-colors overflow-hidden">
                                    {url && <img src={url} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Upload className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                        if (e.target.files?.[0]) handleImageUpload(key as any, e.target.files[0]);
                                    }} />
                                </label>
                            </div>
                        ))}
                    </section>
                </div>
            )}

            {/* PESTAÑA GAME MASTER */}
            {activeTab === "users" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <section className="glass-panel p-5 space-y-4">
                        <h2 className="font-bold text-lg border-b border-white/10 pb-2 flex items-center gap-2">
                            <Users className="w-5 h-5" /> Jugadores
                        </h2>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {users.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => setSelectedUser(user)}
                                    className={`p-3 rounded-lg flex justify-between items-center cursor-pointer transition-colors ${selectedUser?.id === user.id ? "bg-primary text-black" : "bg-white/5 hover:bg-white/10"}`}
                                >
                                    <span className="font-bold">{user.username}</span>
                                    <span className="text-xs font-mono">Lvl {user.level}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {selectedUser && (
                        <section className="space-y-4">
                            <div className="p-4 bg-gray-900 rounded-xl border border-primary/30">
                                <h3 className="text-primary font-graffiti text-xl mb-2">Dar Experiencia</h3>
                                <div className="flex gap-2 flex-wrap">
                                    {[1, 5, 10].map(amount => (
                                        <button
                                            key={amount}
                                            onClick={() => handleGiveXP(amount)}
                                            className="flex-1 bg-white/10 hover:bg-primary hover:text-black py-2 rounded-lg font-bold transition-colors"
                                        >
                                            +{amount} XP
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-gray-900 rounded-xl border border-yellow-500/30">
                                <h3 className="text-yellow-500 font-graffiti text-xl mb-2">Gestionar Trofeos</h3>
                                <p className="text-xs text-gray-500 mb-2">Haz clic para dar/quitar trofeo</p>
                                <div className="grid grid-cols-6 gap-1">
                                    {[...Array(27)].map((_, i) => (
                                        <button
                                            key={i}
                                            className="aspect-square bg-black border border-white/20 rounded flex items-center justify-center hover:border-yellow-500"
                                            onClick={() => alert(`Trofeo ${i + 1} cambiado para ${selectedUser.username}`)}
                                        >
                                            <Trophy className="w-3 h-3 text-gray-600" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* PESTAÑA TIENDA (NUEVA) */}
            {activeTab === "shop" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Crear Item */}
                    <section className="glass-panel p-5 space-y-4 border-l-4 border-green-500">
                        <h2 className="font-bold text-lg text-green-400">Crear Artículo</h2>
                        <div className="grid grid-cols-2 gap-2">
                            <input placeholder="Nombre" className="p-2 bg-black/50 rounded border border-white/10" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                            <input type="number" placeholder="Precio" className="p-2 bg-black/50 rounded border border-white/10" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: parseInt(e.target.value) })} />
                            <select className="p-2 bg-black/50 rounded border border-white/10" value={newItem.rarity} onChange={e => setNewItem({ ...newItem, rarity: e.target.value })}>
                                <option value="common">Peñomún (Gris)</option>
                                <option value="rare">Peñarro (Azul)</option>
                                <option value="epic">Peñepico (Morado)</option>
                                <option value="legendary">Peñitico (Rojo)</option>
                                <option value="mythic">Peñandario (Dorado)</option>
                                <option value="unique">Peñada Real (Platino)</option>
                            </select>
                            <select className="p-2 bg-black/50 rounded border border-white/10" value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })}>
                                <option value="frame">Marco</option>
                                <option value="title">Título</option>
                                <option value="sticker">Sticker</option>
                            </select>
                        </div>
                        <button onClick={createItem} className="w-full bg-green-500 text-black font-bold py-2 rounded">AÑADIR A TIENDA</button>
                    </section>

                    {/* Lista Items */}
                    <div className="space-y-2">
                        {items.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                                <div>
                                    <div className="font-bold">{item.name}</div>
                                    <div className="text-xs text-gray-400">{item.price} 🪙 - {item.rarity}</div>
                                </div>
                                <button onClick={() => deleteItem(item.id)} className="text-red-500 text-xs border border-red-500/50 px-2 py-1 rounded hover:bg-red-500 hover:text-white">BORRAR</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Navbar />
        </div>
    );
}
