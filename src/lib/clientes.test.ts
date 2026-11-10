import { describe, expect, it } from "vitest";

import { cpfDuplicado, cpfValido, ultimoAtendimento, type Cliente } from "./clientes";

describe("CPF", () => {
  it("aceita um CPF com dígitos verificadores corretos", () => {
    expect(cpfValido("526.018.159-06")).toBe(true);
  });

  it("recusa um CPF com dígito verificador errado", () => {
    expect(cpfValido("526.018.159-07")).toBe(false);
  });

  it("recusa CPF com todos os dígitos iguais", () => {
    expect(cpfValido("111.111.111-11")).toBe(false);
  });

  it("não permite cadastrar um CPF que já pertence a outro cliente", () => {
    const lista = [{ id: "a", cpf: "526.018.159-06" }] as Cliente[];
    expect(cpfDuplicado(lista, "52601815906")).toBe(true);
    expect(cpfDuplicado(lista, "52601815906", "a")).toBe(false);
  });
});

describe("Último atendimento", () => {
  it("considera só a consulta realizada mais recente, ignorando faltas e agendamentos", () => {
    const cliente = {
      consultas: [
        { id: "1", data: "2026-10-01", hora: "09:00", psicologo: "X", status: "realizada" },
        { id: "2", data: "2026-10-10", hora: "09:00", psicologo: "X", status: "faltou" },
        { id: "3", data: "2026-12-01", hora: "09:00", psicologo: "X", status: "agendada" },
        { id: "4", data: "2026-10-05", hora: "09:00", psicologo: "X", status: "realizada" },
      ],
    } as Pick<Cliente, "consultas">;
    expect(ultimoAtendimento(cliente)?.data).toBe("2026-10-05");
  });

  it("fica vazio para quem nunca foi atendido", () => {
    expect(ultimoAtendimento({ consultas: [] })).toBeUndefined();
  });
});
