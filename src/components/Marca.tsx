import { cn } from "@/lib/utils";

export function Marca({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/70 font-display text-2xl italic text-gold">
        D
      </span>
      <span className="leading-none">
        <span className="block font-display text-2xl tracking-wide">Dúctil</span>
        <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.35em] opacity-70">
          Psicologia
        </span>
      </span>
    </div>
  );
}
