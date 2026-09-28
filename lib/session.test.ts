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
    const [header, payload, signature] = token.split(".");
    const primeiroCaractere = signature[0] === "a" ? "b" : "a";
    const tampered = `${header}.${payload}.${primeiroCaractere}${signature.slice(1)}`;

    const resultado = await verifySessionToken(tampered);

    expect(resultado).toBeNull();
  });

  it("rejeita um token com payload alterado mas assinatura original", async () => {
    const token = await createSessionToken(studio);
    const [header, payload, signature] = token.split(".");

    const payloadDecodificado = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8")
    );
    payloadDecodificado.id = "outro-studio-id";
    const payloadAdulterado = Buffer.from(
      JSON.stringify(payloadDecodificado)
    ).toString("base64url");

    const tampered = `${header}.${payloadAdulterado}.${signature}`;

    const resultado = await verifySessionToken(tampered);

    expect(resultado).toBeNull();
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
