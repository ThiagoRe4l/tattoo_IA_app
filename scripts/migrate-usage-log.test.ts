import { describe, expect, it, vi } from "vitest";

const { sqlMock, sqlQueryMock } = vi.hoisted(() => ({
  sqlMock: vi.fn(),
  sqlQueryMock: vi.fn(),
}));

vi.mock("../lib/db", () => ({
  sql: Object.assign(sqlMock, { query: sqlQueryMock }),
}));

import { lerCreateTableUsageLog, migrar } from "./migrate-usage-log";

describe("lerCreateTableUsageLog", () => {
  it("extrai o CREATE TABLE de usage_log direto de db/schema.sql", () => {
    const ddl = lerCreateTableUsageLog();

    expect(ddl).toContain("CREATE TABLE IF NOT EXISTS usage_log");
    expect(ddl).toContain("studio_id UUID NOT NULL REFERENCES studios(id)");
  });
});

describe("migrar", () => {
  it("aplica o ALTER TABLE, cria usage_log e retorna estudios sem limite_mensal", async () => {
    sqlMock.mockResolvedValueOnce([]);
    sqlQueryMock.mockResolvedValueOnce([]);
    sqlMock.mockResolvedValueOnce([{ id: "s1", nome: "Estúdio 1" }]);

    const semLimite = await migrar();

    expect(semLimite).toEqual([{ id: "s1", nome: "Estúdio 1" }]);
    expect(sqlQueryMock).toHaveBeenCalledTimes(1);
    expect(sqlQueryMock.mock.calls[0][0]).toContain(
      "CREATE TABLE IF NOT EXISTS usage_log"
    );
  });

  it("retorna lista vazia quando todo estudio ja tem limite_mensal", async () => {
    sqlMock.mockResolvedValueOnce([]);
    sqlQueryMock.mockResolvedValueOnce([]);
    sqlMock.mockResolvedValueOnce([]);

    const semLimite = await migrar();

    expect(semLimite).toEqual([]);
  });
});
