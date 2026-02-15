"use client";

import { useState, useRef, useEffect } from "react";
import { Music, Play, Pause, RotateCw, Dices, X, Maximize2, Minimize2 } from "lucide-react";

interface ShopItemCardProps {
    item: any;
    owned?: boolean;
    onBuy?: () => void;
    isPreview?: boolean;
}

export default function ShopItemCard({ item, owned = false, onBuy, isPreview = false }: ShopItemCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false); // State for zoom effect
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // EPIC DESIGN CONFIGURATION
    const rarityStyles: any = {
        common: {
            border: "border-gray-600",
            bg: "bg-gradient-to-br from-gray-800 to-gray-900",
            text: "text-gray-300",
            shadow: "shadow-none",
            overlay: "bg-white/5",
            icon: "text-gray-500",
            backBg: "bg-gray-900"
        },
        rare: {
            border: "border-blue-500",
            bg: "bg-gradient-to-br from-blue-900 via-blue-950 to-black",
            text: "text-blue-300",
            shadow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]",
            overlay: "bg-blue-500/10",
            icon: "text-blue-400",
            backBg: "bg-blue-950"
        },
        epic: {
            border: "border-purple-500",
            bg: "bg-gradient-to-br from-purple-900 via-purple-950 to-black",
            text: "text-purple-300",
            shadow: "shadow-[0_0_25px_rgba(168,85,247,0.5)]",
            overlay: "bg-purple-500/10",
            animation: "animate-pulse",
            icon: "text-purple-400",
            backBg: "bg-purple-950"
        },
        legendary: {
            border: "border-yellow-400",
            bg: "bg-gradient-to-br from-yellow-900 via-yellow-950 to-black",
            text: "text-yellow-200",
            shadow: "shadow-[0_0_35px_rgba(234,179,8,0.6)]",
            overlay: "bg-yellow-500/20",
            animation: "animate-pulse",
            icon: "text-yellow-400",
            backBg: "bg-yellow-950"
        },
        unique: {
            border: "border-white",
            bg: "bg-[conic-gradient(at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-100 to-gray-900",
            text: "text-white",
            shadow: "shadow-[0_0_40px_rgba(255,255,255,0.8)]",
            overlay: "bg-white/10",
            animation: "animate-spin-slow",
            icon: "text-white",
            backBg: "bg-black"
        }
    };

    const style = rarityStyles[item.rarity] || rarityStyles.common;

    const toggleAudio = (e: any) => {
        e.stopPropagation();
        if (!item.audio_url) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(item.audio_url);
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

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [item.audio_url]);

    const handleCardClick = () => {
        if (!isExpanded) {
            setIsExpanded(true);
        } else {
            setIsFlipped(!isFlipped);
        }
    };

    const handleClose = (e: any) => {
        e.stopPropagation();
        setIsExpanded(false);
        setIsFlipped(false); // Reset flip on close
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    return (
        <>
            {/* BACKDROP BLUR (Only when expanded) */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 animate-in fade-in duration-300"
                    onClick={handleClose}
                ></div>
            )}

            {/* MAIN CARD CONTAINER */}
            <div
                className={`
                    perspective-1000 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    ${isExpanded
                        ? "fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        : "relative w-full aspect-[3/4] max-w-[280px] mx-auto cursor-pointer group hover:scale-105"
                    }
                `}
                onClick={!isExpanded ? handleCardClick : undefined} // Only trigger expand if not already expanded
            >
                <div
                    className={`
                        relative transition-all duration-700 transform-style-3d 
                        ${isExpanded ? "w-full max-w-sm h-[600px] pointer-events-auto" : "w-full h-full"}
                        ${isFlipped ? "rotate-y-180" : ""}
                    `}
                    onClick={isExpanded ? handleCardClick : undefined} // Trigger flip only when expanded
                >
                    {/* FRONT FACE */}
                    <div className={`
                        absolute inset-0 w-full h-full backface-hidden rounded-3xl overflow-hidden flex flex-col items-center
                        border-[3px] ${style.border} ${style.bg} ${style.shadow}
                    `}>
                        {/* CLOSE BUTTON (Expanded Only) */}
                        {isExpanded && (
                            <button
                                onClick={handleClose}
                                className="absolute top-4 left-4 z-40 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}

                        {/* Owned Badge */}
                        {owned && (
                            <div className="absolute top-2 left-2 z-30 bg-green-500 text-black font-black text-[10px] px-2 py-1 rounded shadow-lg uppercase tracking-wider transform -rotate-6">
                                ADQUIRIDO ✅
                            </div>
                        )}

                        {/* Expand Hint (Normal Only) */}
                        {!isExpanded && !isPreview && (
                            <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 size={16} className="text-white drop-shadow-md" />
                            </div>
                        )}

                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20"></div>

                        {/* Rarity Ribbon */}
                        <div className="absolute top-4 right-4 z-20">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/20 backdrop-blur-md shadow-lg ${style.text} bg-black/60`}>
                                {item.rarity}
                            </div>
                        </div>

                        {/* Image Area */}
                        <div className="flex-1 w-full relative flex items-center justify-center p-6 z-10">
                            <div className={`absolute inset-0 ${style.overlay} blur-2xl`}></div>

                            {item.image_url ? (
                                <img src={item.image_url} className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
                            ) : (
                                <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                                    {item.type === 'frame' && <div className={`w-16 h-16 bg-gray-700 ${item.content}`}></div>}
                                    {item.type === 'map_icon' && <span className="text-6xl filter drop-shadow-[0_0_10px_white]">{item.content}</span>}
                                    {item.type === 'collectible' && !item.image_url && <Dices className={`w-16 h-16 opacity-50 ${style.text}`} />}
                                </div>
                            )}
                        </div>

                        {/* Audio Indicator Badge */}
                        {item.audio_url && (
                            <button
                                onClick={toggleAudio}
                                className="absolute top-16 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-[#c0ff00] border border-[#c0ff00]/30 shadow-lg z-30 hover:scale-110 transition-transform"
                            >
                                {isPlaying ? <Pause size={14} className="animate-pulse" /> : <Music size={14} />}
                            </button>
                        )}

                        {/* Front Footer (Name + Stats + Buy) */}
                        <div className="w-full bg-black/80 backdrop-blur-xl p-3 flex flex-col gap-2 border-t border-white/10 relative z-20 min-h-[90px] justify-between">
                            <h3 className={`font-graffiti text-sm leading-tight uppercase tracking-wide line-clamp-2 ${style.text} drop-shadow-md text-center h-8 flex items-center justify-center`}>
                                {item.name || "Sin Nombre"}
                            </h3>

                            <div className="flex items-center justify-between mt-1">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded">
                                    {item.type}
                                </span>

                                {/* Buy Button / Price */}
                                {!isPreview && onBuy ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); if (!owned) onBuy(); }}
                                        disabled={owned}
                                        className={`
                                        font-bold text-[9px] uppercase px-2 py-1 rounded-lg shadow-md transition-transform hover:scale-105 active:scale-95
                                        ${owned
                                                ? "bg-gray-800 text-gray-500 cursor-default opacity-50"
                                                : "bg-[#c0ff00] hover:bg-[#b0ef00] text-black shadow-[0_0_10px_rgba(192,255,0,0.3)]"
                                            }
                                    `}
                                    >
                                        {owned ? "EN POSESIÓN" : `${item.price} 🪙`}
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1 font-mono font-bold text-yellow-400 text-xs bg-yellow-400/10 px-1.5 py-0.5 rounded-lg border border-yellow-400/20">
                                        <span>{item.price}</span>
                                        <span>🪙</span>
                                    </div>
                                )}
                            </div>

                            <div className="text-[8px] text-gray-600 text-center mt-1 flex items-center justify-center gap-1">
                                {isExpanded ? <><RotateCw size={8} /> Click para ver descripción</> : <><Maximize2 size={8} /> Click para ampliar</>}
                            </div>
                        </div>
                    </div>

                    {/* BACK FACE */}
                    <div className={`
                        absolute inset-0 w-full h-full backface-hidden rounded-3xl overflow-hidden flex flex-col items-center justify-center p-8 text-center rotate-y-180
                        border-[3px] ${style.border} ${style.backBg} shadow-inner
                    `}>
                        {/* CLOSE BUTTON (Back Face) */}
                        {isExpanded && (
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 z-40 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}

                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                        <h3 className={`font-graffiti text-3xl mb-6 ${style.text} drop-shadow-[0_2px_0_rgba(0,0,0,1)] -rotate-2 select-none`}>
                            {item.name || "???"}
                        </h3>

                        <div className="relative p-6 border-2 border-white/10 bg-black/40 rounded-xl transform rotate-1 backdrop-blur-sm w-full max-h-[60%] overflow-y-auto custom-scrollbar">
                            {/* Decorative corners */}
                            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-white/30"></div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-white/30"></div>

                            <p className={`text-base font-graffiti leading-loose text-white/90 drop-shadow-md ${item.description ? '' : 'italic opacity-50'}`}>
                                "{item.description || "La leyenda de este artefacto aún no ha sido escrita..."}"
                            </p>
                        </div>

                        <div className="mt-8 text-[10px] text-gray-500 flex items-center gap-1 select-none cursor-pointer hover:text-white transition-colors" onClick={() => setIsFlipped(false)}>
                            <RotateCw size={12} /> Click para volver a la imagen
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .animate-spin-slow { animation: spin 8s linear infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { bg: rgba(255,255,255,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb { bg: rgba(255,255,255,0.2); border-radius: 10px; }
            `}</style>
        </>
    );
}
