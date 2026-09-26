import { describe, expect, it } from "vitest";
import { montarPromptFinal } from "./prompts";

describe("montarPromptFinal", () => {
  it("envolve o assunto no prompt base universal", () => {
    expect(montarPromptFinal("um gato")).toBe(
      "Uma tatuagem em papel fotográfico branco brilhante de: um gato, sem fundo de estúdio"
    );
  });
});
