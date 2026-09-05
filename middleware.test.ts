import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { middleware } from "./middleware";

function requestFor(path: string, cookie?: string) {
  const headers = cookie ? { cookie: `${SESSION_COOKIE_NAME}=${cookie}` } : {};
  return new NextRequest(new URL(path, "http://localhost"), { headers });
}

describe("middleware", () => {
  it("libera /login sem cookie", async () => {
    const response = await middleware(requestFor("/login"));

    expect(response.status).toBe(200);
  });

  it("libera /api/auth/login sem cookie", async () => {
    const response = await middleware(requestFor("/api/auth/login"));

    expect(response.status).toBe(200);
  });

  it("redireciona rota de pagina protegida sem cookie pro /login", async () => {
    const response = await middleware(requestFor("/"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("bloqueia rota de api protegida sem cookie com 401", async () => {
    const response = await middleware(requestFor("/api/generate"));

    expect(response.status).toBe(401);
  });

  it("bloqueia com cookie invalido", async () => {
    const response = await middleware(requestFor("/", "token-invalido"));

    expect(response.status).toBe(307);
  });

  it("libera rota protegida com cookie de sessao valido", async () => {
    const token = await createSessionToken({ id: "studio-1", nome: "Jotadablio Tattoo" });

    const response = await middleware(requestFor("/", token));

    expect(response.status).toBe(200);
  });
});
