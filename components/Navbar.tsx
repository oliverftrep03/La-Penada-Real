"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, MessageCircle, Image, Home, Smile, ShoppingBag, Package } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
    { href: "/home", icon: Home, label: "Inicio", color: "text-primary" },
    { href: "/gallery", icon: Image, label: "Fotos", color: "text-secondary" },
    { href: "/shop", icon: ShoppingBag, label: "Tienda", color: "text-purple-400" },
    { href: "/chat", icon: MessageCircle, label: "Chat", color: "text-green-400" },
    { href: "/map", icon: Map, label: "Mapa", color: "text-accent" },
    { href: "/inventory", icon: Package, label: "Mis Objetos", color: "text-orange-400" },
    { href: "/jokes", icon: Smile, label: "Bromas", color: "text-yellow-400" },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none flex justify-center">
            <div className="bg-metal p-2 flex items-center gap-2 pointer-events-auto shadow-[0_0_20px_rgba(0,0,0,0.5)] max-w-sm w-full justify-between rounded-lg border-2 border-[#444] relative overflow-hidden">
                {/* Screw Heads Decoration */}
                <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-gray-400 shadow-inner border border-gray-600"></div>
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gray-400 shadow-inner border border-gray-600"></div>
                <div className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-gray-400 shadow-inner border border-gray-600"></div>
                <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-gray-400 shadow-inner border border-gray-600"></div>

                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href} className="relative z-10">
                            <motion.div
                                className={`relative flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${isActive ? "bg-black/40 shadow-inner" : "hover:bg-white/5"}`}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Icon className={`w-6 h-6 ${item.color} ${isActive ? "filter drop-shadow-[0_0_5px_currentColor]" : "opacity-70 grayscale"}`} strokeWidth={2.5} />
                                {isActive && (
                                    <motion.div
                                        layoutId="active-dot"
                                        className={`absolute -bottom-1 w-1 h-1 rounded-full ${item.color.replace('text-', 'bg-')} shadow-[0_0_5px_currentColor]`}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
