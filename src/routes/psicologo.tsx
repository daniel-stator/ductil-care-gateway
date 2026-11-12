import { ClientOnly, Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

import { Marca } from "@/components/Marca";
import { CabecalhoPaciente, EditorEvolucao, HistoricoLateral } from "@/components/psicologo/Prontuario";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { diaDeAtendimento, paraISO } from "@/lib/agenda";
import { useClientes } from "@/lib/clientes";
import { PSICOLOGO_LOGADO, pacientesDo, sessoesAnteriores, sessoesDoDia } from "@/lib/prontuario";
import { cn, primeiraMaiuscula } from "@/lib/utils";

export const Route = createFileRoute("/psicologo")({
  head: () => ({
    meta: [
      { title: "Painel do Psicólogo · Dúctil Psicologia" },
      { name: "description", content: "Agenda do dia, prontuário e histórico de sessões dos pacientes." },
      { property: "og:title", content: "Painel do Psicólogo · Dúctil Psicologia" },
      { property: "og:description", content: "Agenda do dia, prontuário e histórico de sessões dos pacientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PsicologoPage,
});

function PsicologoPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Marca />
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{PSICOLOGO_LOGADO}</p>
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gold">Psicólogo(a)</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-ink-foreground/80 hover:bg-ink-foreground/10 hover:text-ink-foreground">
              <Link to="/">
                <LogOut className="size-4" /> Sair
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <ClientOnly fallback={<p className="px-8 py-12 text-muted-foreground">Carregando painel…</p>}>
        <Painel />
      </ClientOnly>
    </div>
  );
}

function saudacao(d: Date) {
  const h = d.getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function Painel() {
  const clientes = useClientes();
  const psicologo = PSICOLOGO_LOGADO;
  const hoje = useMemo(() => new Date(), []);
  const [dia, setDia] = useState<Date>(hoje);

  const pacientes = useMemo(() => pacientesDo(clientes, psicologo), [clientes, psicologo]);
  const sessoes = sessoesDoDia(clientes, psicologo, paraISO(dia));

  const [pacienteId, setPacienteId] = useState<string | undefined>(
    () => sessoesDoDia(clientes, psicologo, paraISO(hoje))[0]?.cliente.id ?? pacientes[0]?.id,
  );
  const [consultaId, setConsultaId] = useState<string | undefined>(undefined);
  const alteradoRef = useRef(false);
  const onAlteradoChange = useCallback((v: boolean) => {
    alteradoRef.current = v;
  }, []);

  const paciente = pacientes.find((p) => p.id === pacienteId);
  const anteriores = paciente ? sessoesAnteriores(paciente, psicologo, hoje) : [];
  const minhas = paciente?.consultas.filter((c) => c.psicologo === psicologo) ?? [];
  const consulta = minhas.find((c) => c.id === consultaId) ?? anteriores[0];

  function selecionar(novoPaciente: string, novaConsulta?: string) {
    if (novoPaciente === pacienteId && novaConsulta === consulta?.id) return;
    if (alteradoRef.current && !window.confirm("Descartar a anotação que ainda não foi salva?")) return;
    alteradoRef.current = false;
    setPacienteId(novoPaciente);
    setConsultaId(novaConsulta);
  }

  const ehHoje = isSameDay(dia, hoje);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">Painel do psicólogo</p>
      <h1 className="mt-2 font-display text-4xl font-medium text-foreground sm:text-5xl">
        {saudacao(hoje)}, {psicologo.split(" ").slice(0, 2).join(" ")}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {sessoesDoDia(clientes, psicologo, paraISO(hoje)).length} sessão(ões) hoje ·{" "}
        {pacientes.length} pacientes em acompanhamento
      </p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[18rem_1fr]">
        {/* Agenda */}
        <section className="h-fit rounded-lg border border-border bg-card shadow-soft">
          <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-3">
            <Button variant="ghost" size="icon" aria-label="Dia anterior" onClick={() => setDia((d) => addDays(d, -1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <div className="text-center">
              <h2 className="font-display text-xl font-medium">Agenda</h2>
              <p className="text-xs text-muted-foreground">
                {ehHoje ? "Hoje · " : ""}
                {primeiraMaiuscula(format(dia, "EEE, d 'de' MMM", { locale: ptBR }))}
              </p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Próximo dia" onClick={() => setDia((d) => addDays(d, 1))}>
              <ChevronRight className="size-4" />
            </Button>
          </header>

          {!diaDeAtendimento(paraISO(dia)) ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">Sem atendimento neste dia.</p>
          ) : sessoes.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhuma sessão marcada.</p>
          ) : (
            <ul className="grid gap-1 p-2 sm:grid-cols-2 xl:grid-cols-1">
              {sessoes.map(({ consulta: s, cliente }) => {
                const ativa = s.id === consulta?.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => selecionar(cliente.id, s.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-left transition-colors",
                        ativa ? "border-gold bg-accent" : "border-transparent hover:bg-muted",
                      )}
                    >
                      <span className="w-12 font-display text-lg tabular-nums text-gold-deep">{s.hora}</span>
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{cliente.nome}</span>
                      <StatusBadge status={s.status} className="text-[0.6rem]" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!ehHoje && (
            <div className="border-t border-border p-2">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setDia(hoje)}>
                Voltar para hoje
              </Button>
            </div>
          )}
        </section>

        {/* Prontuário */}
        <div className="min-w-0 space-y-6">
          {!paciente ? (
            <p className="rounded-lg border border-border bg-card px-5 py-16 text-center text-muted-foreground">
              Nenhum paciente em acompanhamento.
            </p>
          ) : (
            <>
              <CabecalhoPaciente
                paciente={paciente}
                acoes={
                  <Select value={paciente.id} onValueChange={(v) => selecionar(v)}>
                    <SelectTrigger className="w-56" aria-label="Trocar paciente">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />

              <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
                <HistoricoLateral
                  sessoes={anteriores}
                  ativaId={consulta?.id}
                  onSelecionar={(s) => selecionar(paciente.id, s.id)}
                />
                {consulta ? (
                  <EditorEvolucao
                    key={consulta.id}
                    paciente={paciente}
                    consulta={consulta}
                    psicologo={psicologo}
                    onAlteradoChange={onAlteradoChange}
                  />
                ) : (
                  <p className="rounded-lg border border-border bg-card px-5 py-16 text-center text-muted-foreground">
                    Este paciente ainda não teve sessões.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
