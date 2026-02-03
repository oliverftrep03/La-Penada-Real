"use client";

import Navbar from "@/components/Navbar";
import { Plus } from "lucide-react";

export default function Gallery() {
    return (
        <div className="min-h-screen bg-black pb-24">
            <header className="sticky top-0 z-10 p-4 bg-black/80 backdrop-blur-md flex justify-between items-center border-b border-white/10">
                <h1 className="font-graffiti text-2xl text-secondary">La Galería</h1>
                <button className="bg-white/10 p-2 rounded-full hover:bg-white/20">
                    <Plus className="w-6 h-6 text-white" />
                </button>
            </header>

            <div className="p-1 space-y-1">
                {/* Grid de Fotos (simulado) */}
                <div className="grid grid-cols-3 gap-1">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="aspect-square bg-gray-800 relative">
                            <img
                                src={`https://picsum.photos/300?random=${i + 10}`}
                                alt="Gallery Item"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <Navbar />
        </div>
    );
}
