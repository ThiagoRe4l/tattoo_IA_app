import bcrypt from "bcryptjs";
import { beforeAll, describe, expect, it, vi } from "vitest";

const { sqlMock } = vi.hoisted(() => ({ sqlMock: vi.fn() }));

vi.mock("@/lib/db", () => ({ sql: sqlMock }));

import { verifySessionToken } from "@/lib/session";
import { POST } from "./route";

const STUDIO = { id: "studio-1", nome: "Jotadablio Tattoo" };
const CODIGO_CERTO = "codigo-secreto-123";
let codigoHash: string;

function postCodigo(codigo: unknown) {
  return POST(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo }),
    })
  );
}

beforeAll(async () => {
  codigoHash = await bcrypt.hash(CODIGO_CERTO, 4);
});

describe("POST /api/auth/login", () => {
  it("retorna 400 se o codigo nao for enviado", async () => {
    const response = await postCodigo(undefined);

    expect(response.status).toBe(400);
  });

  it("retorna 401 se o codigo nao bater com nenhum estudio", async () => {
    sqlMock.mockResolvedValueOnce([
      { id: STUDIO.id, nome: STUDIO.nome, codigo_hash: codigoHash },
    ]);

    const response = await postCodigo("codigo-errado");

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("retorna 200 e seta cookie de sessao valido quando o codigo bate", async () => {
    sqlMock.mockResolvedValueOnce([
      { id: STUDIO.id, nome: STUDIO.nome, codigo_hash: codigoHash },
    ]);

    const response = await postCodigo(CODIGO_CERTO);
    expect(response.status).toBe(200);

    const cookie = response.cookies.get("studio_session");
    expect(cookie).toBeDefined();

    const payload = await verifySessionToken(cookie!.value);
    expect(payload).toEqual(STUDIO);
  });
});
