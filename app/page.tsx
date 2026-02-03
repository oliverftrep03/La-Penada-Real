"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Login() {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    const handleLogin = () => {
        // Código temporal para pruebas "1234"
        if (code === "1234") {
            localStorage.setItem("penada_user", name);
            router.push("/home");
        } else {
            setError("¡Código incorrecto colega! 🚫");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
            {/* Fondo decorativo (simulado) */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549301046-27ec9f06bf8a?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20 pointer-events-none" />

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="z-10 w-full max-w-xs space-y-8"
            >
                <div className="text-center space-y-2">
                    <h1 className="font-graffiti text-5xl text-primary drop-shadow-[2px_2px_0px_rgba(255,255,255,0.5)] rotate-[-5deg]">
                        La Peñada <br /> Real
                    </h1>
                    <p className="text-gray-400 font-urban">Zona Privada • Solo Miembros</p>
                </div>

                <div className="glass-panel p-6 space-y-4 shadow-xl">
                    <div className="space-y-1">
                        <label className="text-secondary font-bold text-sm uppercase">Tu Apodo</label>
                        <input
                            type="text"
                            placeholder="El Kike"
                            className="w-full bg-black/50 border border-white/20 p-3 rounded-lg text-white focus:outline-none focus:border-primary transition-colors font-urban"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-accent font-bold text-sm uppercase">Código Secreto</label>
                        <input
                            type="password"
                            placeholder="• • • •"
                            className="w-full bg-black/50 border border-white/20 p-3 rounded-lg text-white focus:outline-none focus:border-accent transition-colors font-urban text-center tracking-widest text-xl"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                    </div>

                    {error && <p className="text-red-500 text-center font-bold text-sm">{error}</p>}

                    <button
                        onClick={handleLogin}
                        disabled={!name || !code}
                        className="w-full sticker-btn mt-4 disabled:opacity-50 disabled:rotate-0 disabled:scale-100"
                    >
                        ENTRAR 🤘
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
