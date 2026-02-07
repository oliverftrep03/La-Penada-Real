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
    const [mode, setMode] = useState<'create' | 'recover'>('create');
    const [recoveryName, setRecoveryName] = useState<string | null>(null);

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
        const { data } = await supabase.from("profiles").select("group_name");
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
            toast.error("Error al crear perfil.");
            setCreating(false);
        } else {
            toast.success(`¡Bienvenido, ${selectedName}! 👑`);
            router.replace("/home");
        }
    };

    const handleRecoverAccount = async () => {
        if (!recoveryName || !user) return;
        if (!confirm(`¿Seguro que eres ${recoveryName}? Se vinculará a tu cuenta de Google actual.`)) return;

        setCreating(true);
        try {
            const { error } = await supabase.rpc('claim_profile', { target_username: recoveryName });
            if (error) throw error;

            toast.success(`¡Cuenta recuperada! Hola de nuevo, ${recoveryName}.`);
            router.replace("/home");
        } catch (e) {
            console.error(e);
            toast.error("Error al recuperar. Puede que ya esté vinculada.");
            setCreating(false);
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
            <div className="text-center mb-8 space-y-2">
                <Crown className="w-16 h-16 text-[#c0ff00] mx-auto mb-4 animate-bounce" />
                <h1 className="text-3xl font-bold font-graffiti">Identidad Real</h1>
                <p className="text-gray-400 text-sm">
                    Iniciaste sesión como <br /> <span className="text-white font-bold">{user?.email}</span>
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-gray-900/50 p-1 rounded-full mb-8 border border-white/10 w-full">
                <button
                    onClick={() => setMode('create')}
                    className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${mode === 'create' ? 'bg-[#c0ff00] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Nuevo Usuario
                </button>
                <button
                    onClick={() => setMode('recover')}
                    className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${mode === 'recover' ? 'bg-[#c0ff00] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Recuperar Cuenta
                </button>
            </div>

            {mode === 'create' ? (
                <>
                    <p className="text-gray-400 mb-4 text-sm">Elige un nombre disponible:</p>
                    <div className="grid grid-cols-1 w-full gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
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
                                    <span className="font-bold">{name}</span>
                                    {isTaken && <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">Ocupado</span>}
                                    {isSelected && <Crown className="w-5 h-5 fill-current" />}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        disabled={!selectedName || creating}
                        onClick={handleCreateProfile}
                        className={`
                            mt-8 w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all
                            ${!selectedName
                                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                : "bg-[#c0ff00] text-black hover:shadow-[0_0_30px_rgba(192,255,0,0.4)] hover:scale-105"
                            }
                        `}
                    >
                        {creating ? <Loader2 className="animate-spin" /> : <>Confirmar Identidad <ChevronRight /></>}
                    </button>
                </>
            ) : (
                <>
                    <p className="text-gray-400 mb-4 text-sm">¿Quién eras en la vida pasada?</p>
                    <div className="grid grid-cols-1 w-full gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                        {takenNames.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No hay cuentas para recuperar.</p>
                        ) : (
                            takenNames.map((name) => {
                                const isSelected = recoveryName === name;
                                return (
                                    <button
                                        key={name}
                                        onClick={() => setRecoveryName(name)}
                                        className={`
                                            relative p-4 rounded-xl border-2 text-left transition-all duration-300 flex justify-between items-center
                                            ${isSelected
                                                ? "border-[#c0ff00] bg-[#c0ff00]/10 text-[#c0ff00] shadow-[0_0_20px_rgba(192,255,0,0.2)] scale-105"
                                                : "border-gray-800 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-800"
                                            }
                                        `}
                                    >
                                        <span className="font-bold">{name}</span>
                                        {isSelected && <Crown className="w-5 h-5 fill-current" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                    <button
                        disabled={!recoveryName || creating}
                        onClick={handleRecoverAccount}
                        className={`
                            mt-8 w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all
                            ${!recoveryName
                                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                : "bg-[#c0ff00] text-black hover:shadow-[0_0_30px_rgba(192,255,0,0.4)] hover:scale-105"
                            }
                        `}
                    >
                        {creating ? <Loader2 className="animate-spin" /> : <>Recuperar Cuenta <ChevronRight /></>}
                    </button>
                </>
            )}
        </div>
    );
}
