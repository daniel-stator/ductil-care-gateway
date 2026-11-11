import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Lock, Phone, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { deISO } from "@/lib/agenda";
import { formatarData, idade, salvarAnotacao, type Cliente, type Consulta } from "@/lib/clientes";
import { motivoNaoAnotar } from "@/lib/prontuario";
import { cn } from "@/lib/utils";

function iniciais(nome: string) {
  const partes = nome.split(" ").filter(Boolean);
  return `${partes[0]?.[0] ?? ""}${partes.at(-1)?.[0] ?? ""}`.toUpperCase();
}

export function CabecalhoPaciente({ paciente, acoes }: { paciente: Cliente; acoes?: React.ReactNode }) {
  const anos = paciente.nascimento ? idade(paciente.nascimento) : null;
  const emergencia = paciente.contatoEmergencia;

  return (
    <header className="rounded-lg border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-ink font-display text-xl text-gold">
            {iniciais(paciente.nome)}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.3em] text-gold-deep">
              <Lock className="size-3" /> Prontuário · visão exclusiva do psicólogo
            </p>
            <h2 className="mt-1 truncate font-display text-3xl font-medium text-foreground">{paciente.nome}</h2>
          </div>
        </div>
        {acoes}
      </div>

      <dl className="mt-5 grid gap-4 border-t border-border pt-5 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Idade</dt>
          <dd className="mt-1 font-medium text-foreground">
            {anos !== null ? (
              <>
                {anos} anos{" "}
                <span className="font-normal text-muted-foreground">
                  · {formatarData(paciente.nascimento ?? "")}
                </span>
              </>
            ) : (
              <span className="font-normal text-muted-foreground">Não informada</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Contato do paciente</dt>
          <dd className="mt-1 flex items-center gap-1.5 font-medium tabular-nums text-foreground">
            <Phone className="size-3.5 text-gold-deep" /> {paciente.telefone}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">Contato de emergência</dt>
          <dd className="mt-1">
            {emergencia ? (
              <>
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <ShieldAlert className="size-3.5 text-gold-deep" />
                  {emergencia.nome || "Sem nome"}
                  {emergencia.parentesco && (
                    <span className="font-normal text-muted-foreground">({emergencia.parentesco})</span>
                  )}
                </span>
                {emergencia.telefone && (
                  <span className="mt-0.5 block tabular-nums text-muted-foreground">{emergencia.telefone}</span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">Não informado</span>
            )}
          </dd>
        </div>
      </dl>
    </header>
  );
}

export function HistoricoLateral({
  sessoes,
  ativaId,
  onSelecionar,
}: {
  sessoes: Consulta[];
  ativaId: string | undefined;
  onSelecionar: (c: Consulta) => void;
}) {
  return (
    <aside className="rounded-lg border border-border bg-card shadow-soft">
      <h3 className="border-b border-border px-4 py-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Histórico de sessões
      </h3>
      {sessoes.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma sessão até hoje.</p>
      ) : (
        <ol className="max-h-[32rem] overflow-y-auto p-2">
          {sessoes.map((s) => {
            const ativa = s.id === ativaId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelecionar(s)}
                  aria-current={ativa ? "true" : undefined}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md border-l-2 px-3 py-2.5 text-left transition-colors",
                    ativa
                      ? "border-gold bg-accent"
                      : "border-transparent hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium tabular-nums text-foreground">{formatarData(s.data)}</span>
                    <span className="block text-xs capitalize text-muted-foreground">
                      {format(deISO(s.data), "EEEE", { locale: ptBR })} · {s.hora}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <StatusBadge status={s.status} className="text-[0.6rem]" />
                    {s.anotacao && (
                      <FileText className="size-3.5 text-gold-deep" aria-label="Com anotação" />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}

export function EditorEvolucao({
  paciente,
  consulta,
  psicologo,
  onAlteradoChange,
}: {
  paciente: Cliente;
  consulta: Consulta;
  psicologo: string;
  onAlteradoChange: (alterado: boolean) => void;
}) {
  const salvo = consulta.anotacao ?? "";
  const [texto, setTexto] = useState(salvo);
  const [salvoAs, setSalvoAs] = useState<string | null>(null);
  const bloqueio = motivoNaoAnotar(consulta, psicologo);
  const alterado = texto !== salvo;

  useEffect(() => {
    onAlteradoChange(alterado);
  }, [alterado, onAlteradoChange]);

  function salvar() {
    const r = salvarAnotacao(paciente.id, consulta.id, psicologo, texto);
    if (!r.ok) {
      toast.error(r.erro);
      return;
    }
    setTexto(texto.trim());
    setSalvoAs(format(new Date(), "HH:mm"));
    toast.success("Anotação salva", { description: `${paciente.nome} · ${formatarData(consulta.data)}` });
  }

  return (
    <section className="flex flex-col rounded-lg border border-border bg-card shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <div>
          <h3 className="font-display text-xl font-medium">Evolução da sessão</h3>
          <p className="text-sm capitalize text-muted-foreground">
            {format(deISO(consulta.data), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })} · {consulta.hora}
          </p>
        </div>
        <StatusBadge status={consulta.status} />
      </header>

      <label htmlFor="evolucao" className="sr-only">
        Evolução da sessão
      </label>
      <textarea
        id="evolucao"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        disabled={!!bloqueio}
        maxLength={20000}
        placeholder={bloqueio ?? "Registre aqui a evolução da sessão…"}
        className="min-h-[22rem] flex-1 resize-y bg-transparent px-6 py-5 text-base leading-7 text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none disabled:cursor-not-allowed"
      />

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
        <p className="text-sm text-muted-foreground">
          {bloqueio
            ? bloqueio
            : alterado
              ? "Alterações não salvas"
              : salvoAs
                ? `Salvo às ${salvoAs}`
                : salvo
                  ? "Anotação registrada"
                  : "Nenhuma anotação ainda"}
        </p>
        <Button variant="gold" onClick={salvar} disabled={!!bloqueio || !alterado || !texto.trim()}>
          Salvar Anotação
        </Button>
      </footer>
    </section>
  );
}
