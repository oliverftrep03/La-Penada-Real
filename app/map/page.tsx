"use client";

import Navbar from "@/components/Navbar";
import dynamic from "next/dynamic";

// Leaflet necesita importarse dinámicamente para evitar errores de SSR
const MapComponent = dynamic(() => import("@/components/Map"), {
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center text-gray-500">Cargando mapa...</div>
});

export default function MapPage() {
    return (
        <div className="relative min-h-screen bg-black">
            <div className="absolute top-4 left-4 z-10 glass-panel px-4 py-2">
                <h1 className="font-graffiti text-accent text-xl">Mapa del Grupo 🗺️</h1>
            </div>

            {/* Contenedor del mapa */}
            <div className="h-screen w-full">
                <MapComponent />
            </div>

            <Navbar />
        </div>
    );
}
