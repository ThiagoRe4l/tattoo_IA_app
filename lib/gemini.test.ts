import { afterEach, describe, expect, it, vi } from "vitest";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAIMock() {
    return { interactions: { create: createMock } };
  }),
}));

import { generateImage } from "./gemini";

const ORIGINAL_API_KEY = process.env.GEMINI_API_KEY;

afterEach(() => {
  process.env.GEMINI_API_KEY = ORIGINAL_API_KEY;
  createMock.mockReset();
});

describe("generateImage", () => {
  it("retorna data e mimeType a partir do output_image da interaction", async () => {
    process.env.GEMINI_API_KEY = "chave-de-teste";
    createMock.mockResolvedValueOnce({
      output_image: { data: "base64-fake", mime_type: "image/png" },
    });

    const imagem = await generateImage("um dragao em aquarela", "9:16");

    expect(imagem).toEqual({ data: "base64-fake", mimeType: "image/png" });
    expect(createMock).toHaveBeenCalledWith({
      model: "gemini-3.1-flash-image",
      input: "um dragao em aquarela",
      response_format: { type: "image", aspect_ratio: "9:16" },
    });
  });

  it("usa image/png como mimeType padrao quando a interaction nao informa", async () => {
    process.env.GEMINI_API_KEY = "chave-de-teste";
    createMock.mockResolvedValueOnce({
      output_image: { data: "base64-fake" },
    });

    const imagem = await generateImage("prompt", "1:1");

    expect(imagem.mimeType).toBe("image/png");
  });

  it("repassa a proporcao pedida pro response_format da interaction", async () => {
    process.env.GEMINI_API_KEY = "chave-de-teste";
    createMock.mockResolvedValueOnce({
      output_image: { data: "base64-fake", mime_type: "image/png" },
    });

    await generateImage("prompt", "16:9");

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: { type: "image", aspect_ratio: "16:9" },
      })
    );
  });

  it("monta o input com uma parte de imagem quando ha uma referencia", async () => {
    process.env.GEMINI_API_KEY = "chave-de-teste";
    createMock.mockResolvedValueOnce({
      output_image: { data: "base64-fake", mime_type: "image/png" },
    });

    await generateImage("edite isso", "9:16", [
      { data: "referencia-base64", mimeType: "image/jpeg" },
    ]);

    expect(createMock).toHaveBeenCalledWith({
      model: "gemini-3.1-flash-image",
      input: [
        { type: "image", data: "referencia-base64", mime_type: "image/jpeg" },
        { type: "text", text: "edite isso" },
      ],
      response_format: { type: "image", aspect_ratio: "9:16" },
    });
  });

  it("monta o input com uma parte de imagem por referencia, seguidas do texto", async () => {
    process.env.GEMINI_API_KEY = "chave-de-teste";
    createMock.mockResolvedValueOnce({
      output_image: { data: "base64-fake", mime_type: "image/png" },
    });

    await generateImage("combine essas duas", "9:16", [
      { data: "referencia-1", mimeType: "image/jpeg" },
      { data: "referencia-2", mimeType: "image/png" },
    ]);

    expect(createMock).toHaveBeenCalledWith({
      model: "gemini-3.1-flash-image",
      input: [
        { type: "image", data: "referencia-1", mime_type: "image/jpeg" },
        { type: "image", data: "referencia-2", mime_type: "image/png" },
        { type: "text", text: "combine essas duas" },
      ],
      response_format: { type: "image", aspect_ratio: "9:16" },
    });
  });

  it("usa input de texto simples quando referencias e um array vazio", async () => {
    process.env.GEMINI_API_KEY = "chave-de-teste";
    createMock.mockResolvedValueOnce({
      output_image: { data: "base64-fake", mime_type: "image/png" },
    });

    await generateImage("um gato", "9:16", []);

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ input: "um gato" })
    );
  });

  it("lanca erro quando a interaction nao retorna output_image", async () => {
    process.env.GEMINI_API_KEY = "chave-de-teste";
    createMock.mockResolvedValueOnce({});

    await expect(generateImage("prompt", "1:1")).rejects.toThrow(
      "Gemini não retornou imagem"
    );
  });

  it("lanca erro quando GEMINI_API_KEY nao esta configurado", async () => {
    delete process.env.GEMINI_API_KEY;

    await expect(generateImage("prompt", "1:1")).rejects.toThrow(
      "GEMINI_API_KEY não configurado"
    );
    expect(createMock).not.toHaveBeenCalled();
  });
});
