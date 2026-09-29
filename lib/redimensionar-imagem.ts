const MAX_LADO_MAIOR = 1600;
const QUALIDADE_INICIAL = 0.85;
const QUALIDADE_PASSO = 0.1;
const QUALIDADE_MINIMA = 0.5;
const ORCAMENTO_BYTES_POR_IMAGEM = 400 * 1024;

export type ImagemRedimensionada = {
  data: string;
  mimeType: string;
  dataUrl: string;
};

function carregarImagemDeArquivo(arquivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();

    imagem.onload = () => {
      URL.revokeObjectURL(url);
      resolve(imagem);
    };
    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível carregar a imagem."));
    };

    imagem.src = url;
  });
}

function canvasParaBlob(
  canvas: HTMLCanvasElement,
  qualidade: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Não foi possível gerar a imagem redimensionada."));
        }
      },
      "image/jpeg",
      qualidade
    );
  });
}

function blobParaDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result as string);
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    leitor.readAsDataURL(blob);
  });
}

/**
 * Redimensiona e recomprime uma imagem no navegador via Canvas API, pra
 * caber no orçamento de tamanho por imagem da requisição (~400KB, 4
 * imagens cabendo com folga no limite de 4,5MB da Vercel).
 */
export async function redimensionarImagem(
  arquivo: File
): Promise<ImagemRedimensionada> {
  const imagem = await carregarImagemDeArquivo(arquivo);

  const escala = Math.min(
    1,
    MAX_LADO_MAIOR / Math.max(imagem.width, imagem.height)
  );
  const largura = Math.round(imagem.width * escala);
  const altura = Math.round(imagem.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;

  const contexto = canvas.getContext("2d");

  if (!contexto) {
    throw new Error("Não foi possível processar a imagem.");
  }

  contexto.drawImage(imagem, 0, 0, largura, altura);

  let qualidade = QUALIDADE_INICIAL;
  let blob = await canvasParaBlob(canvas, qualidade);

  while (
    blob.size > ORCAMENTO_BYTES_POR_IMAGEM &&
    qualidade > QUALIDADE_MINIMA
  ) {
    qualidade = Math.max(QUALIDADE_MINIMA, qualidade - QUALIDADE_PASSO);
    blob = await canvasParaBlob(canvas, qualidade);
  }

  const dataUrl = await blobParaDataUrl(blob);
  const data = dataUrl.split(",")[1];

  return { data, mimeType: "image/jpeg", dataUrl };
}
