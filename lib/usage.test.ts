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

    expect(status).toEqual({ allowed: true, used: 3, limit: 10 });
  });

  it("bloqueia uso quando a contagem do mes atingiu o limite", async () => {
    sqlMock.mockResolvedValueOnce([{ limite_mensal: 10 }]);
    sqlMock.mockResolvedValueOnce([{ count: 10 }]);

    const status = await checkQuota(STUDIO_ID);

    expect(status).toEqual({ allowed: false, used: 10, limit: 10 });
  });

  it("bloqueia uso quando o estudio nao tem limite_mensal configurado", async () => {
    sqlMock.mockResolvedValueOnce([{ limite_mensal: null }]);

    const status = await checkQuota(STUDIO_ID);

    expect(status).toEqual({ allowed: false, used: 0, limit: null });
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });

  it("bloqueia uso quando o estudio nao existe", async () => {
    sqlMock.mockResolvedValueOnce([]);

    const status = await checkQuota(STUDIO_ID);

    expect(status).toEqual({ allowed: false, used: 0, limit: null });
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });
});

describe("recordUsage", () => {
  it("insere uma linha em usage_log para o estudio", async () => {
    sqlMock.mockResolvedValueOnce([]);

    await recordUsage(STUDIO_ID);

    expect(sqlMock).toHaveBeenCalledTimes(1);
  });
});
