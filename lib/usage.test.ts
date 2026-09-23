import { describe, expect, it, vi } from "vitest";

const { sqlMock } = vi.hoisted(() => ({ sqlMock: vi.fn() }));

vi.mock("@/lib/db", () => ({ sql: sqlMock }));

import { checkQuota, releaseUsage, reserveUsage } from "./usage";

const STUDIO_ID = "studio-1";

describe("checkQuota", () => {
  it("permite uso quando a contagem do mes esta abaixo do limite", async () => {
    sqlMock.mockResolvedValueOnce([{ limite_mensal: 10 }]);
    sqlMock.mockResolvedValueOnce([{ count: 3 }]);

    const status = await checkQuota(STUDIO_ID);

    expect(status).toEqual({ status: "ok", allowed: true, used: 3, limit: 10 });
  });

  it("bloqueia uso quando a contagem do mes atingiu o limite", async () => {
    sqlMock.mockResolvedValueOnce([{ limite_mensal: 10 }]);
    sqlMock.mockResolvedValueOnce([{ count: 10 }]);

    const status = await checkQuota(STUDIO_ID);

    expect(status).toEqual({ status: "ok", allowed: false, used: 10, limit: 10 });
  });

  it("retorna sem_limite_configurado quando o estudio existe mas nao tem limite_mensal", async () => {
    sqlMock.mockResolvedValueOnce([{ limite_mensal: null }]);

    const status = await checkQuota(STUDIO_ID);

    expect(status).toEqual({ status: "sem_limite_configurado" });
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });

  it("retorna estudio_nao_encontrado quando o estudio nao existe", async () => {
    sqlMock.mockResolvedValueOnce([]);

    const status = await checkQuota(STUDIO_ID);

    expect(status).toEqual({ status: "estudio_nao_encontrado" });
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });

  it("filtra o mes corrente no fuso America/Sao_Paulo, nao UTC", async () => {
    sqlMock.mockResolvedValueOnce([{ limite_mensal: 10 }]);
    sqlMock.mockResolvedValueOnce([{ count: 0 }]);

    await checkQuota(STUDIO_ID);

    const [strings] = sqlMock.mock.calls[1];
    expect(strings.join("")).toContain("America/Sao_Paulo");
  });
});

describe("reserveUsage", () => {
  it("reserva a quantidade inteira e retorna os ids inseridos quando ha cota", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "u1" }, { id: "u2" }]);

    const ids = await reserveUsage(STUDIO_ID, 2);

    expect(ids).toEqual(["u1", "u2"]);
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });

  it("nao reserva nada quando o estudio nao existe", async () => {
    sqlMock.mockResolvedValueOnce([]);

    const ids = await reserveUsage(STUDIO_ID, 2);

    expect(ids).toEqual([]);
  });

  it("nao reserva nada quando o estudio nao tem limite_mensal configurado", async () => {
    sqlMock.mockResolvedValueOnce([]);

    const ids = await reserveUsage(STUDIO_ID, 2);

    expect(ids).toEqual([]);
  });

  it("nao reserva nada quando a quantidade pedida nao cabe na cota restante", async () => {
    sqlMock.mockResolvedValueOnce([]);

    const ids = await reserveUsage(STUDIO_ID, 4);

    expect(ids).toEqual([]);
  });

  it("usa o mes corrente no fuso America/Sao_Paulo e trava por pg_advisory_xact_lock", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "u1" }]);

    await reserveUsage(STUDIO_ID, 1);

    const [strings] = sqlMock.mock.calls[0];
    const query = strings.join("");
    expect(query).toContain("America/Sao_Paulo");
    expect(query).toContain("pg_advisory_xact_lock");
    expect(query).toContain("generate_series");
  });
});

describe("releaseUsage", () => {
  it("apaga as linhas reservadas pelos ids informados", async () => {
    sqlMock.mockResolvedValueOnce([]);

    await releaseUsage(["u1", "u2"]);

    expect(sqlMock).toHaveBeenCalledTimes(1);
  });

  it("nao chama o banco quando nao ha ids pra liberar", async () => {
    await releaseUsage([]);

    expect(sqlMock).not.toHaveBeenCalled();
  });
});
