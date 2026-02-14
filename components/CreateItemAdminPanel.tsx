"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Upload, Image as ImageIcon, Music, Play, Pause, Trash2, Save, X, Check, Dices, Sparkles } from "lucide-react";

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

    // EPIC DESIGN CONFIGURATION
    const rarityStyles: any = {
        common: {
            border: "border-gray-600",
            bg: "bg-gradient-to-br from-gray-800 to-gray-900",
            text: "text-gray-300",
            shadow: "shadow-none",
            overlay: "bg-white/5",
            icon: "text-gray-500"
        },
        rare: {
            border: "border-blue-500",
            bg: "bg-gradient-to-br from-blue-900 via-blue-950 to-black",
            text: "text-blue-300",
            shadow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]",
            overlay: "bg-blue-500/10",
            icon: "text-blue-400"
        },
        epic: {
            border: "border-purple-500",
            bg: "bg-gradient-to-br from-purple-900 via-purple-950 to-black",
            text: "text-purple-300",
            shadow: "shadow-[0_0_25px_rgba(168,85,247,0.5)]",
            overlay: "bg-purple-500/10",
            animation: "animate-pulse",
            icon: "text-purple-400"
        },
        legendary: {
            border: "border-yellow-400",
            bg: "bg-gradient-to-br from-yellow-900 via-yellow-950 to-black",
            text: "text-yellow-200",
            shadow: "shadow-[0_0_35px_rgba(234,179,8,0.6)]",
            overlay: "bg-yellow-500/20",
            animation: "animate-pulse",
            icon: "text-yellow-400"
        },
        unique: {
            border: "border-white",
            bg: "bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-100 to-gray-900",
            text: "text-white",
            shadow: "shadow-[0_0_40px_rgba(255,255,255,0.8)]",
            overlay: "bg-white/10",
            animation: "animate-spin-slow", // Custom or use pulse
            icon: "text-white"
        }
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
        if (!newItem.name) return alert("¡Falta el nombre del ítem!");

        setUploadingImage(true); // Temporary block UI

        // Auto-fill content for specific types if empty
        let finalItem = { ...newItem };

        // Ensure audio is null if empty string (cleaner for DB)
        if (!finalItem.audio_url) finalItem.audio_url = "";

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

        setUploadingImage(false); // Unblock

        if (error) {
            console.error(error);
            alert("Error al crear en BD: " + error.message);
        } else {
            alert("¡Ítem ÉPICO Creado! ⚔️");
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

    const clearAudio = () => {
        setNewItem(prev => ({ ...prev, audio_url: "" }));
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsPlaying(false);
    }

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

    const style = rarityStyles[newItem.rarity] || rarityStyles.common;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500">

            {/* LEFT: FORM */}
            <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5 relative overflow-hidden group">
                {/* Background decorative glow */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-green-500/10 transition-colors"></div>

                <h2 className="text-2xl font-black font-graffiti text-white flex items-center gap-3 relative z-10">
                    <Dices className="text-[#c0ff00] w-8 h-8" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">FORJAR ÍTEM</span>
                </h2>

                <div className="space-y-5 relative z-10">
                    {/* Name & Price */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nombre del Artefacto</label>
                            <input
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold focus:border-[#c0ff00] focus:bg-white/10 focus:shadow-[0_0_15px_rgba(192,255,0,0.1)] transition-all outline-none placeholder:text-gray-600"
                                placeholder="Ej: Espada de Diamante"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Precio</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-yellow-500">🪙</span>
                                <input
                                    type="number"
                                    value={newItem.price}
                                    onChange={e => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white font-mono font-bold focus:border-yellow-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lore / Descripción</label>
                        <textarea
                            value={newItem.description}
                            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-gray-300 h-24 resize-none focus:border-[#c0ff00] outline-none text-sm leading-relaxed"
                            placeholder="Una antigua reliquia forjada en las profundidades..."
                        />
                    </div>

                    {/* Image Drag & Drop */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Imagen Visual</label>
                        <div
                            className={`
                                relative border-2 border-dashed rounded-xl h-36 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden group/drop
                                ${isDragging ? "border-[#c0ff00] bg-[#c0ff00]/10 scale-[1.02]" : "border-white/10 hover:border-white/30 bg-black/40"}
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
                                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                            />

                            {uploadingImage ? (
                                <div className="text-[#c0ff00] animate-pulse font-bold font-mono">SUBIENDO ARCHIVO...</div>
                            ) : newItem.image_url ? (
                                <>
                                    <div className="absolute inset-0 bg-cover bg-center opacity-50 blur-sm scale-110" style={{ backgroundImage: `url(${newItem.image_url})` }}></div>
                                    <img src={newItem.image_url} className="absolute inset-0 w-full h-full object-contain p-2 z-10 transition-transform group-hover/drop:scale-110" />
                                </>
                            ) : (
                                <div className="text-center text-gray-500 pointer-events-none flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover/drop:bg-[#c0ff00]/20 transition-colors">
                                        <ImageIcon className="w-5 h-5 opacity-50 group-hover/drop:text-[#c0ff00] transition-colors" />
                                    </div>
                                    <span className="text-[10px] font-bold tracking-wider">ARRASTRA TU IMAGEN AQUÍ</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Audio Upload */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Efecto de Sonido (Opcional)</label>
                            {newItem.audio_url ? (
                                <button onClick={clearAudio} className="text-[10px] text-red-500 flex items-center gap-1 hover:underline">
                                    <Trash2 size={10} /> Eliminar Audio
                                </button>
                            ) : (
                                <span className="text-[10px] text-gray-600 italic">No es obligatorio</span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {newItem.audio_url ? (
                                <div className="flex-1 flex items-center gap-2 bg-[#c0ff00]/10 border border-[#c0ff00]/30 rounded-xl p-2 px-3">
                                    <Music size={16} className="text-[#c0ff00]" />
                                    <span className="text-xs text-[#c0ff00] font-bold truncate flex-1">Audio Cargado</span>
                                    <button
                                        onClick={toggleAudio}
                                        className="w-8 h-8 flex items-center justify-center bg-[#c0ff00] text-black rounded-full hover:scale-110 transition-transform"
                                    >
                                        {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
                                    </button>
                                </div>
                            ) : (
                                <label className="flex-1 cursor-pointer bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-white group/audio">
                                    <Upload size={14} className="group-hover/audio:-translate-y-0.5 transition-transform" />
                                    <span>{uploadingAudio ? "Subiendo..." : "Subir archivo .MP3 / .WAV"}</span>
                                    <input type="file" accept="audio/*" className="hidden" onChange={e => e.target.files?.[0] && handleAudioUpload(e.target.files[0])} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Selectors */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo de Ítem</label>
                            <select
                                value={newItem.type}
                                onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none appearance-none cursor-pointer hover:border-white/30 transition-colors"
                            >
                                <option value="collectible">Coleccionable</option>
                                <option value="frame">Marco</option>
                                <option value="map_icon">Icono Mapa</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rareza</label>
                            <select
                                value={newItem.rarity}
                                onChange={e => setNewItem({ ...newItem, rarity: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none capitalize cursor-pointer hover:border-white/30 transition-colors"
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
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {newItem.type === 'frame' ? "Clase CSS (Opcional)" : "Contenido Extra"}
                        </label>
                        <input
                            value={newItem.content}
                            onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white outline-none font-mono text-xs"
                            placeholder={newItem.type === 'frame' ? "Dejar vacío para auto-asignar" : "Ej: 💀 (Emoji o Texto)"}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleCreate}
                        disabled={uploadingImage || uploadingAudio}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black font-black font-graffiti text-lg uppercase tracking-wider py-4 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploadingImage ? <div className="animate-spin">⏳</div> : <Sparkles className="animate-pulse" />}
                        {uploadingImage ? "FORJANDO..." : "CREAR ÍTEM"}
                    </button>

                </div>
            </div>

            {/* RIGHT: LIVE PREVIEW */}
            <div className="flex flex-col gap-4 sticky top-6">
                <div className="bg-[#0a0a0a] p-8 rounded-2xl border border-white/10 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <div className="absolute bottom-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">Vista Previa</div>

                    {/* CARD CONTAINER */}
                    <div className={`
                        relative w-72 h-[420px] rounded-3xl flex flex-col items-center overflow-hidden transition-all duration-500 transform hover:scale-105 hover:rotate-1 group/card
                        border-[3px] ${style.border} ${style.bg} ${style.shadow}
                    `}>
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none z-20"></div>

                        {/* Rarity Ribbon */}
                        <div className="absolute top-4 right-4 z-20">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/20 backdrop-blur-md shadow-lg ${style.text} bg-black/60`}>
                                {newItem.rarity}
                            </div>
                        </div>

                        {/* Image Area */}
                        <div className="flex-1 w-full relative flex items-center justify-center p-6 z-10">
                            {/* Inner Glow */}
                            <div className={`absolute inset-0 ${style.overlay} blur-2xl`}></div>

                            {newItem.image_url ? (
                                <img src={newItem.image_url} className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transform group-hover/card:scale-110 transition-transform duration-500" />
                            ) : (
                                <Dices className={`w-24 h-24 opacity-20 ${style.text}`} />
                            )}
                        </div>

                        {/* Card Content */}
                        <div className="w-full bg-black/80 backdrop-blur-xl p-5 flex flex-col gap-2 border-t border-white/10 relative z-20">

                            <h3 className={`font-graffiti text-2xl leading-none uppercase tracking-wide truncate ${style.text} drop-shadow-md`}>
                                {newItem.name || "Sin Nombre"}
                            </h3>

                            <div className="w-10 h-1 bg-white/20 rounded-full my-1"></div>

                            <p className="text-[11px] text-gray-400 line-clamp-3 leading-relaxed font-urban">
                                {newItem.description || "La descripción aparecerá aquí..."}
                            </p>

                            <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/10">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white/5 px-2 py-1 rounded">
                                    {newItem.type}
                                </span>
                                <div className="flex items-center gap-1 font-mono font-bold text-yellow-400 text-sm bg-yellow-400/10 px-2 py-1 rounded-lg border border-yellow-400/20">
                                    <span>{newItem.price}</span>
                                    <span>🪙</span>
                                </div>
                            </div>
                        </div>

                        {/* Audio Indicator Badge */}
                        {newItem.audio_url && (
                            <div className="absolute top-4 left-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-[#c0ff00] border border-[#c0ff00]/30 shadow-lg z-20 animate-pulse">
                                <Music size={14} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
