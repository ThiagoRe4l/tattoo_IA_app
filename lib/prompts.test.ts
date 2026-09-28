import { describe, expect, it } from "vitest";
import { ESTILOS_UI } from "./estilos";
import { ESTILOS, montarPromptComEstilo, montarPromptFinal } from "./prompts";

describe("montarPromptFinal", () => {
  it("envolve o assunto no prompt base universal", () => {
    expect(montarPromptFinal("um gato")).toBe(
      "Um design de tatuagem pronto para transferência de decalque, um gato, em preto e cinza detalhado, em fundo branco puro. A ilustração segue seu próprio contorno artístico natural — nunca o contorno de um braço, perna, ou qualquer parte do corpo, mesmo que a descrição mencione onde a tatuagem será aplicada."
    );
  });
});

describe("montarPromptComEstilo", () => {
  it("compoe o prompt com a tecnica do estilo blackwork", () => {
    expect(montarPromptComEstilo("um gato", "blackwork")).toBe(
      'Um design de tatuagem pronto para transferência de decalque em estilo Blackwork: preenchimento sólido em preto profundo e alto contraste, contornos grossos e definidos, sem gradações de cinza. um gato. A ilustração segue seu próprio contorno artístico natural — nunca o contorno de um braço, perna, ou qualquer parte do corpo, mesmo que a descrição mencione onde a tatuagem será aplicada. Em fundo branco puro.'
    );
  });

  it("compoe o prompt com a tecnica do estilo aquarela", () => {
    expect(montarPromptComEstilo("uma rosa", "aquarela")).toBe(
      'Um design de tatuagem pronto para transferência de decalque em estilo Aquarela: manchas de cor fluidas e translúcidas, respingos e escorridos de tinta, contornos soltos ou inexistentes, cores vibrantes se misturando nas bordas. uma rosa. A ilustração segue seu próprio contorno artístico natural — nunca o contorno de um braço, perna, ou qualquer parte do corpo, mesmo que a descrição mencione onde a tatuagem será aplicada. Em fundo branco puro.'
    );
  });

  it("compoe o prompt com a tecnica do estilo dotwork", () => {
    expect(montarPromptComEstilo("uma caveira", "dotwork")).toBe(
      'Um design de tatuagem pronto para transferência de decalque em estilo Dotwork: toda a textura e sombreado construídos só com pontos de densidade variável, sem linhas contínuas de contorno. uma caveira. A ilustração segue seu próprio contorno artístico natural — nunca o contorno de um braço, perna, ou qualquer parte do corpo, mesmo que a descrição mencione onde a tatuagem será aplicada. Em fundo branco puro.'
    );
  });

  it("lanca erro quando o estiloId nao existe em ESTILOS", () => {
    expect(() => montarPromptComEstilo("um gato", "cubista")).toThrow(
      'Estilo desconhecido: "cubista"'
    );
  });

  it.each(["constructor", "toString"])(
    "lanca erro quando o estiloId e uma chave herdada de Object.prototype (%s)",
    (estiloId) => {
      expect(() => montarPromptComEstilo("um gato", estiloId)).toThrow(
        `Estilo desconhecido: "${estiloId}"`
      );
    }
  );
});

describe("ESTILOS", () => {
  it("tem exatamente os mesmos ids que ESTILOS_UI, sem ficar dessincronizado", () => {
    const idsUi = ESTILOS_UI.map((e) => e.id).sort();
    const idsPrompts = Object.keys(ESTILOS).sort();

    expect(idsPrompts).toEqual(idsUi);
  });
});
