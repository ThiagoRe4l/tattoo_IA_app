import { describe, expect, it } from "vitest";
import { binarizarPorBordas, LIMIAR_PADRAO } from "./stencil";

function criarFixturePretoBranco(): {
  pixels: Uint8ClampedArray<ArrayBuffer>;
  largura: number;
  altura: number;
} {
  const largura = 6;
  const altura = 6;
  const pixels = new Uint8ClampedArray(largura * altura * 4);

  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const offset = (y * largura + x) * 4;
      const valor = x >= largura / 2 ? 255 : 0;
      pixels[offset] = valor;
      pixels[offset + 1] = valor;
      pixels[offset + 2] = valor;
      pixels[offset + 3] = 255;
    }
  }

  return { pixels, largura, altura };
}

describe("binarizarPorBordas", () => {
  it("produz só pixels preto puro ou branco puro, sem tons intermediários", () => {
    const { pixels, largura, altura } = criarFixturePretoBranco();
    const resultado = binarizarPorBordas(pixels, largura, altura, LIMIAR_PADRAO);

    for (let i = 0; i < resultado.length; i += 4) {
      const r = resultado[i];
      const g = resultado[i + 1];
      const b = resultado[i + 2];
      const a = resultado[i + 3];

      const ehPretoPuro = r === 0 && g === 0 && b === 0;
      const ehBrancoPuro = r === 255 && g === 255 && b === 255;

      expect(ehPretoPuro || ehBrancoPuro).toBe(true);
      expect(a).toBe(255);
    }
  });

  it("marca a borda entre as duas regiões como preta e o resto como branco", () => {
    const { pixels, largura, altura } = criarFixturePretoBranco();
    const resultado = binarizarPorBordas(pixels, largura, altura, LIMIAR_PADRAO);

    const lerCanalVermelho = (x: number, y: number) => resultado[(y * largura + x) * 4];

    // colunas afastadas da borda ficam brancas (sem gradiente de luminância)
    expect(lerCanalVermelho(0, 3)).toBe(255);
    expect(lerCanalVermelho(1, 3)).toBe(255);
    expect(lerCanalVermelho(4, 3)).toBe(255);
    expect(lerCanalVermelho(5, 3)).toBe(255);

    // colunas exatamente na transição preto/branco ficam pretas (contorno)
    expect(lerCanalVermelho(2, 3)).toBe(0);
    expect(lerCanalVermelho(3, 3)).toBe(0);
  });

  it("não gera nenhum contorno numa imagem completamente uniforme", () => {
    const largura = 4;
    const altura = 4;
    const pixels = new Uint8ClampedArray(largura * altura * 4);

    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 128;
      pixels[i + 1] = 128;
      pixels[i + 2] = 128;
      pixels[i + 3] = 255;
    }

    const resultado = binarizarPorBordas(pixels, largura, altura, LIMIAR_PADRAO);

    for (let i = 0; i < resultado.length; i += 4) {
      expect(resultado[i]).toBe(255);
      expect(resultado[i + 1]).toBe(255);
      expect(resultado[i + 2]).toBe(255);
      expect(resultado[i + 3]).toBe(255);
    }
  });
});
