import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3.1-flash-image";

export type GeneratedImage = {
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

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const ai = getClient();

  const interaction = await ai.interactions.create({
    model: MODEL,
    input: prompt,
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
