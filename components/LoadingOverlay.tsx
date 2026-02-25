'use client';
import { GraduationCap } from "lucide-react";
export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-[#0B0F1A]/80 backdrop-blur-md">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-3xl border-2 border-purple-400/20 animate-[spin_3s_linear_infinite]" />
        <GraduationCap className="absolute h-10 w-10 text-purple-300 animate-pulse drop-shadow-[0_0_30px_rgba(163,230,53,0.6)]" />

      </div>
    </div>
  );
}
