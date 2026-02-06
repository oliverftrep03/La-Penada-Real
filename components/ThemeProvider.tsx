import { Toaster } from "react-hot-toast";

// ... existing code ...

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // ... existing hook logic ...

    return (
        <ThemeContext.Provider value={{ theme, updateTheme }}>
            {children}
            <Toaster position="bottom-center" />
        </ThemeContext.Provider>
    );
}
colors: {
    primary: string;
    secondary: string;
    accent: string;
};
backgrounds: {
    home: string;
    chat: string;
    map: string;
    gallery: string;
    jokes: string;
};
}

const defaultTheme: AppTheme = {
    colors: { primary: "#c0ff00", secondary: "#ff00ff", accent: "#00ffff" },
    backgrounds: { home: "", chat: "", map: "", gallery: "", jokes: "" },
};

const ThemeContext = createContext<{
    theme: AppTheme;
    updateTheme: (newTheme: Partial<AppTheme>) => Promise<void>;
}>({
    theme: defaultTheme,
    updateTheme: async () => { },
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<AppTheme>(defaultTheme);

    // 1. Cargar tema inicial
    useEffect(() => {
        const fetchTheme = async () => {
            const { data } = await supabase
                .from("app_config")
                .select("theme")
                .single();

            if (data?.theme) {
                setTheme(data.theme);
                applyColors(data.theme.colors);
            }
        };

        fetchTheme();

        // 2. Escuchar cambios en tiempo real
        const channel = supabase
            .channel("config_updates")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "app_config" },
                (payload) => {
                    const newTheme = payload.new.theme as AppTheme;
                    setTheme(newTheme);
                    applyColors(newTheme.colors);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, []);

    const applyColors = (colors: AppTheme["colors"]) => {
        const root = document.documentElement;
        if (colors.primary) root.style.setProperty("--primary", colors.primary);
        if (colors.secondary) root.style.setProperty("--secondary", colors.secondary);
        if (colors.accent) root.style.setProperty("--accent", colors.accent);
    };

    const updateTheme = async (updates: Partial<AppTheme>) => {
        const newTheme = { ...theme, ...updates };
        setTheme(newTheme);
        applyColors(newTheme.colors);

        // Guardar en DB (Asumimos ID 1 para la config global)
        // Primero intentamos update, si no existe insertamos (aunque el SQL ya creó la row)
        const { error } = await supabase
            .from("app_config")
            .update({ theme: newTheme })
            .eq("id", 1); // Asegúrate de que tu row tiene ID 1 o ajusta esto

        if (error) console.error("Error guardando tema:", error);
    };

    return (
        <ThemeContext.Provider value={{ theme, updateTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
