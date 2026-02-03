"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";

export default function Jokes() {
    const [currentJoke, setCurrentJoke] = useState("¡Dale al botón para reírte!");

    const jokes = [
        "Como dijo el Kike: 'Yo controlo' (y se cayó)",
        "Clásico: Ir a por hielo y volver sin hielo",
        "La regla de oro: Lo que pasa en la peña, se queda en la peña",
        "¿Te acuerdas de aquel verano del 2023? 😂",
    ];

    const handleRandom = () => {
        const random = jokes[Math.floor(Math.random() * jokes.length)];
        setCurrentJoke(random);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-[#1a1a1a] text-center pb-20">

            <div className="space-y-8 max-w-xs relative">
                <h1 className="text-4xl font-graffiti text-white rotate-[-3deg]">Bromas Internas</h1>

                <div className="min-h-[200px] flex items-center justify-center p-6 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl transform rotate-[2deg]">
                    <p className="font-urban text-2xl font-bold text-primary">{currentJoke}</p>
                </div>

                <button
                    onClick={handleRandom}
                    className="sticker-btn text-2xl w-full"
                >
                    OTRA FRASE 🎲
                </button>
            </div>

            <Navbar />
        </div>
    );
}
