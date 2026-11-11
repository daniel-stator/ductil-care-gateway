import { Badge } from "@/components/ui/badge";
import { statusLabel, type StatusConsulta } from "@/lib/clientes";
import { cn } from "@/lib/utils";

const estiloStatus: Record<StatusConsulta, string> = {
  realizada: "border-transparent bg-secondary text-secondary-foreground",
  agendada: "border-transparent bg-gradient-gold text-primary-foreground",
  faltou: "border-destructive/40 bg-transparent text-destructive",
  cancelada: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: StatusConsulta; className?: string }) {
  return (
    <Badge variant="outline" className={cn("shrink-0", estiloStatus[status], className)}>
      {statusLabel[status]}
    </Badge>
  );
}
