import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session";

const studio = { id: "studio-1", nome: "Jotadablio Tattoo" };

describe("session", () => {
  it("verifica um token recem-criado e retorna os dados do estudio", async () => {
    const token = await createSessionToken(studio);

    const payload = await verifySessionToken(token);

    expect(payload).toMatchObject(studio);
  });

  it("rejeita um token adulterado", async () => {
    const token = await createSessionToken(studio);
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");

    const payload = await verifySessionToken(tampered);

    expect(payload).toBeNull();
  });

  it("rejeita um token expirado", async () => {
    const token = await createSessionToken(studio, { expiresInSeconds: -1 });

    const payload = await verifySessionToken(token);

    expect(payload).toBeNull();
  });

  it("rejeita lixo que nao e um token", async () => {
    const payload = await verifySessionToken("nao-e-um-jwt");

    expect(payload).toBeNull();
  });
});
