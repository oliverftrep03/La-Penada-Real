'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Profile Page Crash:', error);
    }, [error]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white p-6 text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
            <h2 className="text-2xl font-bold mb-4 font-mono">¡Vaya! La página ha petado.</h2>
            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg max-w-md w-full mb-8 overflow-hidden">
                <p className="font-mono text-red-300 text-sm break-words text-left">
                    {error.message || "Error desconocido"}
                </p>
                {error.digest && (
                    <p className="text-xs text-gray-500 mt-2 text-left">Digest: {error.digest}</p>
                )}
            </div>
            <div className="flex gap-4">
                <button
                    onClick={() => reset()}
                    className="bg-[#c0ff00] text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
                >
                    Reintentar
                </button>
                <Link href="/home" className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors flex items-center gap-2">
                    <Home size={18} />
                    Ir al Inicio
                </Link>
            </div>
        </div>
    );
}
