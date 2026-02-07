"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Loader2, Crown, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

const AVAILABLE_NAMES = [
    "Peñaordenador",
    "Peñorb",
    "Peñarka",
    "Peñezy",
    "Peñodek",
    "Peñimo",
    "Peñezar"
];

export default function SetupPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [takenNames, setTakenNames] = useState<string[]>([]);
    const [selectedName, setSelectedName] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        checkUser();
        fetchTakenNames();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.replace("/");
            return;
        }
        setUser(session.user);
        setLoading(false);
    };

    const fetchTakenNames = async () => {
        const { data, error } = await supabase
            .from("profiles")
            .select("group_name");

        if (data) {
            setTakenNames(data.map(p => p.group_name));
        }
    };

    const handleCreateProfile = async () => {
        if (!selectedName || !user) return;
        setCreating(true);

        const { error } = await supabase
            .from("profiles")
            .insert({
                id: user.id,
                email: user.email || null,
                group_name: selectedName,
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                description: "Nuevo miembro de la realeza.",
                xp: 0,
                level: 1,
                coins: 0,
                frames_unlocked: ['basic'],
                current_frame: 'basic'
            });

        if (error) {
            console.error(error);
            toast.error("Error al crear perfil. Intenta otro nombre.");
            setCreating(false);
        } else {
            toast.success(`¡Bienvenido, ${selectedName}! 👑`);
            router.replace("/home");
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black text-[#c0ff00]">
                <Loader2 className="animate-spin h-12 w-12" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="text-center mb-10 space-y-2">
                <Crown className="w-16 h-16 text-[#c0ff00] mx-auto mb-4 animate-bounce" />
                <h1 className="text-3xl font-bold font-graffiti">Elige tu Identidad (v3)</h1>
                <p className="text-gray-400">
                    Solo uno puede poseer cada nombre. <br /> Elige sabiamente.
                </p>
            </div>

            <div className="grid grid-cols-1 w-full gap-4">
                {AVAILABLE_NAMES.map((name) => {
                    const isTaken = takenNames.includes(name);
                    const isSelected = selectedName === name;

                    return (
                        <button
                            key={name}
                            disabled={isTaken}
                            onClick={() => setSelectedName(name)}
                            className={`
                                relative p-4 rounded-xl border-2 text-left transition-all duration-300 flex justify-between items-center
                                ${isTaken
                                    ? "border-gray-800 bg-gray-900 text-gray-600 cursor-not-allowed opacity-50"
                                    : isSelected
                                        ? "border-[#c0ff00] bg-[#c0ff00]/10 text-[#c0ff00] shadow-[0_0_20px_rgba(192,255,0,0.2)] scale-105"
                                        : "border-gray-800 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-800"
                                }
                            `}
                        >
                            <span className="font-bold text-lg">{name}</span>
                            {isTaken && <span className="text-xs uppercase font-bold text-red-500">Ocupado</span>}
                            {isSelected && <Crown className="w-5 h-5 fill-current" />}
                        </button>
                    );
                })}
            </div>

            <button
                disabled={!selectedName || creating}
                onClick={handleCreateProfile}
                className={`
                    mt-10 w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all
                    ${!selectedName
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                        : "bg-[#c0ff00] text-black hover:shadow-[0_0_30px_rgba(192,255,0,0.4)] hover:scale-105"
                    }
                `}
            >
                {creating ? (
                    <Loader2 className="animate-spin" />
                ) : (
                    <>
                        Confirmar Identidad <ChevronRight />
                    </>
                )}
            </button>
        </div>
    );
}
