"use client";

import Navbar from "@/components/Navbar";
import { useTheme } from "@/components/ThemeProvider";
import { ArrowLeft, Trophy, Medal, Settings, User } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Profile() {
    const { theme } = useTheme();
    // Estado local simulado hasta conectar DB real
    const [profile, setProfile] = useState({
        username: "El Kike",
        level: 5,
        xp: 45,
        maxXp: 100,
        trophies: {} as Record<string, boolean>,
        achievements: {} as Record<string, boolean>
    });

    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(profile.username);

    // Cargar perfil real (Simulado por ahora)
    useEffect(() => {
        // Aquí conectaremos con supabase 'profiles'
        const savedUser = localStorage.getItem("penada_user");
        if (savedUser) setProfile(prev => ({ ...prev, username: savedUser }));
    }, []);

    const saveName = () => {
        localStorage.setItem("penada_user", newName);
        setProfile(prev => ({ ...prev, username: newName }));
        setIsEditingName(false);
    };

    return (
        <div className="min-h-screen bg-black pb-24 text-white">
            {/* Header con botón atrás */}
            <div className="p-4 flex items-center gap-4">
                <Link href="/home">
                    <button className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </Link>
                <h1 className="text-xl font-graffiti text-primary">Mi Perfil</h1>
            </div>

            <div className="p-6 space-y-8">

                {/* Cabecera del Usuario */}
                <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 bg-gray-800 rounded-full border-4 border-primary p-1">
                        <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                            <User className="w-10 h-10 text-gray-500" />
                        </div>
                    </div>

                    <div className="text-center w-full">
                        {isEditingName ? (
                            <div className="flex gap-2 justify-center">
                                <input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="bg-gray-900 border border-white/20 p-1 rounded text-center"
                                />
                                <button onClick={saveName} className="text-green-500 font-bold">OK</button>
                            </div>
                        ) : (
                            <h2 onClick={() => setIsEditingName(true)} className="text-3xl font-graffiti text-white cursor-pointer hover:text-primary transition-colors">
                                {profile.username} 🖊️
                            </h2>
                        )}
                        <p className="text-gray-400 font-urban font-bold uppercase tracking-widest mt-1">Peñivel {profile.level}</p>
                    </div>
                </div>

                {/* Barra de Experiencia */}
                <div className="glass-panel p-4 space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase text-gray-400">
                        <span>XP Actual</span>
                        <span>{profile.xp} / {profile.maxXp}</span>
                    </div>
                    <div className="h-4 bg-gray-900 rounded-full overflow-hidden border border-white/10">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000"
                            style={{ width: `${(profile.xp / profile.maxXp) * 100}%` }}
                        />
                    </div>
                    <p className="text-center text-xs text-gray-500 italic">Sube fotos para ganar XP</p>
                </div>

                {/* TROFEOS */}
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-gold font-graffiti text-2xl text-yellow-400">
                        <Trophy className="w-6 h-6" /> Trofeos
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                        {[...Array(27)].map((_, i) => {
                            const isUnlocked = profile.trophies[i.toString()];
                            return (
                                <div key={i} className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-all ${isUnlocked
                                        ? "bg-yellow-500/20 border-yellow-500 shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                                        : "bg-gray-900 border-gray-800 opacity-50 grayscale"
                                    }`}>
                                    <Trophy className={`w-6 h-6 ${isUnlocked ? "text-yellow-400" : "text-gray-600"}`} />
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* LOGROS (MEDALLAS) */}
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-cyan-400 font-graffiti text-2xl">
                        <Medal className="w-6 h-6" /> Logros
                    </h3>
                    <div className="grid grid-cols-5 gap-2">
                        {[...Array(27)].map((_, i) => {
                            const isUnlocked = profile.achievements[i.toString()];
                            return (
                                <div key={i} className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-all ${isUnlocked
                                        ? "bg-cyan-500/20 border-cyan-500 shadow-[0_0_10px_rgba(0,255,255,0.5)]"
                                        : "bg-gray-900 border-gray-800 opacity-50 grayscale"
                                    }`}>
                                    <Medal className={`w-6 h-6 ${isUnlocked ? "text-cyan-400" : "text-gray-600"}`} />
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
