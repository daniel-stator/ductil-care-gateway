import { describe, expect, it } from "vitest";

import { horariosLivres, motivoBloqueio } from "./agenda";
import type { Cliente } from "./clientes";

const agora = new Date("2026-11-11T10:30:00");
const clientes = [
  {
    id: "a",
    nome: "A",
    consultas: [
      { id: "1", data: "2026-11-12", hora: "09:00", psicologo: "Dra. Helena Prado", status: "agendada" },
      { id: "2", data: "2026-11-12", hora: "10:00", psicologo: "Dra. Helena Prado", status: "cancelada" },
    ],
  },
  { id: "b", nome: "B", consultas: [] },
] as Cliente[];
const pedido = { clienteId: "b", data: "2026-11-12", hora: "11:00", psicologo: "Dra. Helena Prado" };

describe("Marcar consulta", () => {
  it("permite marcar um horário livre no futuro", () => {
    expect(motivoBloqueio(clientes, pedido, agora)).toBeNull();
  });

  it("não permite marcar horário já ocupado do psicólogo", () => {
    expect(motivoBloqueio(clientes, { ...pedido, hora: "09:00" }, agora)).toBe("Este horário já está ocupado");
  });

  it("consulta cancelada libera o horário", () => {
    expect(motivoBloqueio(clientes, { ...pedido, hora: "10:00" }, agora)).toBeNull();
  });

  it("não permite marcar no sábado", () => {
    expect(motivoBloqueio(clientes, { ...pedido, data: "2026-11-14" }, agora)).toBe(
      "A clínica atende de segunda a sexta",
    );
  });

  it("não permite marcar em horário que já passou", () => {
    expect(motivoBloqueio(clientes, { ...pedido, data: "2026-11-11", hora: "09:00" }, agora)).toBe(
      "Escolha um horário futuro",
    );
  });

  it("horários livres do dia excluem os já passados e os ocupados", () => {
    expect(horariosLivres(clientes, "2026-11-11", "Dra. Helena Prado", agora)).toEqual([
      "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
    ]);
  });
});
