import { PSICOLOGOS, paraISO } from "./agenda";
import type { Cliente, Consulta } from "./clientes";

/* Regras do prontuário — visão exclusiva do psicólogo. */

/** Psicólogo(a) usado no painel enquanto o login real não está ativo */
export const PSICOLOGO_LOGADO: string = PSICOLOGOS[0];

/** Pacientes que têm ao menos uma sessão com o psicólogo */
export function pacientesDo(clientes: Cliente[], psicologo: string) {
  return clientes
    .filter((c) => c.consultas.some((s) => s.psicologo === psicologo))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/** Sessões do psicólogo no dia, em ordem de horário. Canceladas não aparecem. */
export function sessoesDoDia(clientes: Cliente[], psicologo: string, data: string) {
  return clientes
    .flatMap((cliente) =>
      cliente.consultas
        .filter((s) => s.psicologo === psicologo && s.data === data && s.status !== "cancelada")
        .map((consulta) => ({ consulta, cliente })),
    )
    .sort((a, b) => a.consulta.hora.localeCompare(b.consulta.hora));
}

/** Sessões do paciente com o psicólogo até hoje (inclusive), da mais recente para a mais antiga. Canceladas não contam. */
export function sessoesAnteriores(cliente: Cliente, psicologo: string, hoje: Date = new Date()) {
  const limite = paraISO(hoje);
  return cliente.consultas
    .filter((s) => s.psicologo === psicologo && s.status !== "cancelada" && s.data <= limite)
    .sort((a, b) => `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`));
}

/** Motivo pelo qual a sessão não aceita anotação, ou null se aceita */
export function motivoNaoAnotar(consulta: Consulta, psicologo: string, hoje: Date = new Date()) {
  if (consulta.psicologo !== psicologo) return "Esta sessão é de outro(a) psicólogo(a)";
  if (consulta.status === "cancelada") return "Sessão cancelada não recebe anotação";
  if (consulta.data > paraISO(hoje)) return "A anotação fica disponível no dia da sessão";
  return null;
}

export function motivoNaoSalvarAnotacao(
  consulta: Consulta,
  psicologo: string,
  texto: string,
  hoje: Date = new Date(),
) {
  const bloqueio = motivoNaoAnotar(consulta, psicologo, hoje);
  if (bloqueio) return bloqueio;
  if (!texto.trim()) return "Escreva a evolução antes de salvar";
  if (texto.length > 20000) return "Anotação muito longa";
  return null;
}
