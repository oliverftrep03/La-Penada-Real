import type { Metadata, Viewport } from "next";
import { Inter, Permanent_Marker } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-urban" });
const permanentMarker = Permanent_Marker({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-graffiti"
});

export const metadata: Metadata = {
    title: "La Peñada Real",
    description: "App privada del grupo",
    manifest: "/manifest.json",
    icons: {
        icon: "/logo.svg",
        apple: "/logo.svg",
    },
    themeColor: "#000000",
};

export const viewport: Viewport = {
    themeColor: "#0f0f0f",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={`${inter.variable} ${permanentMarker.variable} bg-background min-h-screen`}>
                <ThemeProvider>
                    <main className="max-w-md mx-auto min-h-screen relative overflow-hidden shadow-2xl bg-[#121212]">
                        {children}
                    </main>
                </ThemeProvider>
            </body>
        </html>
    );
}
