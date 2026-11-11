import { StatusBadge } from "@/components/StatusBadge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatarData, ordenarConsultas, type Cliente } from "@/lib/clientes";
import { cn } from "@/lib/utils";

export function HistoricoSheet({
  cliente,
  onFechar,
}: {
  cliente: Cliente | null;
  onFechar: () => void;
}) {
  const consultas = cliente ? ordenarConsultas(cliente.consultas) : [];
  const realizadas = consultas.filter((c) => c.status === "realizada").length;

  return (
    <Sheet open={!!cliente} onOpenChange={(v) => !v && onFechar()}>
      <SheetContent className="w-full overflow-y-auto bg-background sm:max-w-md">
        <SheetHeader className="text-left">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">Histórico de consultas</p>
          <SheetTitle className="font-display text-3xl font-medium">{cliente?.nome}</SheetTitle>
          <SheetDescription>
            {consultas.length === 0
              ? "Nenhuma consulta registrada."
              : `${consultas.length} consulta(s) · ${realizadas} realizada(s)`}
          </SheetDescription>
        </SheetHeader>

        {consultas.length > 0 && (
          <ol className="mt-8 space-y-0 border-l border-border pl-6">
            {consultas.map((c) => (
              <li key={c.id} className="relative pb-6 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[1.85rem] top-1.5 size-2.5 rounded-full ring-4 ring-background",
                    c.status === "agendada" ? "bg-gold" : "bg-foreground/60",
                  )}
                />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {formatarData(c.data)} <span className="text-muted-foreground">· {c.hora}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">{c.psicologo}</p>
                    {c.observacao && (
                      <p className="mt-1 text-sm italic text-muted-foreground">{c.observacao}</p>
                    )}
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </SheetContent>
    </Sheet>
  );
}
