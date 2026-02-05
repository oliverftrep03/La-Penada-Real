"use client";

import Navbar from "@/components/Navbar";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";
import { Upload, Image as ImageImg, Save, Users, Trophy, Medal } from "lucide-react";
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
    const [newItem, setNewItem] = useState({ name: "", price: 100, rarity: "common", type: "frame", content: "", image_url: "", description: "" });

    const handleShopImageUpload = async (file: File) => {
        setUploading(true);
        try {
            const fileName = `shop-${Date.now()}-${file.name}`;
            const { error } = await supabase.storage.from('shop_assets').upload(fileName, file);
            if (error) throw error;
            const { data } = supabase.storage.from('shop_assets').getPublicUrl(fileName);
            setNewItem({ ...newItem, image_url: data.publicUrl });
            alert("Imagen cargada");
        } catch (e) {
            console.error(e);
            alert("Error subiendo imagen");
        } finally {
            setUploading(false);
        }
    };

    const handleColorChange = (key: string, value: string) => {
        updateTheme({ colors: { ...theme.colors, [key]: value } });
    };

    const handleImageUpload = async (key: string, file: File) => {
        setUploading(true);
        try {
            const fileName = `bg-${key}-${Math.random()}.png`;
            const { error } = await supabase.storage.from('gallery').upload(fileName, file);
            if (error) throw error;
            const { data } = supabase.storage.from('gallery').getPublicUrl(fileName);
            updateTheme({ backgrounds: { ...theme.backgrounds, [key]: data.publicUrl } });
            alert("Fondo actualizado");
        } catch (e) {
            console.error(e);
            alert("Error subiendo imagen");
        } finally {
            setUploading(false);
        }
    };

    const loadItems = async () => {
        const { data } = await supabase.from("store_items").select("*").order("created_at", { ascending: false });
        if (data) setItems(data);
    };

    const createItem = async () => {
        if (!newItem.name || newItem.price <= 0) return alert("Rellena nombre y precio");

        // Auto-assign CSS class for frames if not provided
        let itemToSave = { ...newItem };
        if (itemToSave.type === 'frame' && !itemToSave.content) {
            const rarityMap: any = {
                'common': 'penomun-frame',
                'rare': 'penarro-frame',
                'epic': 'penepico-frame',
                'legendary': 'penendario-frame',
                'unique': 'penatino-frame'
            };
            itemToSave.content = rarityMap[itemToSave.rarity] || 'penomun-frame';
        }

        const { error } = await supabase.from("store_items").insert([itemToSave]);
        if (error) {
            console.error(error);
            alert("Error creando item");
        } else {
            alert("Ítem creado en Tienda");
            setNewItem({ name: "", price: 100, rarity: "common", type: "frame", content: "", image_url: "", description: "" });
            loadItems();
        }
    };

    const deleteItem = async (id: string) => {
        if (!confirm("¿Borrar item?")) return;
        const { error } = await supabase.from("store_items").delete().eq("id", id);
        if (!error) loadItems();
    };

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
                    {/* Crear Item */}
                    <section className="glass-panel p-5 space-y-4 border-l-4 border-green-500">
                        <h2 className="font-bold text-lg text-green-400">Crear Artículo</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Nombre</label>
                                <input
                                    placeholder="Ej: Marco de Fuego"
                                    className="w-full p-2 bg-black/50 rounded border border-white/10"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Precio</label>
                                <input
                                    type="number"
                                    placeholder="100"
                                    className="w-full p-2 bg-black/50 rounded border border-white/10"
                                    value={newItem.price}
                                    onChange={e => setNewItem({ ...newItem, price: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Tipo</label>
                                <select
                                    className="w-full p-2 bg-black/50 rounded border border-white/10"
                                    value={newItem.type}
                                    onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                >
                                    <option value="frame">Marco</option>
                                    <option value="map_icon">Icono Mapa</option>
                                    <option value="collectible">Coleccionable</option>
                                </select>
                            </div>

                            <div className="col-span-2 space-y-2">
                                <label className="text-xs text-gray-400">Descripción</label>
                                <textarea
                                    placeholder="Detalles épicos del artículo..."
                                    className="w-full p-2 bg-black/50 rounded border border-white/10 resize-none h-20"
                                    value={newItem.description || ""}
                                    onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Rareza / Calidad</label>
                                <select
                                    className="w-full p-2 bg-black/50 rounded border border-white/10"
                                    value={newItem.rarity}
                                    onChange={e => setNewItem({ ...newItem, rarity: e.target.value })}
                                >
                                    <option value="common">Peñomún (Gris)</option>
                                    <option value="rare">Peñarro (Azul)</option>
                                    <option value="epic">Peñepico (Morado)</option>
                                    <option value="legendary">Peñendario (Dorado)</option>
                                    <option value="unique">Peñatino (Platino 💀)</option>
                                </select>
                            </div>

                            <div className="col-span-2 space-y-2">
                                <label className="text-xs text-gray-400">
                                    {newItem.type === 'frame' ? "Clase CSS (Auto-sugerida si vacío)" : "Contenido (Emoji o Texto)"}
                                </label>
                                <input
                                    placeholder={newItem.type === 'frame' ? "penarro-frame" : "💀"}
                                    className="w-full p-2 bg-black/50 rounded border border-white/10"
                                    value={newItem.content}
                                    onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <label className="text-xs text-gray-400">Imagen de Tienda (Opcional)</label>
                                <div className="flex items-center gap-4">
                                    <label className="cursor-pointer bg-white/10 px-4 py-2 rounded border border-white/20 hover:bg-white/20 flex items-center gap-2">
                                        <ImageImg className="w-4 h-4" /> Subir Imagen
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                            if (e.target.files?.[0]) handleShopImageUpload(e.target.files[0]);
                                        }} />
                                    </label>
                                    {newItem.image_url && (
                                        <img src={newItem.image_url} alt="Preview" className="h-12 w-12 object-cover rounded border border-white/20" />
                                    )}
                                </div>
                            </div>
                        </div>
                        <button onClick={createItem} className="w-full bg-green-500 text-black font-bold py-3 rounded-lg hover:scale-[1.02] transition-transform">
                            AÑADIR A TIENDA 🛒
                        </button>
                    </section>


                    {/* Lista Items */}
                    <div className="space-y-2">
                        {items.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                                <div>
                                    <div className="font-bold flex items-center gap-2">
                                        {item.name}
                                        <span className={`text-[10px] px-1 rounded border ${item.type === 'frame' ? 'border-blue-500 text-blue-500' : item.type === 'collectible' ? 'border-purple-500 text-purple-500' : 'border-green-500 text-green-500'}`}>
                                            {item.type}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {item.price} 🪙
                                        {item.rarity && <span className="ml-2 capitalize opacity-70"> • {item.rarity}</span>}
                                    </div>
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
