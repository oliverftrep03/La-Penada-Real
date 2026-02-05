"use client";

import Navbar from "@/components/Navbar";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";
import { Upload, Image as ImageIcon, Save, Users, Trophy, Medal } from "lucide-react";
import { useState } from "react";

export default function Admin() {
    const { theme, updateTheme } = useTheme();
    const [rewards, setRewards] = useState<any[]>([]);
    const [editingReward, setEditingReward] = useState<any>(null);

    const [activeTab, setActiveTab] = useState<"design" | "users" | "shop" | "rewards">("design");
    const [uploading, setUploading] = useState(false);

    // Estados GAME MASTER
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [users, setUsers] = useState([{ id: 1, username: "El Kike", xp: 45, level: 5 }]);

    // Estados TIENDA
    const [items, setItems] = useState<any[]>([]);
    const [newItem, setNewItem] = useState({ name: "", price: 100, rarity: "common", type: "frame" });

    const loadRewards = async () => {
        const { data } = await supabase.from("reward_definitions").select("*").order("slot_index");
        if (data) setRewards(data);
    };

    const updateReward = async () => {
        if (!editingReward) return;
        const { error } = await supabase
            .from("reward_definitions")
            .update({ name: editingReward.name, description: editingReward.description })
            .eq("id", editingReward.id);

        if (!error) {
            alert("Recompensa actualizada");
            setEditingReward(null);
            loadRewards();
        } else {
            console.error(error);
            alert("Error al guardar");
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
                    <button
                        onClick={() => { setActiveTab("rewards"); loadRewards(); }}
                        className={`px-3 py-1 rounded-md text-sm font-bold whitespace-nowrap ${activeTab === "rewards" ? "bg-primary text-black" : "text-gray-400"}`}
                    >
                        🏆 Recompensas
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
                </div>
            )}

            {/* PESTAÑA TIENDA */}
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

            {/* PESTAÑA RECOMPENSAS (NUEVA) */}
            {activeTab === "rewards" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="glass-panel p-5 bg-yellow-500/10 border-yellow-500/30">
                        <h2 className="font-bold text-xl text-yellow-500 mb-4 flex items-center gap-2">
                            <Trophy /> Editor de Trofeos y Logros
                        </h2>

                        {editingReward ? (
                            <div className="bg-black/80 p-6 rounded-xl border border-yellow-500 space-y-4">
                                <h3 className="font-bold text-lg">Editando: {editingReward.slot_index}. {editingReward.type}</h3>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-400">Nombre</label>
                                    <input
                                        className="w-full p-3 bg-white/10 rounded-lg border border-white/20 focus:border-yellow-500 outline-none"
                                        value={editingReward.name}
                                        onChange={e => setEditingReward({ ...editingReward, name: e.target.value })}
                                    />
                                    <label className="text-xs text-gray-400">Descripción</label>
                                    <textarea
                                        className="w-full p-3 bg-white/10 rounded-lg border border-white/20 focus:border-yellow-500 outline-none"
                                        value={editingReward.description}
                                        onChange={e => setEditingReward({ ...editingReward, description: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={updateReward} className="flex-1 bg-yellow-500 text-black font-bold py-3 rounded-lg hover:bg-yellow-400">GUARDAR CAMBIOS</button>
                                    <button onClick={() => setEditingReward(null)} className="px-4 py-3 bg-white/10 rounded-lg hover:bg-white/20">Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Trofeos */}
                                <div>
                                    <h3 className="font-graffiti text-2xl text-yellow-400 mb-4 text-center">🏆 Trofeos (30)</h3>
                                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {rewards.filter(r => r.type === 'trophy').map(r => (
                                            <div key={r.id} onClick={() => setEditingReward(r)} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-yellow-500 cursor-pointer transition-colors group">
                                                <span className="font-mono text-xs text-gray-500 w-6">#{r.slot_index}</span>
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm group-hover:text-yellow-400">{r.name}</div>
                                                    <div className="text-xs text-gray-400 truncate">{r.description}</div>
                                                </div>
                                                <Trophy className="w-4 h-4 text-yellow-600" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Logros */}
                                <div>
                                    <h3 className="font-graffiti text-2xl text-purple-400 mb-4 text-center">⭐ Logros (30)</h3>
                                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                        {rewards.filter(r => r.type === 'achievement').map(r => (
                                            <div key={r.id} onClick={() => setEditingReward(r)} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:border-purple-500 cursor-pointer transition-colors group">
                                                <span className="font-mono text-xs text-gray-500 w-6">#{r.slot_index}</span>
                                                <div className="flex-1">
                                                    <div className="font-bold text-sm group-hover:text-purple-400">{r.name}</div>
                                                    <div className="text-xs text-gray-400 truncate">{r.description}</div>
                                                </div>
                                                <Medal className="w-4 h-4 text-purple-600" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Navbar />
        </div>
    );
}
