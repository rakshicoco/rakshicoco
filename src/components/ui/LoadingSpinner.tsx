import Image from "next/image";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  className?: string;
}

export function LoadingSpinner({
  message = "Loading...",
  size = 64,
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-6 space-y-4", className)}>
      <div className="relative flex items-center justify-center">
        {/* Glowing pulse ring */}
        <div 
          className="absolute rounded-full bg-primary/20 animate-ping"
          style={{ width: size + 24, height: size + 24 }}
        />
        
        {/* Rotating border spinner */}
        <div 
          className="absolute rounded-full border-2 border-primary/30 border-t-primary animate-spin"
          style={{ width: size + 16, height: size + 16 }}
        />

        {/* Logo Container */}
        <div 
          className="relative rounded-2xl bg-white dark:bg-slate-900 p-2 shadow-md border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden"
          style={{ width: size, height: size }}
        >
          <Image
            src="/logo.png"
            alt="Rakshi Coco"
            width={size}
            height={size}
            className="object-contain animate-pulse"
            priority
          />
        </div>
      </div>

      {message && (
        <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
