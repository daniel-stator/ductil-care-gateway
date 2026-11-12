import { useSyncExternalStore } from "react";
import { z } from "zod";

import { PSICOLOGOS, motivoBloqueio, type PedidoConsulta } from "./agenda";
import { motivoNaoSalvarAnotacao } from "./prontuario";

export type StatusConsulta = "realizada" | "faltou" | "cancelada" | "agendada";

export interface Consulta {
  id: string;
  /** Data no formato AAAA-MM-DD */
  data: string;
  hora: string;
  psicologo: string;
  status: StatusConsulta;
  /** Observação administrativa da recepção */
  observacao?: string;
  /** Evolução da sessão registrada pelo psicólogo (prontuário — visão exclusiva do psicólogo) */
  anotacao?: string | undefined;
}

export interface ContatoEmergencia {
  nome: string;
  parentesco: string;
  telefone: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  /** Data de nascimento no formato AAAA-MM-DD */
  nascimento?: string | undefined;
  contatoEmergencia?: ContatoEmergencia | undefined;
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

/** Idade em anos completos na data informada */
export function idade(nascimento: string, hoje: Date = new Date()) {
  const [a = 0, m = 0, d = 0] = nascimento.split("-").map(Number);
  let anos = hoje.getFullYear() - a;
  const mes = hoje.getMonth() + 1;
  if (mes < m || (mes === m && hoje.getDate() < d)) anos--;
  return anos;
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
  nascimento: z
    .string()
    .refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && v >= "1900-01-01"), "Data inválida")
    .refine((v) => v === "" || v <= new Date().toISOString().slice(0, 10), "A data não pode ser no futuro"),
  emergenciaNome: z.string().trim().max(120, "Nome muito longo"),
  emergenciaParentesco: z.string().trim().max(40, "Texto muito longo"),
  emergenciaTelefone: z
    .string()
    .refine((v) => v === "" || [10, 11].includes(somenteDigitos(v).length), "Telefone inválido"),
});

export type DadosCliente = z.infer<typeof clienteSchema>;

export function dadosDoCliente(c: Cliente): DadosCliente {
  return {
    nome: c.nome,
    cpf: c.cpf,
    telefone: c.telefone,
    email: c.email,
    nascimento: c.nascimento ?? "",
    emergenciaNome: c.contatoEmergencia?.nome ?? "",
    emergenciaParentesco: c.contatoEmergencia?.parentesco ?? "",
    emergenciaTelefone: c.contatoEmergencia?.telefone ?? "",
  };
}

function camposDoCliente(dados: DadosCliente) {
  const nome = dados.emergenciaNome.trim();
  const telefone = formatarTelefone(dados.emergenciaTelefone);
  return {
    nome: dados.nome.trim(),
    cpf: formatarCpf(dados.cpf),
    telefone: formatarTelefone(dados.telefone),
    email: dados.email.trim(),
    nascimento: dados.nascimento || undefined,
    contatoEmergencia:
      nome || telefone
        ? { nome, parentesco: dados.emergenciaParentesco.trim(), telefone }
        : undefined,
  };
}

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
    nascimento: "1991-03-14",
    contatoEmergencia: { nome: "Marcos Ribeiro", parentesco: "Irmão", telefone: "(11) 98111-2030" },
    consultas: [
      {
        id: "c1-1",
        data: "2026-11-04",
        hora: "09:00",
        psicologo: PSI[0],
        status: "realizada",
        anotacao:
          "Paciente relata melhora na qualidade do sono após adotar a rotina combinada. Trouxe episódio de ansiedade antes de reunião no trabalho; exploramos pensamentos automáticos associados. Combinado registro diário de situações gatilho.",
      },
      {
        id: "c1-2",
        data: "2026-10-28",
        hora: "09:00",
        psicologo: PSI[0],
        status: "realizada",
        anotacao:
          "Retorno após falta. Paciente justificou ausência por sobrecarga no trabalho. Trabalhamos psicoeducação sobre ansiedade e técnicas de respiração.",
      },
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
    nascimento: "1985-08-02",
    contatoEmergencia: { nome: "Patrícia Alves", parentesco: "Esposa", telefone: "(11) 97000-4455" },
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
    nascimento: "1999-12-20",
    contatoEmergencia: { nome: "Regina Souza", parentesco: "Mãe", telefone: "(21) 98222-6070" },
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
    nascimento: "1978-05-30",
    contatoEmergencia: { nome: "Luciana Costa", parentesco: "Esposa", telefone: "(11) 99654-8800" },
    consultas: [
      { id: "c4-4", data: "2026-11-16", hora: "10:00", psicologo: PSI[0], status: "agendada" },
      {
        id: "c4-1",
        data: "2026-11-09",
        hora: "10:00",
        psicologo: PSI[0],
        status: "realizada",
        anotacao:
          "Paciente comenta conflito com o filho adolescente. Discutimos estratégias de comunicação não violenta. Humor estável.",
      },
      {
        id: "c4-2",
        data: "2026-11-02",
        hora: "10:00",
        psicologo: PSI[0],
        status: "realizada",
        anotacao: "Sessão focada em luto pela perda do pai. Paciente emotivo, mas engajado.",
      },
      { id: "c4-3", data: "2026-10-26", hora: "10:00", psicologo: PSI[0], status: "realizada" },
    ],
  },
  {
    id: "c5",
    nome: "Eduarda Lima Nogueira",
    cpf: "628.194.821-12",
    telefone: "(11) 99001-2233",
    email: "eduarda.nogueira@email.com",
    nascimento: "2003-01-09",
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
    nascimento: "1994-07-17",
    contatoEmergencia: { nome: "Júlia Rocha", parentesco: "Irmã", telefone: "(31) 99123-4567" },
    consultas: [
      { id: "c6-1", data: "2026-10-14", hora: "16:00", psicologo: PSI[1], status: "realizada" },
      { id: "c6-2", data: "2026-10-07", hora: "16:00", psicologo: PSI[1], status: "realizada" },
      { id: "c6-3", data: "2026-11-12", hora: "16:00", psicologo: PSI[1], status: "agendada" },
    ],
  },
  {
    id: "c7",
    nome: "Gabriela Mendes Furtado",
    cpf: "417.417.417-26",
    telefone: "(11) 98450-7712",
    email: "gabriela.furtado@email.com",
    nascimento: "1988-11-25",
    contatoEmergencia: { nome: "Rafael Furtado", parentesco: "Marido", telefone: "(11) 98450-0099" },
    consultas: [
      {
        id: "c7-1",
        data: "2026-10-14",
        hora: "14:00",
        psicologo: PSI[0],
        status: "realizada",
        anotacao: "Primeira sessão. Queixa principal: esgotamento profissional. Levantamento de histórico.",
      },
      { id: "c7-2", data: "2026-10-28", hora: "14:00", psicologo: PSI[0], status: "realizada" },
      { id: "c7-3", data: "2026-11-12", hora: "16:00", psicologo: PSI[0], status: "agendada" },
      { id: "c7-4", data: "2026-11-25", hora: "14:00", psicologo: PSI[0], status: "agendada" },
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
  const novo: Cliente = { id: `c${Date.now()}`, ...camposDoCliente(dados), consultas: [] };
  clientes = [novo, ...clientes];
  emitir();
  return novo;
}

export function atualizarCliente(id: string, dados: DadosCliente) {
  clientes = clientes.map((c) =>
    c.id === id ? { ...c, ...camposDoCliente(dados) } : c,
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

export function salvarAnotacao(
  clienteId: string,
  consultaId: string,
  psicologo: string,
  texto: string,
): { ok: true } | { ok: false; erro: string } {
  const cliente = clientes.find((c) => c.id === clienteId);
  const consulta = cliente?.consultas.find((c) => c.id === consultaId);
  if (!cliente || !consulta) return { ok: false, erro: "Sessão não encontrada" };
  const erro = motivoNaoSalvarAnotacao(consulta, psicologo, texto);
  if (erro) return { ok: false, erro };
  clientes = clientes.map((c) =>
    c.id === clienteId
      ? {
          ...c,
          consultas: c.consultas.map((s) =>
            s.id === consultaId ? { ...s, anotacao: texto.trim() } : s,
          ),
        }
      : c,
  );
  emitir();
  return { ok: true };
}
