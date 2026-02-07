"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [manualCode, setManualCode] = useState("");

    useEffect(() => {
        // Stop if not configured
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }

        // Check initial session
        checkSession();

        // Listen for auth changes (login, logout, etc.)
        const { data: { subscription } } = supabase!.auth.onAuthStateChange((event: string, session: any) => {
            if (event === 'SIGNED_IN' && session) {
                checkSession();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const checkSession = async () => {
        if (!supabase) return;

        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
            // Usuario logueado, comprobamos si tiene perfil creado
            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .single();

            if (profile) {
                // Ya tiene perfil (Peñorb, etc.) -> A casa
                router.replace("/home");
            } else {
                // No tiene perfil -> A elegir nombre
                router.replace("/setup");
            }
        } else {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!supabase) return;

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) {
            toast.error("Error al iniciar con Google");
            console.error(error);
        }
    };

    // SETUP REQUIRED SCREEN (Vercel Fix)
    if (!isSupabaseConfigured) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-white p-6 text-center">
                <AlertTriangle className="h-16 w-16 text-yellow-500 mb-6 animate-pulse" />
                <h1 className="text-3xl font-bold mb-4 font-mono">Configuración Requerida</h1>
                <p className="text-gray-400 max-w-lg mb-8">
                    La aplicación se ha desplegado correctamente, pero no puede conectar con la base de datos.
                </p>
                <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10 text-left w-full max-w-lg">
                    <h3 className="font-bold text-[#c0ff00] mb-2">Pasos para arreglar en Vercel:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                        <li>Ve a tu proyecto en <strong>Vercel Dashboard</strong>.</li>
                        <li>Entra en <strong>Settings</strong> {'>'} <strong>Environment Variables</strong>.</li>
                        <li>Añade las siguientes claves (cópialas de tu archivo <code>.env.local</code> o de Supabase):</li>
                    </ol>
                    <div className="mt-4 space-y-2 bg-black p-4 rounded border border-white/5 font-mono text-xs text-gray-500">
                        <div>NEXT_PUBLIC_SUPABASE_URL</div>
                        <div>NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
                    </div>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-8 bg-white text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform"
                >
                    Recargar Página
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <Loader2 className="h-10 w-10 animate-spin text-[#c0ff00]" />
            </div>
        );
    }

    return (
        <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-black text-white">
            {/* Background Image/Gradient */}
            <div className="absolute inset-0 z-0 opacity-50">
                <Image
                    src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2670&auto=format&fit=crop"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90"></div>
            </div>

            <div className="z-10 flex flex-col items-center gap-8 p-6 text-center animate-in fade-in zoom-in duration-500 w-full max-w-md">
                {/* Logo / Title */}
                <div className="space-y-4 flex flex-col items-center">
                    <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-[#c0ff00] shadow-[0_0_30px_rgba(192,255,0,0.3)] bg-black/50">
                        <Image
                            src="/logo.svg"
                            alt="La Peñada Real"
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                    <h1 className="text-3xl font-graffiti text-white mt-4">La Peñada Real</h1>
                </div>

                <p className="max-w-xs text-gray-300 font-medium">
                    Entra y reclama tu lugar en la historia.
                </p>

                <div className="flex flex-col gap-4 w-full">
                    {/* Google Button */}
                    <button
                        onClick={handleGoogleLogin}
                        className="group relative flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] active:scale-95 w-full"
                    >
                        <svg className="h-6 w-6" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Iniciar con Google
                    </button>

                    <div className="relative flex items-center justify-center">
                        <span className="bg-black px-2 text-gray-500 text-sm">O entra manualmente</span>
                        <div className="absolute inset-0 h-px bg-gray-800 -z-10"></div>
                    </div>

                    {/* Manual Code Section */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleManualLogin(manualCode);
                        }}
                        className="flex flex-col gap-2"
                    >
                        <input
                            type="password"
                            placeholder="Introduce el Código Real"
                            className="bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#c0ff00] transistion-colors text-center"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="bg-[#c0ff00] text-black font-bold py-2 rounded-lg hover:bg-[#a0d600] transition-colors"
                        >
                            Entrar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );

    async function handleManualLogin(code: string) {
        if (!supabase) {
            toast.error("Error crítico: Conexión a Base de Datos no inicializada.");
            return;
        }

        if (code === 'Peñaseña') {
            toast.loading("Verificando...");
            const { error } = await supabase.auth.signInAnonymously();
            if (error) {
                toast.dismiss();
                toast.error("Error de autenticación anónima. Habilítala en Supabase.");
                console.error(error);
            } else {
                toast.success("Código aceptado.");
                checkSession();
            }
        } else {
            toast.error("Código incorrecto. No eres digno.");
        }
    }
}
