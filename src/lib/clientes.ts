import { useSyncExternalStore } from "react";
import { z } from "zod";

import { PSICOLOGOS, motivoBloqueio, type PedidoConsulta } from "./agenda";

export type StatusConsulta = "realizada" | "faltou" | "cancelada" | "agendada";

export interface Consulta {
  id: string;
  /** Data no formato AAAA-MM-DD */
  data: string;
  hora: string;
  psicologo: string;
  status: StatusConsulta;
  observacao?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  consultas: Consulta[];
}

export const statusLabel: Record<StatusConsulta, string> = {
  realizada: "Realizada",
  faltou: "Faltou",
  cancelada: "Cancelada",
  agendada: "Agendada",
};

/* ---------- Regras ---------- */

export function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function cpfValido(valor: string) {
  const d = somenteDigitos(valor);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (const n of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const resto = (soma * 10) % 11;
    if ((resto === 10 ? 0 : resto) !== Number(d[n])) return false;
  }
  return true;
}

export function formatarCpf(valor: string) {
  const d = somenteDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatarTelefone(valor: string) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatarData(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** Último atendimento = consulta realizada mais recente. Faltas, cancelamentos e agendamentos não contam. */
export function ultimoAtendimento(cliente: Pick<Cliente, "consultas">): Consulta | undefined {
  return cliente.consultas
    .filter((c) => c.status === "realizada")
    .sort((a, b) => `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`))[0];
}

export function ordenarConsultas(consultas: Consulta[]) {
  return [...consultas].sort((a, b) => `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`));
}

export const clienteSchema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo").max(120, "Nome muito longo"),
  cpf: z.string().refine(cpfValido, "CPF inválido"),
  telefone: z
    .string()
    .refine((v) => [10, 11].includes(somenteDigitos(v).length), "Telefone inválido"),
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail")
    .max(255, "E-mail muito longo")
    .email("E-mail inválido"),
});

export type DadosCliente = z.infer<typeof clienteSchema>;

export function cpfDuplicado(lista: Cliente[], cpf: string, ignorarId?: string) {
  const alvo = somenteDigitos(cpf);
  return lista.some((c) => c.id !== ignorarId && somenteDigitos(c.cpf) === alvo);
}

/* ---------- Dados de exemplo ---------- */

const PSI = PSICOLOGOS;

const iniciais: Cliente[] = [
  {
    id: "c1",
    nome: "Ana Carolina Ribeiro",
    cpf: "526.018.159-06",
    telefone: "(11) 98765-4321",
    email: "ana.ribeiro@email.com",
    consultas: [
      { id: "c1-1", data: "2026-11-04", hora: "09:00", psicologo: PSI[0], status: "realizada" },
      { id: "c1-2", data: "2026-10-28", hora: "09:00", psicologo: PSI[0], status: "realizada" },
      { id: "c1-3", data: "2026-10-21", hora: "09:00", psicologo: PSI[0], status: "faltou" },
      { id: "c1-4", data: "2026-11-18", hora: "09:00", psicologo: PSI[0], status: "agendada" },
      { id: "c1-5", data: "2026-11-11", hora: "09:00", psicologo: PSI[0], status: "agendada" },
    ],
  },
  {
    id: "c2",
    nome: "Bruno Henrique Alves",
    cpf: "083.016.613-05",
    telefone: "(11) 97654-1122",
    email: "bruno.alves@email.com",
    consultas: [
      { id: "c2-1", data: "2026-11-06", hora: "14:00", psicologo: PSI[1], status: "realizada" },
      { id: "c2-2", data: "2026-10-30", hora: "14:00", psicologo: PSI[1], status: "cancelada", observacao: "Cliente viajou" },
      { id: "c2-3", data: "2026-10-23", hora: "14:00", psicologo: PSI[1], status: "realizada" },
      { id: "c2-4", data: "2026-11-13", hora: "14:00", psicologo: PSI[1], status: "agendada" },
    ],
  },
  {
    id: "c3",
    nome: "Camila Ferreira Souza",
    cpf: "186.091.390-34",
    telefone: "(21) 99812-3344",
    email: "camila.souza@email.com",
    consultas: [
      { id: "c3-1", data: "2026-09-15", hora: "18:00", psicologo: PSI[2], status: "realizada" },
      { id: "c3-2", data: "2026-11-12", hora: "18:00", psicologo: PSI[2], status: "agendada" },
      { id: "c3-3", data: "2026-11-10", hora: "17:00", psicologo: PSI[2], status: "agendada" },
    ],
  },
  {
    id: "c4",
    nome: "Diego Martins Costa",
    cpf: "996.030.824-30",
    telefone: "(11) 3456-7890",
    email: "diego.costa@email.com",
    consultas: [
      { id: "c4-4", data: "2026-11-16", hora: "10:00", psicologo: PSI[0], status: "agendada" },
      { id: "c4-1", data: "2026-11-09", hora: "10:00", psicologo: PSI[0], status: "realizada" },
      { id: "c4-2", data: "2026-11-02", hora: "10:00", psicologo: PSI[0], status: "realizada" },
      { id: "c4-3", data: "2026-10-26", hora: "10:00", psicologo: PSI[0], status: "realizada" },
    ],
  },
  {
    id: "c5",
    nome: "Eduarda Lima Nogueira",
    cpf: "628.194.821-12",
    telefone: "(11) 99001-2233",
    email: "eduarda.nogueira@email.com",
    consultas: [
      { id: "c5-1", data: "2026-11-11", hora: "15:00", psicologo: PSI[2], status: "agendada" },
    ],
  },
  {
    id: "c6",
    nome: "Felipe Andrade Rocha",
    cpf: "993.518.190-19",
    telefone: "(31) 98877-6655",
    email: "felipe.rocha@email.com",
    consultas: [
      { id: "c6-1", data: "2026-10-14", hora: "16:00", psicologo: PSI[1], status: "realizada" },
      { id: "c6-2", data: "2026-10-07", hora: "16:00", psicologo: PSI[1], status: "realizada" },
      { id: "c6-3", data: "2026-11-12", hora: "16:00", psicologo: PSI[1], status: "agendada" },
    ],
  },
];

/* ---------- Armazenamento na sessão (até o banco de dados ser ligado) ---------- */

let clientes: Cliente[] = iniciais;
const ouvintes = new Set<() => void>();

function emitir() {
  ouvintes.forEach((o) => o());
}

function inscrever(o: () => void) {
  ouvintes.add(o);
  return () => ouvintes.delete(o);
}

export function useClientes() {
  return useSyncExternalStore(inscrever, () => clientes, () => iniciais);
}

export function adicionarCliente(dados: DadosCliente) {
  const novo: Cliente = {
    id: `c${Date.now()}`,
    nome: dados.nome.trim(),
    cpf: formatarCpf(dados.cpf),
    telefone: formatarTelefone(dados.telefone),
    email: dados.email.trim(),
    consultas: [],
  };
  clientes = [novo, ...clientes];
  emitir();
  return novo;
}

export function atualizarCliente(id: string, dados: DadosCliente) {
  clientes = clientes.map((c) =>
    c.id === id
      ? {
          ...c,
          nome: dados.nome.trim(),
          cpf: formatarCpf(dados.cpf),
          telefone: formatarTelefone(dados.telefone),
          email: dados.email.trim(),
        }
      : c,
  );
  emitir();
}

export function marcarConsulta(pedido: PedidoConsulta): { ok: true } | { ok: false; erro: string } {
  const erro = motivoBloqueio(clientes, pedido);
  if (erro) return { ok: false, erro };
  const { clienteId, data, hora, psicologo } = pedido;
  clientes = clientes.map((c) =>
    c.id === clienteId
      ? {
          ...c,
          consultas: [
            ...c.consultas,
            { id: `${clienteId}-${Date.now()}`, data, hora, psicologo, status: "agendada" },
          ],
        }
      : c,
  );
  emitir();
  return { ok: true };
}
