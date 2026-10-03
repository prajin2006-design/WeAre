"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Film } from "lucide-react";

interface SafeImageProps extends Omit<ImageProps, "onError"> {
  fallbackTitle?: string;
}

export default function SafeImage({
  src,
  alt,
  fallbackTitle,
  className = "",
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-surface to-background border border-border/40 p-4 text-center ${className}`}
      >
        <div className="flex flex-col items-center gap-1.5 opacity-60">
          <Film className="h-6 w-6 text-accent" />
          {fallbackTitle && (
            <span className="text-[10px] font-semibold text-white/70 line-clamp-2">
              {fallbackTitle}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || "WeAre Media"}
      className={className}
      unoptimized
      onError={() => setError(true)}
      {...props}
    />
  );
}
