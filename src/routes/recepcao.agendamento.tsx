import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

import { formatarData, useClientes } from "@/lib/clientes";

export const Route = createFileRoute("/recepcao/agendamento")({
  head: () => ({
    meta: [
      { title: "Agendamento · Recepção Dúctil Psicologia" },
      { name: "description", content: "Próximas consultas agendadas na clínica Dúctil Psicologia." },
      { property: "og:title", content: "Agendamento · Recepção Dúctil Psicologia" },
      { property: "og:description", content: "Próximas consultas agendadas na clínica Dúctil Psicologia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgendamentoPage,
});

function AgendamentoPage() {
  const clientes = useClientes();
  const proximas = clientes
    .flatMap((cl) =>
      cl.consultas.filter((c) => c.status === "agendada").map((c) => ({ ...c, cliente: cl.nome })),
    )
    .sort((a, b) => `${a.data} ${a.hora}`.localeCompare(`${b.data} ${b.hora}`));

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 lg:py-12">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">Recepção</p>
      <h1 className="mt-2 font-display text-4xl font-medium text-foreground sm:text-5xl">Agendamento</h1>
      <p className="mt-1 text-muted-foreground">Próximas consultas marcadas</p>

      <ul className="mt-8 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-soft">
        {proximas.map((c) => (
          <li key={c.id} className="flex items-center gap-4 px-5 py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-gold-deep">
              <CalendarDays className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{c.cliente}</p>
              <p className="text-sm text-muted-foreground">{c.psicologo}</p>
            </div>
            <div className="text-right tabular-nums">
              <p className="font-medium">{formatarData(c.data)}</p>
              <p className="text-sm text-muted-foreground">{c.hora}</p>
            </div>
          </li>
        ))}
        {proximas.length === 0 && (
          <li className="px-5 py-12 text-center text-muted-foreground">Nenhuma consulta agendada.</li>
        )}
      </ul>
    </main>
  );
}
