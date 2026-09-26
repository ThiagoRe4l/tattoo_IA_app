import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  generateImageMock,
  checkQuotaMock,
  reserveUsageMock,
  releaseUsageMock,
  verifySessionTokenMock,
} = vi.hoisted(() => ({
  generateImageMock: vi.fn(),
  checkQuotaMock: vi.fn(),
  reserveUsageMock: vi.fn(),
  releaseUsageMock: vi.fn(),
  verifySessionTokenMock: vi.fn(),
}));

vi.mock("@/lib/gemini", () => ({ generateImage: generateImageMock }));

vi.mock("@/lib/usage", () => ({
  checkQuota: checkQuotaMock,
  reserveUsage: reserveUsageMock,
  releaseUsage: releaseUsageMock,
}));

vi.mock("@/lib/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/session")>();
  return { ...actual, verifySessionToken: verifySessionTokenMock };
});

import { NextRequest } from "next/server";
import { POST } from "./route";

const SESSION = { id: "studio-1", nome: "Estúdio 1" };

function postGenerate(body: unknown, options?: { comCookie?: boolean }) {
  const comCookie = options?.comCookie ?? true;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (comCookie) {
    headers["Cookie"] = "studio_session=token-valido";
  }

  return POST(
    new NextRequest("http://localhost/api/generate", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  verifySessionTokenMock.mockResolvedValue(SESSION);
});

describe("POST /api/generate", () => {
  it("retorna 400 quando prompt esta vazio", async () => {
    const response = await postGenerate({ prompt: "", quantidade: 1 });

    expect(response.status).toBe(400);
    expect(reserveUsageMock).not.toHaveBeenCalled();
  });

  it("retorna 400 quando quantidade esta fora de 1 a 4", async () => {
    const response = await postGenerate({ prompt: "um gato", quantidade: 5 });

    expect(response.status).toBe(400);
    expect(reserveUsageMock).not.toHaveBeenCalled();
  });

  it("retorna 400 quando quantidade nao e um inteiro", async () => {
    const response = await postGenerate({ prompt: "um gato", quantidade: 1.5 });

    expect(response.status).toBe(400);
  });

  it("retorna 400 quando proporcao esta ausente", async () => {
    const response = await postGenerate({ prompt: "um gato", quantidade: 1 });

    expect(response.status).toBe(400);
    expect(reserveUsageMock).not.toHaveBeenCalled();
  });

  it("retorna 400 quando proporcao nao e uma das opcoes validas", async () => {
    const response = await postGenerate({
      prompt: "um gato",
      quantidade: 1,
      proporcao: "4:3",
    });

    expect(response.status).toBe(400);
    expect(reserveUsageMock).not.toHaveBeenCalled();
  });

  it("retorna 401 quando nao ha sessao valida", async () => {
    verifySessionTokenMock.mockResolvedValueOnce(null);

    const response = await postGenerate(
      { prompt: "um gato", quantidade: 1, proporcao: "9:16" },
      { comCookie: false }
    );

    expect(response.status).toBe(401);
    expect(reserveUsageMock).not.toHaveBeenCalled();
  });

  it("retorna 401 quando o estudio da sessao nao existe mais", async () => {
    reserveUsageMock.mockResolvedValueOnce([]);
    checkQuotaMock.mockResolvedValueOnce({ status: "estudio_nao_encontrado" });

    const response = await postGenerate({
      prompt: "um gato",
      quantidade: 1,
      proporcao: "9:16",
    });

    expect(response.status).toBe(401);
  });

  it("retorna 403 quando o estudio nao tem limite_mensal configurado", async () => {
    reserveUsageMock.mockResolvedValueOnce([]);
    checkQuotaMock.mockResolvedValueOnce({ status: "sem_limite_configurado" });

    const response = await postGenerate({
      prompt: "um gato",
      quantidade: 1,
      proporcao: "9:16",
    });

    expect(response.status).toBe(403);
  });

  it("retorna 409 com quantas geracoes restam quando a cota e insuficiente", async () => {
    reserveUsageMock.mockResolvedValueOnce([]);
    checkQuotaMock.mockResolvedValueOnce({
      status: "ok",
      allowed: true,
      used: 8,
      limit: 10,
    });

    const response = await postGenerate({
      prompt: "um gato",
      quantidade: 4,
      proporcao: "9:16",
    });

    expect(response.status).toBe(409);
    const json = await response.json();
    expect(json.restantes).toBe(2);
  });

  it("retorna 200 com todas as imagens quando tudo da certo, repassando a proporcao pro gemini", async () => {
    reserveUsageMock.mockResolvedValueOnce(["u1", "u2"]);
    generateImageMock
      .mockResolvedValueOnce({ data: "a", mimeType: "image/png" })
      .mockResolvedValueOnce({ data: "b", mimeType: "image/png" });

    const response = await postGenerate({
      prompt: "um gato",
      quantidade: 2,
      proporcao: "16:9",
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.solicitadas).toBe(2);
    expect(json.geradas).toBe(2);
    expect(json.imagens).toHaveLength(2);
    expect(json.aviso).toBeUndefined();
    expect(releaseUsageMock).not.toHaveBeenCalled();
    expect(generateImageMock).toHaveBeenCalledWith(
      "Uma tatuagem em papel fotográfico branco brilhante de: um gato, sem fundo de estúdio",
      "16:9"
    );
  });

  it("libera as reservas nao usadas e avisa quando parte das geracoes falha", async () => {
    reserveUsageMock.mockResolvedValueOnce(["u1", "u2", "u3", "u4"]);
    generateImageMock
      .mockResolvedValueOnce({ data: "a", mimeType: "image/png" })
      .mockResolvedValueOnce({ data: "b", mimeType: "image/png" })
      .mockRejectedValueOnce(new Error("falhou"))
      .mockRejectedValueOnce(new Error("falhou"));

    const response = await postGenerate({
      prompt: "um gato",
      quantidade: 4,
      proporcao: "9:16",
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.solicitadas).toBe(4);
    expect(json.geradas).toBe(2);
    expect(json.aviso).toContain("2 de 4");
    expect(releaseUsageMock).toHaveBeenCalledWith(["u3", "u4"]);
  });

  it("retorna 502 e libera tudo quando todas as geracoes falham", async () => {
    reserveUsageMock.mockResolvedValueOnce(["u1", "u2"]);
    generateImageMock.mockRejectedValue(new Error("falhou"));

    const response = await postGenerate({
      prompt: "um gato",
      quantidade: 2,
      proporcao: "9:16",
    });

    expect(response.status).toBe(502);
    expect(releaseUsageMock).toHaveBeenCalledWith(["u1", "u2"]);
  });
});
