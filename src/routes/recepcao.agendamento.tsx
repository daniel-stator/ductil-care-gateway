import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";

import { MarcarConsultaDialog, type PreSelecao } from "@/components/recepcao/MarcarConsultaDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  HORARIOS,
  PSICOLOGOS,
  deISO,
  diaDeAtendimento,
  horariosLivres,
  jaPassou,
  ocupacao,
  paraISO,
} from "@/lib/agenda";
import { useClientes } from "@/lib/clientes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recepcao/agendamento")({
  head: () => ({
    meta: [
      { title: "Agendamento · Recepção Dúctil Psicologia" },
      { name: "description", content: "Calendário de consultas e horários livres da clínica Dúctil Psicologia." },
      { property: "og:title", content: "Agendamento · Recepção Dúctil Psicologia" },
      { property: "og:description", content: "Calendário de consultas e horários livres da clínica Dúctil Psicologia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgendamentoPage,
});

function AgendamentoPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
      <ClientOnly fallback={<p className="text-muted-foreground">Carregando agenda…</p>}>
        <Agenda />
      </ClientOnly>
    </main>
  );
}

/** "Dra. Helena Prado" → "Dra. Helena" */
function nomeCurto(p: string) {
  return p.split(" ").slice(0, 2).join(" ");
}

function Agenda() {
  const clientes = useClientes();
  const [dia, setDia] = useState<Date>(() => new Date());
  const [dialogo, setDialogo] = useState<{ aberto: boolean; inicial?: PreSelecao | undefined }>({
    aberto: false,
  });

  const iso = paraISO(dia);
  const atende = diaDeAtendimento(iso);

  const diasComConsulta = useMemo(() => {
    const datas = new Set<string>();
    clientes.forEach((c) =>
      c.consultas.forEach((s) => s.status !== "cancelada" && datas.add(s.data)),
    );
    return [...datas].map(deISO);
  }, [clientes]);

  const totalDia = PSICOLOGOS.reduce(
    (n, p) => n + HORARIOS.filter((h) => ocupacao(clientes, iso, h, p)).length,
    0,
  );
  const livresDia = PSICOLOGOS.reduce((n, p) => n + horariosLivres(clientes, iso, p).length, 0);

  function abrir(inicial?: PreSelecao) {
    setDialogo({ aberto: true, inicial });
  }

  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">Recepção</p>
          <h1 className="mt-2 font-display text-4xl font-medium text-foreground sm:text-5xl">Agendamento</h1>
          <p className="mt-1 text-muted-foreground">Clique em um dia para ver as consultas e os horários livres</p>
        </div>
        <Button variant="gold" size="lg" onClick={() => abrir(atende ? { data: iso } : undefined)}>
          <Plus className="size-4" />
          Marcar consulta
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[auto_1fr]">
        <section className="h-fit rounded-lg border border-border bg-card p-3 shadow-soft">
          <Calendar
            mode="single"
            required
            locale={ptBR}
            selected={dia}
            onSelect={(d) => d && setDia(d)}
            modifiers={{ comConsulta: diasComConsulta }}
            modifiersClassNames={{
              comConsulta:
                "after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-gold-deep",
            }}
            className="bg-transparent [--cell-size:2.5rem]"
          />
          <div className="flex items-center gap-2 border-t border-border px-3 pb-1 pt-3 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-gold-deep" /> Dia com consultas marcadas
          </div>
        </section>

        <section className="min-w-0 rounded-lg border border-border bg-card shadow-soft">
          <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4">
            <h2 className="font-display text-2xl font-medium capitalize">
              {format(dia, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h2>
            {atende && (
              <p className="text-sm text-muted-foreground">
                {totalDia} consulta(s) · {livresDia} horário(s) livre(s)
              </p>
            )}
          </header>

          {!atende ? (
            <p className="px-5 py-16 text-center text-muted-foreground">
              A clínica não atende neste dia. Atendimento de segunda a sexta.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid min-w-[36rem] grid-cols-[4rem_repeat(3,minmax(0,1fr))]">
                <div className="border-b border-border" />
                {PSICOLOGOS.map((p) => (
                  <div
                    key={p}
                    className="border-b border-l border-border px-3 py-3 text-sm font-medium text-foreground"
                  >
                    {nomeCurto(p)}
                  </div>
                ))}

                {HORARIOS.map((h) => (
                  <Linha key={h} hora={h}>
                    {PSICOLOGOS.map((p) => {
                      const oc = ocupacao(clientes, iso, h, p);
                      if (oc) {
                        return (
                          <div key={p} className="border-b border-l border-border p-1.5">
                            <div
                              className={cn(
                                "flex h-full flex-col gap-1 rounded-md px-2.5 py-2",
                                oc.consulta.status === "agendada"
                                  ? "border-l-2 border-gold bg-accent"
                                  : "bg-muted",
                              )}
                            >
                              <span className="truncate text-sm font-medium text-foreground">
                                {oc.cliente.nome}
                              </span>
                              <StatusBadge status={oc.consulta.status} className="w-fit text-[0.65rem]" />
                            </div>
                          </div>
                        );
                      }
                      const passou = jaPassou(iso, h);
                      return (
                        <div key={p} className="border-b border-l border-border p-1.5">
                          {passou ? (
                            <span className="grid h-full min-h-14 place-items-center text-sm text-muted-foreground/60">
                              —
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => abrir({ data: iso, hora: h, psicologo: p })}
                              aria-label={`Marcar às ${h} com ${p}`}
                              className="group grid h-full min-h-14 w-full place-items-center rounded-md border border-dashed border-border text-sm text-muted-foreground transition-colors hover:border-gold hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <span className="flex items-center gap-1">
                                <Plus className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                                Livre
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </Linha>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <MarcarConsultaDialog
        aberto={dialogo.aberto}
        onAbertoChange={(v) => setDialogo((d) => ({ ...d, aberto: v }))}
        clientes={clientes}
        inicial={dialogo.inicial}
        onMarcada={(data) => setDia(deISO(data))}
      />
    </>
  );
}

function Linha({ hora, children }: { hora: string; children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-border px-3 py-3 text-sm tabular-nums text-muted-foreground">{hora}</div>
      {children}
    </>
  );
}
