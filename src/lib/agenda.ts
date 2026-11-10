import { format } from "date-fns";

import type { Cliente, Consulta } from "./clientes";

/* Regras da agenda da clínica. Horários de atendimento provisórios — ajustar quando a clínica confirmar. */

export const PSICOLOGOS = ["Dra. Helena Prado", "Dr. Rafael Moura", "Dra. Beatriz Lins"] as const;

/** Sessões de hora em hora, das 08:00 às 18:00, com pausa para almoço às 12:00 */
export const HORARIOS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

export function paraISO(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function deISO(iso: string) {
  return new Date(`${iso}T12:00:00`);
}

/** A clínica atende de segunda a sexta */
export function diaDeAtendimento(iso: string) {
  const dia = deISO(iso).getDay();
  return dia >= 1 && dia <= 5;
}

export function jaPassou(data: string, hora: string, agora: Date = new Date()) {
  return `${data}T${hora}` <= format(agora, "yyyy-MM-dd'T'HH:mm");
}

export interface Ocupacao {
  consulta: Consulta;
  cliente: Pick<Cliente, "id" | "nome">;
}

/** Consulta que ocupa o horário do psicólogo. Consultas canceladas liberam o horário. */
export function ocupacao(
  clientes: Pick<Cliente, "id" | "nome" | "consultas">[],
  data: string,
  hora: string,
  psicologo: string,
): Ocupacao | undefined {
  for (const cliente of clientes) {
    const consulta = cliente.consultas.find(
      (c) => c.data === data && c.hora === hora && c.psicologo === psicologo && c.status !== "cancelada",
    );
    if (consulta) return { consulta, cliente };
  }
  return undefined;
}

export interface PedidoConsulta {
  clienteId: string;
  data: string;
  hora: string;
  psicologo: string;
}

/** Motivo pelo qual a consulta não pode ser marcada, ou null se pode. */
export function motivoBloqueio(
  clientes: Pick<Cliente, "id" | "nome" | "consultas">[],
  p: PedidoConsulta,
  agora: Date = new Date(),
): string | null {
  const cliente = clientes.find((c) => c.id === p.clienteId);
  if (!cliente) return "Selecione o cliente";
  if (!(PSICOLOGOS as readonly string[]).includes(p.psicologo)) return "Selecione o(a) psicólogo(a)";
  if (!diaDeAtendimento(p.data)) return "A clínica atende de segunda a sexta";
  if (!(HORARIOS as readonly string[]).includes(p.hora)) return "Horário fora do expediente";
  if (jaPassou(p.data, p.hora, agora)) return "Escolha um horário futuro";
  if (ocupacao(clientes, p.data, p.hora, p.psicologo)) return "Este horário já está ocupado";
  const choque = cliente.consultas.some(
    (c) => c.data === p.data && c.hora === p.hora && c.status !== "cancelada",
  );
  if (choque) return "Este cliente já tem consulta neste horário";
  return null;
}

/** Horários que ainda podem ser marcados para o psicólogo no dia */
export function horariosLivres(
  clientes: Pick<Cliente, "id" | "nome" | "consultas">[],
  data: string,
  psicologo: string,
  agora: Date = new Date(),
): string[] {
  if (!diaDeAtendimento(data)) return [];
  return HORARIOS.filter((h) => !jaPassou(data, h, agora) && !ocupacao(clientes, data, h, psicologo));
}
