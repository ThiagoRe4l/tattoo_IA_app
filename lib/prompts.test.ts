import { describe, expect, it } from "vitest";
import { montarPromptFinal } from "./prompts";

describe("montarPromptFinal", () => {
  it("envolve o assunto no prompt base universal", () => {
    expect(montarPromptFinal("um gato")).toBe(
      "Um design de tatuagem pronto para transferência de decalque, um gato, em preto e cinza detalhado, impresso em fundo branco puro. A ilustração segue seu próprio contorno artístico natural — nunca o contorno de um braço, perna, ou qualquer parte do corpo, mesmo que a descrição mencione onde a tatuagem será aplicada."
    );
  });
});
