"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Loader2, Crown, ChevronRight, UserCheck, UserPlus, AlertTriangle } from "lucide-react";
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
    const [profiles, setProfiles] = useState<any[]>([]);
    const [selectedName, setSelectedName] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [step, setStep] = useState<'welcome' | 'create' | 'recover'>('welcome');

    useEffect(() => {
        checkUser();
        fetchProfiles();
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

    const fetchProfiles = async () => {
        const { data } = await supabase.from("profiles").select("group_name, id");
        if (data) setProfiles(data);
    };

    const handleCreateProfile = async () => {
        if (!selectedName || !user) return;
        setCreating(true);

        const { error } = await supabase
            .from("profiles")
            .insert({
                id: user.id, // Primary Key is Auth ID
                email: user.email, // Explicitly save email
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
            toast.error("Error al crear. Intenta con otro nombre.");
            setCreating(false);
        } else {
            toast.success(`¡Bienvenido, ${selectedName}! 👑`);
            router.replace("/home");
        }
    };

    const handleRecoverAccount = async () => {
        if (!selectedName || !user) return;

        // Final Confirmation
        const confirmMsg = `¿Confirma que eres ${selectedName}?\n\nTu correo (${user.email}) quedará vinculado PARA SIEMPRE a este usuario.\n\nEsto no se puede deshacer.`;
        if (!window.confirm(confirmMsg)) return;

        setCreating(true);
        try {
            const { error } = await supabase.rpc('claim_profile', { target_username: selectedName });
            if (error) throw error;

            toast.success(`¡Cuenta RECUPERADA! Disfruta, ${selectedName}.`);
            router.replace("/home");
        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Error al vincular. Inténtalo de nuevo.");
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

    /* STEP 1: WELCOME Selection */
    if (step === 'welcome') {
        return (
            <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center max-w-md mx-auto text-center animate-in fade-in slide-in-from-bottom-4">
                <Crown className="w-20 h-20 text-[#c0ff00] mb-6 animate-pulse" />
                <h1 className="text-3xl font-graffiti mb-2">Identidad Real</h1>
                <p className="text-gray-400 mb-8 max-w-xs mx-auto">
                    Has iniciado sesión con <span className="text-white font-bold">{user?.email}</span>.
                    <br /><br />
                    ¿Tienes ya un personaje en La Peñada Real?
                </p>

                <div className="w-full space-y-4">
                    <button
                        onClick={() => setStep('recover')}
                        className="w-full bg-[#c0ff00] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(192,255,0,0.3)]"
                    >
                        <UserCheck size={24} /> SÍ, YA TENGO CUENTA
                    </button>

                    <button
                        onClick={() => setStep('create')}
                        className="w-full bg-gray-900 border border-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors"
                    >
                        <UserPlus size={24} /> NO, SOY NUEVO
                    </button>
                </div>
            </div>
        );
    }

    /* STEP 2: RECOVER Logic */
    if (step === 'recover') {
        // Filter out profiles that are "taken" by OTHER Google accounts? 
        // Actually, we just show ALL profiles. If linking fails (because collision with another REAL email), RPC handles it.
        // We filter out the CURRENT user's temporary profile if it exists in the list to avoid confusion.
        const claimableProfiles = profiles.filter(p => p.id !== user.id);

        return (
            <div className="min-h-screen bg-black text-white p-6 flex flex-col max-w-md mx-auto animate-in slide-in-from-right-8">
                <button onClick={() => setStep('welcome')} className="text-gray-500 mb-6 hover:text-white self-start">
                    ← Volver
                </button>

                <h2 className="text-2xl font-bold font-graffiti text-[#c0ff00] mb-2">Reclamar Identidad</h2>
                <p className="text-gray-400 text-sm mb-6">
                    Selecciona tu personaje antiguo. <br />
                    <span className="text-yellow-500 flex items-center gap-1 mt-1 font-bold">
                        <AlertTriangle size={12} /> Se vinculará para siempre a tu email.
                    </span>
                </p>

                <div className="grid gap-3 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                    {claimableProfiles.length === 0 && <p className="text-center text-gray-500 py-10">No se encontraron perfiles.</p>}

                    {claimableProfiles.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedName(p.group_name)}
                            className={`
                                p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center
                                ${selectedName === p.group_name
                                    ? "border-[#c0ff00] bg-[#c0ff00]/10 text-white shadow-[0_0_15px_rgba(192,255,0,0.2)]"
                                    : "border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-600"
                                }
                            `}
                        >
                            <span className="font-bold text-lg">{p.group_name}</span>
                            {selectedName === p.group_name && <UserCheck className="text-[#c0ff00]" />}
                        </button>
                    ))}
                </div>

                <div className="mt-auto pt-6">
                    <button
                        disabled={!selectedName || creating}
                        onClick={handleRecoverAccount}
                        className={`
                            w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all
                            ${!selectedName
                                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                : "bg-[#c0ff00] text-black hover:scale-105 shadow-lg"
                            }
                        `}
                    >
                        {creating ? <Loader2 className="animate-spin" /> : "VINCULAR AHORA"}
                    </button>
                </div>
            </div>
        );
    }

    /* STEP 3: CREATE Logic */
    return (
        <div className="min-h-screen bg-black text-white p-6 flex flex-col max-w-md mx-auto animate-in slide-in-from-right-8">
            <button onClick={() => setStep('welcome')} className="text-gray-500 mb-6 hover:text-white self-start">
                ← Volver
            </button>

            <h2 className="text-2xl font-bold font-graffiti text-white mb-2">Crear Nuevo</h2>
            <p className="text-gray-400 text-sm mb-6">Elige un nombre disponible para empezar tu leyenda.</p>

            <div className="grid gap-3 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                {AVAILABLE_NAMES.map(name => {
                    // Check if name is taken by ANY profile
                    const isTaken = profiles.some(p => p.group_name === name);
                    return (
                        <button
                            key={name}
                            disabled={isTaken}
                            onClick={() => setSelectedName(name)}
                            className={`
                                p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center
                                ${isTaken
                                    ? "border-transparent bg-gray-900 text-gray-700 cursor-not-allowed opacity-50"
                                    : selectedName === name
                                        ? "border-white bg-white text-black font-bold scale-105"
                                        : "border-gray-800 bg-gray-900/50 text-gray-300 hover:border-gray-600"
                                }
                            `}
                        >
                            <span>{name}</span>
                            {isTaken && <span className="text-[10px] uppercase font-bold text-red-900 bg-red-500/20 px-2 rounded">Ocupado</span>}
                        </button>
                    );
                })}
            </div>

            <div className="mt-auto pt-6">
                <button
                    disabled={!selectedName || creating}
                    onClick={handleCreateProfile}
                    className={`
                        w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all
                        ${!selectedName
                            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                            : "bg-white text-black hover:scale-105 shadow-lg"
                        }
                    `}
                >
                    {creating ? <Loader2 className="animate-spin" /> : "CREAR PERSONAJE"}
                </button>
            </div>
        </div>
    );
}
