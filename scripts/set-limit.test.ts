import { describe, expect, it, vi } from "vitest";

const { sqlMock } = vi.hoisted(() => ({ sqlMock: vi.fn() }));

vi.mock("../lib/db", () => ({ sql: sqlMock }));

import { atualizarLimite } from "./set-limit";

describe("atualizarLimite", () => {
  it("atualiza o limite quando exatamente um estudio tem o nome", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "s1", nome: "Estúdio 1" }]);
    sqlMock.mockResolvedValueOnce([
      { id: "s1", nome: "Estúdio 1", limite_mensal: 50 },
    ]);

    const studio = await atualizarLimite("Estúdio 1", 50);

    expect(studio).toEqual({ id: "s1", nome: "Estúdio 1", limite_mensal: 50 });
    expect(sqlMock).toHaveBeenCalledTimes(2);
  });

  it("falha sem alterar nada quando nenhum estudio tem o nome", async () => {
    sqlMock.mockResolvedValueOnce([]);

    await expect(atualizarLimite("Inexistente", 50)).rejects.toThrow(
      'Nenhum estúdio encontrado com o nome "Inexistente"'
    );
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });

  it("falha sem alterar nada quando mais de um estudio tem o mesmo nome", async () => {
    sqlMock.mockResolvedValueOnce([
      { id: "s1", nome: "Duplicado" },
      { id: "s2", nome: "Duplicado" },
    ]);

    await expect(atualizarLimite("Duplicado", 50)).rejects.toThrow(
      /Encontrados 2 estúdios com o nome "Duplicado"/
    );
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });
});
