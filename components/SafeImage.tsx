"use client";

import Image from "next/image";
import { useState } from "react";
import { User } from "lucide-react";

export default function SafeImage({ src, alt, fill, className, width, height, priority }: any) {
    const [error, setError] = useState(false);

    if (error || !src) {
        return (
            <div className={`bg-gray-800 flex items-center justify-center ${className} ${fill ? 'absolute inset-0' : ''}`} style={{ width, height }}>
                <User className="text-gray-500 w-1/2 h-1/2" />
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill={fill}
            width={width}
            height={height}
            className={className}
            priority={priority}
            onError={() => setError(true)}
            unoptimized={true} // Force bypass Next.js optimization for now
        />
    );
}
