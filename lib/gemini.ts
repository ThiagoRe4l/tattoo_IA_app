import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3.1-flash-image";

export type Proporcao = "9:16" | "1:1" | "16:9";

export type GeneratedImage = {
  data: string;
  mimeType: string;
};

export type ReferenciaImagem = {
  data: string;
  mimeType: string;
};

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurado");
  }

  return new GoogleGenAI({ apiKey });
}

export async function generateImage(
  prompt: string,
  proporcao: Proporcao,
  referencia?: ReferenciaImagem
): Promise<GeneratedImage> {
  const ai = getClient();

  const input = referencia
    ? [
        {
          type: "image" as const,
          data: referencia.data,
          mime_type: referencia.mimeType,
        },
        { type: "text" as const, text: prompt },
      ]
    : prompt;

  const interaction = await ai.interactions.create({
    model: MODEL,
    input,
    response_format: { type: "image", aspect_ratio: proporcao },
  });

  const image = interaction.output_image;

  if (!image?.data) {
    throw new Error("Gemini não retornou imagem");
  }

  return {
    data: image.data,
    mimeType: image.mime_type ?? "image/png",
  };
}
