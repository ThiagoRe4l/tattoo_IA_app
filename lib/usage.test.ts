import { describe, expect, it, vi } from "vitest";

const { sqlMock } = vi.hoisted(() => ({ sqlMock: vi.fn() }));

vi.mock("@/lib/db", () => ({ sql: sqlMock }));

import { checkQuota, recordUsage } from "./usage";

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

describe("recordUsage", () => {
  it("insere uma linha em usage_log para o estudio", async () => {
    sqlMock.mockResolvedValueOnce([]);

    await recordUsage(STUDIO_ID);

    expect(sqlMock).toHaveBeenCalledTimes(1);
  });
});
