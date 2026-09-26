const PESO_LUMINANCIA_R = 0.299;
const PESO_LUMINANCIA_G = 0.587;
const PESO_LUMINANCIA_B = 0.114;

const SOBEL_X = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1],
];

const SOBEL_Y = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1],
];

export const LIMIAR_PADRAO = 100;

function calcularLuminancia(
  pixels: Uint8ClampedArray<ArrayBuffer>,
  largura: number,
  altura: number
): Float32Array {
  const luminancia = new Float32Array(largura * altura);

  for (let i = 0; i < largura * altura; i++) {
    const offset = i * 4;
    luminancia[i] =
      PESO_LUMINANCIA_R * pixels[offset] +
      PESO_LUMINANCIA_G * pixels[offset + 1] +
      PESO_LUMINANCIA_B * pixels[offset + 2];
  }

  return luminancia;
}

function amostrarComClamp(
  luminancia: Float32Array,
  largura: number,
  altura: number,
  x: number,
  y: number
): number {
  const xClampado = Math.min(Math.max(x, 0), largura - 1);
  const yClampado = Math.min(Math.max(y, 0), altura - 1);
  return luminancia[yClampado * largura + xClampado];
}

/**
 * Converte um buffer RGBA em preto/branco puro, marcando como preto os
 * pixels onde a magnitude do gradiente de Sobel (borda) passa do limiar.
 */
export function binarizarPorBordas(
  pixels: Uint8ClampedArray<ArrayBuffer>,
  largura: number,
  altura: number,
  limiar: number = LIMIAR_PADRAO
): Uint8ClampedArray<ArrayBuffer> {
  const luminancia = calcularLuminancia(pixels, largura, altura);
  const resultado = new Uint8ClampedArray(pixels.length);

  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      let gx = 0;
      let gy = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const amostra = amostrarComClamp(luminancia, largura, altura, x + dx, y + dy);
          gx += SOBEL_X[dy + 1][dx + 1] * amostra;
          gy += SOBEL_Y[dy + 1][dx + 1] * amostra;
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const valor = magnitude > limiar ? 0 : 255;

      const offset = (y * largura + x) * 4;
      resultado[offset] = valor;
      resultado[offset + 1] = valor;
      resultado[offset + 2] = valor;
      resultado[offset + 3] = 255;
    }
  }

  return resultado;
}

function carregarImagem(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error("Falha ao carregar a imagem para gerar o stencil."));
    imagem.src = dataUrl;
  });
}

/**
 * Gera um stencil (contorno preto sobre fundo branco) a partir de uma data
 * URL de imagem, 100% no navegador via Canvas API.
 */
export async function gerarStencil(
  dataUrl: string,
  limiar: number = LIMIAR_PADRAO
): Promise<string> {
  const imagem = await carregarImagem(dataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = imagem.naturalWidth;
  canvas.height = imagem.naturalHeight;

  const contexto = canvas.getContext("2d");
  if (!contexto) {
    throw new Error("Não foi possível obter o contexto 2d do canvas.");
  }

  contexto.drawImage(imagem, 0, 0);

  const { data, width, height } = contexto.getImageData(0, 0, canvas.width, canvas.height);
  const pixelsBinarizados = binarizarPorBordas(data, width, height, limiar);

  contexto.putImageData(new ImageData(pixelsBinarizados, width, height), 0, 0);

  return canvas.toDataURL("image/png");
}
