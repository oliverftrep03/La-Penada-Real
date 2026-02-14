"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Upload, Image as ImageIcon, Music, Play, Pause, Trash2, Save, X, Check, Dices } from "lucide-react";

export default function CreateItemAdminPanel({ onItemCreated }: { onItemCreated: () => void }) {
    const [newItem, setNewItem] = useState({
        name: "",
        description: "",
        price: 100,
        type: "collectible",
        rarity: "common",
        content: "",
        image_url: "",
        audio_url: ""
    });

    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Drag & Drop State
    const [isDragging, setIsDragging] = useState(false);

    const rarityColors: any = {
        common: "border-gray-500 bg-gray-900/50 shadow-none text-gray-400",
        rare: "border-blue-500 bg-blue-900/20 shadow-[0_0_15px_rgba(59,130,246,0.5)] text-blue-400",
        epic: "border-purple-500 bg-purple-900/20 shadow-[0_0_15px_rgba(168,85,247,0.5)] text-purple-400",
        legendary: "border-yellow-500 bg-yellow-900/20 shadow-[0_0_20px_rgba(234,179,8,0.6)] text-yellow-400",
        unique: "border-white bg-black shadow-[0_0_25px_rgba(255,255,255,0.7)] text-white"
    };

    const rarityBg: any = {
        common: "bg-gray-800",
        rare: "bg-blue-900",
        epic: "bg-purple-900",
        legendary: "bg-yellow-900",
        unique: "bg-black"
    };

    const handleImageUpload = async (file: File) => {
        setUploadingImage(true);
        try {
            const fileName = `shop-item-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const { error } = await supabase.storage.from('shop_assets').upload(fileName, file);
            if (error) throw error;
            const { data } = supabase.storage.from('shop_assets').getPublicUrl(fileName);
            setNewItem(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (e) {
            console.error(e);
            alert("Error subiendo imagen");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleAudioUpload = async (file: File) => {
        setUploadingAudio(true);
        try {
            const fileName = `shop-audio-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            // Assuming 'shop_assets' allows audio, otherwise might need a new bucket or policy update
            const { error } = await supabase.storage.from('shop_assets').upload(fileName, file);
            if (error) throw error;
            const { data } = supabase.storage.from('shop_assets').getPublicUrl(fileName);
            setNewItem(prev => ({ ...prev, audio_url: data.publicUrl }));
        } catch (e) {
            console.error(e);
            alert("Error subiendo audio");
        } finally {
            setUploadingAudio(false);
        }
    };

    const handleCreate = async () => {
        if (!newItem.name) return alert("Falta nombre");

        // Auto-fill content for specific types if empty
        let finalItem = { ...newItem };
        if (finalItem.type === 'frame' && !finalItem.content) {
            const rarityMap: any = {
                'common': 'penomun-frame',
                'rare': 'penarro-frame',
                'epic': 'penepico-frame',
                'legendary': 'penendario-frame',
                'unique': 'penatino-frame'
            };
            finalItem.content = rarityMap[finalItem.rarity] || 'penomun-frame';
        }

        console.log("Creating Item:", finalItem);

        const { error } = await supabase.from("store_items").insert([finalItem]);

        if (error) {
            console.error(error);
            alert("Error al crear en BD: " + error.message);
        } else {
            alert("¡Ítem Creado con Éxito!");
            setNewItem({
                name: "", description: "", price: 100, type: "collectible", rarity: "common", content: "", image_url: "", audio_url: ""
            });
            onItemCreated();
        }
    };

    const toggleAudio = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio(newItem.audio_url);
            audioRef.current.onended = () => setIsPlaying(false);
        }

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(e => console.error("Audio play error", e));
            setIsPlaying(true);
        }
    };

    // Update audio ref source if url changes
    useEffect(() => {
        if (newItem.audio_url) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            audioRef.current = new Audio(newItem.audio_url);
            setIsPlaying(false); // Reset state
        }
    }, [newItem.audio_url]);


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500">

            {/* LEFT: FORM */}
            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/10 shadow-xl space-y-5">
                <h2 className="text-xl font-bold font-graffiti text-white flex items-center gap-2">
                    <Dices className="text-green-400" /> Crear Nuevo Ítem
                </h2>

                <div className="space-y-4">
                    {/* Name & Price */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Nombre</label>
                            <input
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-[#c0ff00] focus:ring-1 focus:ring-[#c0ff00] transition-all outline-none"
                                placeholder="Ej: Espada de Diamante"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Precio</label>
                            <input
                                type="number"
                                value={newItem.price}
                                onChange={e => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })}
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-[#c0ff00] outline-none"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Descripción (Lore)</label>
                        <textarea
                            value={newItem.description}
                            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white h-24 resize-none focus:border-[#c0ff00] outline-none"
                            placeholder="Una antigua reliquia forjada..."
                        />
                    </div>

                    {/* Image Drag & Drop */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Imagen</label>
                        <div
                            className={`
                                relative border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden
                                ${isDragging ? "border-[#c0ff00] bg-[#c0ff00]/10" : "border-white/20 hover:border-white/40 bg-black/30"}
                            `}
                            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                            onDrop={e => {
                                e.preventDefault();
                                setIsDragging(false);
                                if (e.dataTransfer.files?.[0]) handleImageUpload(e.dataTransfer.files[0]);
                            }}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                            />

                            {uploadingImage ? (
                                <div className="text-[#c0ff00] animate-pulse font-bold">Subiendo...</div>
                            ) : newItem.image_url ? (
                                <img src={newItem.image_url} className="absolute inset-0 w-full h-full object-contain p-2" />
                            ) : (
                                <div className="text-center text-gray-500 pointer-events-none">
                                    <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <span className="text-xs">Usa Drag & Drop o haz Click</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Audio Upload */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center justify-between">
                            <span>Sonido (Opcional)</span>
                            {newItem.audio_url && <span className="text-[#c0ff00] text-[10px] flex items-center gap-1"><Check size={10} /> Cargado</span>}
                        </label>
                        <div className="flex items-center gap-2">
                            <label className="flex-1 cursor-pointer bg-black/50 border border-white/10 rounded-lg p-3 hover:bg-white/5 transition-colors flex items-center gap-2 text-sm text-gray-400">
                                <Music size={16} />
                                <span className="truncate">{uploadingAudio ? "Subiendo..." : "Subir MP3"}</span>
                                <input type="file" accept="audio/*" className="hidden" onChange={e => e.target.files?.[0] && handleAudioUpload(e.target.files[0])} />
                            </label>

                            {newItem.audio_url && (
                                <button
                                    onClick={toggleAudio}
                                    className="p-3 bg-[#c0ff00] text-black rounded-lg hover:scale-105 transition-transform"
                                >
                                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Selectors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tipo</label>
                            <select
                                value={newItem.type}
                                onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none"
                            >
                                <option value="collectible">Coleccionable</option>
                                <option value="frame">Marco</option>
                                <option value="map_icon">Icono Mapa</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Rareza</label>
                            <select
                                value={newItem.rarity}
                                onChange={e => setNewItem({ ...newItem, rarity: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none capitalize"
                            >
                                <option value="common">Peñomún (Común)</option>
                                <option value="rare">Peñarro (Raro)</option>
                                <option value="epic">Peñepico (Épico)</option>
                                <option value="legendary">Peñendario (Leg.)</option>
                                <option value="unique">Peñatino (Único)</option>
                            </select>
                        </div>
                    </div>

                    {/* Extra Content */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                            {newItem.type === 'frame' ? "Clase CSS (Opcional)" : "Contenido Extra (Emoji/Texto)"}
                        </label>
                        <input
                            value={newItem.content}
                            onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white outline-none font-mono text-sm"
                            placeholder={newItem.type === 'frame' ? "Dejar vacío para auto-asignar" : "💀"}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleCreate}
                        disabled={uploadingImage || uploadingAudio}
                        className="w-full bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-wider py-4 rounded-xl shadow-lg hover:shadow-green-500/20 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        <Save size={20} /> Crear Ítem
                    </button>

                </div>
            </div>

            {/* RIGHT: LIVE PREVIEW */}
            <div className="flex flex-col gap-4">
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-white/10 h-full flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-4 left-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Live Preview</div>

                    {/* CARD PREVIEW */}
                    <div className={`
                        relative w-64 h-96 rounded-2xl border-4 flex flex-col items-center overflow-hidden transition-all duration-300
                        ${rarityColors[newItem.rarity]}
                    `}>
                        {/* Header Rarity */}
                        <div className={`w-full py-1 text-center text-[10px] font-bold uppercase tracking-widest bg-black/40 backdrop-blur-sm text-white/80`}>
                            {newItem.rarity}
                        </div>

                        {/* Image Area */}
                        <div className="flex-1 w-full relative flex items-center justify-center bg-black/20 p-4">
                            {newItem.image_url ? (
                                <img src={newItem.image_url} className="max-w-full max-h-full object-contain filter drop-shadow-lg" />
                            ) : (
                                <Dices className="w-16 h-16 opacity-20" />
                            )}
                        </div>

                        {/* Info Area */}
                        <div className="w-full bg-black/80 backdrop-blur-md p-4 flex flex-col gap-1 border-t border-white/10">
                            <h3 className={`font-bold text-lg leading-tight uppercase ${rarityColors[newItem.rarity].split(" ").pop()}`}>
                                {newItem.name || "Nombre del Ítem"}
                            </h3>
                            <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">
                                {newItem.description || "Descripción del objeto..."}
                            </p>

                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded">
                                    {newItem.type}
                                </span>
                                <span className="text-sm font-bold text-yellow-500">
                                    {newItem.price} 🪙
                                </span>
                            </div>
                        </div>

                        {/* Audio Indicator */}
                        {newItem.audio_url && (
                            <div className="absolute top-8 right-2 p-1 bg-black/50 rounded-full text-[#c0ff00]">
                                <Music size={12} />
                            </div>
                        )}
                    </div>

                    <p className="mt-8 text-sm text-gray-500 text-center max-w-xs">
                        Así se verá la carta dentro de los cofres y el inventario.
                    </p>
                </div>
            </div>

        </div>
    );
}
