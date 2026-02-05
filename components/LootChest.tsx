"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function LootChest({ type = "common", onClick, disabled, opening }: { type?: string, onClick?: () => void, disabled?: boolean, opening?: boolean }) {

    // Aesthetic mapping
    const chestStyles: any = {
        welcome: "from-yellow-400 to-yellow-600 border-yellow-200 shadow-[0_0_30px_rgba(250,204,21,0.6)]",
        common: "from-gray-700 to-gray-900 border-gray-500",
        rare: "from-blue-600 to-blue-900 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]",
        epic: "from-purple-600 to-purple-900 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.5)]",
        legendary: "from-yellow-500 via-orange-500 to-red-600 border-yellow-300 shadow-[0_0_40px_rgba(234,179,8,0.8)]",
        combo_5_photos: "from-[#c0ff00] to-green-700 border-white shadow-[0_0_30px_#c0ff00]",
    };

    const currentStyle = chestStyles[type] || chestStyles.common;

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled || opening}
            className={`relative group w-24 h-24 sm:w-32 sm:h-32 perspective-1000 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Glow Effect */}
            <div className={`absolute inset-0 rounded-xl blur-xl bg-gradient-to-br ${currentStyle} opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>

            {/* Chest Body */}
            <motion.div
                className={`relative w-full h-full bg-gradient-to-br ${currentStyle} rounded-xl border-4 flex items-center justify-center overflow-hidden`}
                animate={opening ? {
                    x: [0, -5, 5, -5, 5, 0],
                    rotate: [0, -2, 2, -2, 2, 0],
                    scale: [1, 1.1, 1]
                } : {}}
                transition={opening ? { duration: 0.5, repeat: Infinity } : {}}
            >
                {/* Latch */}
                <div className="absolute w-1/3 h-1/6 bg-gradient-to-b from-gray-200 to-gray-500 rounded-sm top-[45%] left-1/3 shadow-md border border-black/20 z-20"></div>

                {/* Lid Line */}
                <div className="absolute w-full h-1 bg-black/30 top-[45%] z-10"></div>

                {/* Decorative Corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/50 rounded-tl-md"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/50 rounded-tr-md"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/50 rounded-bl-md"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/50 rounded-br-md"></div>

                {/* Icon/Emoji Fallback or Overlay */}
                <div className="text-4xl filter drop-shadow-lg z-30">
                    {opening ? '🔓' : '🔒'}
                </div>
            </motion.div>

            {/* Label */}
            <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider bg-black/80 px-2 py-1 rounded text-white whitespace-nowrap border border-white/10 ${opening ? 'animate-pulse text-[#c0ff00]' : ''}`}>
                {opening ? 'Abriendo...' : type === 'welcome' ? 'Bienvenida' : 'Recompensa'}
            </div>

        </motion.button>
    );
}
