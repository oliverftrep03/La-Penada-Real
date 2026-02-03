"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, MessageCircle, Image, Home, Smile, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
    { href: "/home", icon: Home, label: "Inicio", color: "text-primary" },
    { href: "/gallery", icon: Image, label: "Fotos", color: "text-secondary" },
    { href: "/shop", icon: ShoppingBag, label: "Tienda", color: "text-purple-400" },
    { href: "/map", icon: Map, label: "Mapa", color: "text-accent" },
    { href: "/chat", icon: MessageCircle, label: "Chat", color: "text-green-400" },
    { href: "/jokes", icon: Smile, label: "Bromas", color: "text-yellow-400" },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none flex justify-center">
            <div className="glass-panel p-2 flex items-center gap-2 pointer-events-auto shadow-2xl max-w-sm w-full justify-between">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href}>
                            <motion.div
                                className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${isActive ? "bg-white/10" : "hover:bg-white/5"}`}
                                whileTap={{ scale: 0.9 }}
                            >
                                <Icon className={`w-6 h-6 ${item.color} ${isActive ? "fill-current" : ""}`} strokeWidth={2.5} />
                                {isActive && (
                                    <motion.div
                                        layoutId="active-dot"
                                        className={`absolute -bottom-1 w-1 h-1 rounded-full bg-white`}
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
