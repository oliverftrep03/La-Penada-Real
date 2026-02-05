"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-hot-toast";
import { Star } from "lucide-react";

// Configuración de Iconos (Hack para Next.js)
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

// Iconos personalizados como Emojis o Imágenes
const createIcon = (type: string, content: string) => {
    // Si es una imagen (Metro/Renfe)
    if (type === 'img') {
        return L.divIcon({
            className: 'custom-emoji-marker',
            html: `<div style="width: 40px; height: 40px; filter: drop-shadow(0 0 4px black); background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><img src="${content}" style="width: 80%; height: 80%; object-fit: contain;" /></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
    }
    // Si es emoji
    return L.divIcon({
        className: 'custom-emoji-marker',
        html: `<div style="font-size: 30px; filter: drop-shadow(0 0 4px black);">${content}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
};

// Logos en Base64/SVG Data URI para máxima fiabilidad
const LOGO_METRO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNNTAgMTBMMTAgNTBMNTAgOTBMOTAgNTBZNTAgMTBaIiBmaWxsPSIjZWMyMTI3IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjUiLz48cmVjdCB4PSIyMCIgeT0iNDIiIHdpZHRoPSI2MCIgaGVpZ2h0PSIxNiIgZmlsbD0iIzE4NWJlZCIvPjwvc3ZnPg==";
const LOGO_RENFE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iIzYzMjU3ZSIvPjx0ZXh0IHg9IjUwIiB5PSI2NSIgZm9udC1zaXplPSIzNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiPlJlbmZlPC90ZXh0Pjwvc3ZnPg==";

const PIN_ICONS = [
    { label: "Birra", type: 'emoji', content: "🍺" },
    { label: "Graffiti", type: 'emoji', content: "🥫" },
    { label: "Metro", type: 'img', content: LOGO_METRO },
    { label: "Renfe", type: 'img', content: LOGO_RENFE },
    { label: "Fumar", type: 'emoji', content: "🚬" },
    { label: "Casa", type: 'emoji', content: "🏠" },
];

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Subcomponente para manejar clicks
function MapEvents({ onMapClick }: { onMapClick: (e: any) => void }) {
    useMapEvents({
        click: (e) => onMapClick(e),
        contextmenu: (e) => onMapClick(e),
    });
    return null;
}

// Subcomponente de Controles de Zoom
function ZoomControls() {
    const map = useMapEvents({});

    return (
        <div className="absolute top-20 right-4 flex flex-col gap-2 z-[1000]">
            <button
                onClick={(e) => { e.stopPropagation(); map.zoomIn(); }}
                className="bg-black/80 text-primary border border-primary p-3 rounded-full shadow-xl hover:bg-white/10 active:scale-95 transition-all text-xl font-bold"
            >
                +
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); map.zoomOut(); }}
                className="bg-black/80 text-primary border border-primary p-3 rounded-full shadow-xl hover:bg-white/10 active:scale-95 transition-all text-xl font-bold"
            >
                −
            </button>
        </div>
    );
}

export default function Map() {
    const [pins, setPins] = useState<any[]>([]);
    const [newPinPos, setNewPinPos] = useState<[number, number] | null>(null);
    const [newPinName, setNewPinName] = useState("");
    const [newPinIcon, setNewPinIcon] = useState(PIN_ICONS[0]);
    const [showLabels, setShowLabels] = useState(true);
    const [highlight, setHighlight] = useState(false);

    // Iconos disponibles (Default + Comprados)
    const [availableIcons, setAvailableIcons] = useState<any[]>(PIN_ICONS);

    // Coordenadas iniciales (Madrid Centro)
    const position: [number, number] = [40.416775, -3.703790];

    useEffect(() => {
        fetchPins();
        fetchMyIcons();
    }, []);

    const fetchMyIcons = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data } = await supabase
                .from("user_inventory")
                .select(`
                    store_items!inner(id, name, type, content)
                `)
                .eq("user_id", session.user.id)
                .eq("store_items.type", "map_icon");

            if (data) {
                const purchased = data.map((i: any) => ({
                    label: i.store_items.name,
                    type: 'emoji', // Assuming store content is emoji for simplicity, or we can add type check
                    content: i.store_items.content
                }));
                setAvailableIcons([...PIN_ICONS, ...purchased]);
            }
        }
    };

    const fetchPins = async () => {
        const { data } = await supabase.from("map_pins").select("*");
        if (data) setPins(data);
    };

    const handleMapClick = (e: any) => {
        setNewPinPos([e.latlng.lat, e.latlng.lng]);
        setNewPinIcon(PIN_ICONS[0]);
        setHighlight(false);
    };

    const savePin = async () => {
        if (!newPinPos || !newPinName) return;

        const user = localStorage.getItem("penada_user") || "Anónimo";

        const { error } = await supabase.from("map_pins").insert([{
            lat: newPinPos[0],
            lng: newPinPos[1],
            title: newPinName,
            author: user,
            category: JSON.stringify({ type: newPinIcon.type, content: newPinIcon.content }),
            highlighted_until: highlight ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null
        }]);

        if (!error) {
            toast.success(highlight ? "¡Sitio destacado por 1h! 🔥" : "¡Sitio guardado!");
            setNewPinPos(null);
            setNewPinName("");
            fetchPins();
        } else {
            toast.error("Error guardando sitio");
        }
    };

    const deletePin = async (id: number) => {
        const { error } = await supabase.from("map_pins").delete().eq('id', id);
        if (!error) {
            toast.success("Sitio eliminado 🗑️");
            fetchPins();
        } else {
            toast.error("Error al eliminar");
        }
    };

    const getPinIcon = (pin: any) => {
        if (!pin.category) return createIcon('emoji', "📍");
        if (!pin.category.startsWith('{')) {
            if (pin.category === 'place') return createIcon('emoji', "📍");
            return createIcon('emoji', pin.category);
        }
        try {
            const data = JSON.parse(pin.category);
            return createIcon(data.type, data.content);
        } catch (e) {
            return createIcon('emoji', "📍");
        }
    }

    return (
        <div className="relative w-full h-full bg-black overflow-hidden">
            <MapContainer
                center={position}
                zoom={12}
                style={{ height: "100%", width: "100%", background: "transparent" }}
                className="z-10 relative"
                zoomControl={false}
            >
                {/* 1. Capa Satélite (Siempre activa, Esri World Imagery) */}
                <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />

                {/* 2. Capa de Etiquetas (Toggle) - Usamos CartoDark Labels para que se vean bien sobre satélite */}
                {showLabels && (
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}{r}.png"
                        opacity={1}
                        zIndex={500}
                    />
                )}

                <MapEvents onMapClick={handleMapClick} />
                <ZoomControls />

                {/* Pines Guardados */}
                {pins.map((pin) => (
                    <Marker
                        key={pin.id}
                        position={[pin.lat, pin.lng]}
                        icon={getPinIcon(pin)}
                    >
                        <Popup>
                            <div className="text-center min-w-[150px]">
                                <h3 className="font-bold text-lg leading-none mb-1">{pin.title}</h3>
                                <div className="flex justify-between items-center mt-2 border-t pt-2 border-gray-200">
                                    <span className="text-xs text-gray-500">@{pin.author}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deletePin(pin.id);
                                        }}
                                        className="text-red-500 hover:text-red-700 bg-red-100 p-1 rounded transition-colors"
                                        title="Eliminar sitio"
                                        style={{ pointerEvents: 'auto' }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Marcador Temporal */}
                {newPinPos && (
                    <Marker position={newPinPos} icon={createIcon(newPinIcon.type, newPinIcon.content)} opacity={0.6}>
                        <Popup>Nuevo Sitio</Popup>
                    </Marker>
                )}
            </MapContainer>

            {/* Controles Flotantes Superiores */}
            <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 items-start">
                {/* Toggle Etiquetas (Único botón restante) */}
                <button
                    onClick={(e) => { e.stopPropagation(); setShowLabels(!showLabels); }}
                    className={`glass-panel py-2 px-4 rounded-full text-xs font-bold border transition-all flex items-center gap-2 shadow-lg backdrop-blur-md ${showLabels ? 'border-primary text-primary bg-primary/10' : 'border-gray-500 text-gray-400 bg-black/50'}`}
                >
                    {showLabels ? '👁️ CON NOMBRES' : '🚫 SIN NOMBRES'}
                </button>
            </div>

            {/* Modal Crear Pin */}
            {newPinPos && (
                <div
                    className="absolute bottom-24 left-4 right-4 bg-black/95 p-4 rounded-xl border-2 border-primary z-[1000] flex flex-col gap-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-5"
                    onClick={(e) => e.stopPropagation()}
                >

                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-primary font-graffiti text-xl">📍 Nuevo Spot</h3>
                        <button onClick={() => setNewPinPos(null)} className="text-gray-500 hover:text-white">✕</button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {availableIcons.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => setNewPinIcon(item)}
                                className={`flex flex-col items-center justify-center min-w-[50px] aspect-square rounded-lg border transition-all ${newPinIcon.content === item.content ? "bg-primary/20 border-primary scale-110" : "bg-white/5 border-transparent hover:bg-white/10"}`}
                            >
                                {item.type === 'emoji' ? (
                                    <span className="text-2xl drop-shadow-md">{item.content}</span>
                                ) : (
                                    <img src={item.content} className="w-8 h-8 object-contain drop-shadow-md" />
                                )}
                            </button>
                        ))}
                    </div>

                    <label className="flex items-center gap-2 bg-white/5 p-3 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10">
                        <input
                            type="checkbox"
                            checked={highlight}
                            onChange={(e) => setHighlight(e.target.checked)}
                            className="w-5 h-5 accent-accent"
                        />
                        <div className="flex flex-col">
                            <span className="font-bold text-white text-sm">📢 Avisar al Grupo</span>
                            <span className="text-[10px] text-gray-400">Destacar en Inicio durante 1h</span>
                        </div>
                    </label>

                    <input
                        autoFocus
                        placeholder="Nombre del sitio..."
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 font-bold focus:outline-none focus:border-primary"
                        value={newPinName}
                        onChange={(e) => setNewPinName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && savePin()}
                    />

                    <button
                        onClick={savePin}
                        className="w-full bg-primary text-black py-3 rounded-lg font-black tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_15px_#c0ff00]"
                    >
                        GUARDAR SITIO
                    </button>
                </div>
            )}
        </div>
    );
}
