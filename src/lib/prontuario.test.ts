import { describe, expect, it } from "vitest";

import { idade, type Cliente, type Consulta } from "./clientes";
import { motivoNaoSalvarAnotacao, sessoesAnteriores } from "./prontuario";

const hoje = new Date("2026-11-11T10:00:00");
const sessao = (p: Partial<Consulta>): Consulta => ({
  id: "s",
  data: "2026-11-11",
  hora: "09:00",
  psicologo: "Dra. A",
  status: "agendada",
  ...p,
});

describe("Idade do paciente", () => {
  it("só conta o ano novo depois do aniversário", () => {
    expect(idade("1990-11-12", hoje)).toBe(35);
    expect(idade("1990-11-11", hoje)).toBe(36);
  });
});

describe("Histórico de sessões do prontuário", () => {
  it("mostra só sessões do próprio psicólogo até hoje, sem canceladas, da mais recente para a mais antiga", () => {
    const cliente = {
      consultas: [
        sessao({ id: "1", data: "2026-10-01", status: "realizada" }),
        sessao({ id: "2", data: "2026-10-20", status: "faltou" }),
        sessao({ id: "3", data: "2026-10-25", status: "cancelada" }),
        sessao({ id: "4", data: "2026-10-28", psicologo: "Dr. B", status: "realizada" }),
        sessao({ id: "5", data: "2026-11-11" }),
        sessao({ id: "6", data: "2026-11-18" }),
      ],
    } as Cliente;
    expect(sessoesAnteriores(cliente, "Dra. A", hoje).map((s) => s.id)).toEqual(["5", "2", "1"]);
  });
});

describe("Salvar anotação", () => {
  it("aceita anotação na sessão de hoje", () => {
    expect(motivoNaoSalvarAnotacao(sessao({}), "Dra. A", "Evolução", hoje)).toBeNull();
  });

  it("não aceita anotação em sessão futura", () => {
    expect(motivoNaoSalvarAnotacao(sessao({ data: "2026-11-12" }), "Dra. A", "Evolução", hoje)).not.toBeNull();
  });

  it("não aceita anotação em sessão de outro psicólogo", () => {
    expect(motivoNaoSalvarAnotacao(sessao({}), "Dr. B", "Evolução", hoje)).not.toBeNull();
  });

  it("não aceita anotação vazia", () => {
    expect(motivoNaoSalvarAnotacao(sessao({}), "Dra. A", "   ", hoje)).not.toBeNull();
  });
});
