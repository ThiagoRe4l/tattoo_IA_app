export function montarPromptFinal(assunto: string): string {
  return `Um design de tatuagem pronto para transferência de decalque, ${assunto}, em preto e cinza detalhado, impresso em fundo branco puro. A ilustração segue seu próprio contorno artístico natural — nunca o contorno de um braço, perna, ou qualquer parte do corpo, mesmo que a descrição mencione onde a tatuagem será aplicada.`;
}

export const ESTILOS = {
  blackwork: {
    rotulo: "Blackwork",
    tecnica:
      "preenchimento sólido em preto profundo e alto contraste, contornos grossos e definidos, sem gradações de cinza",
  },
  fineline: {
    rotulo: "Fineline",
    tecnica:
      "linhas extremamente finas e precisas, sem preenchimento sólido, traço delicado como desenho a lápis, sombreamento mínimo com pontilhado sutil onde fizer sentido",
  },
  aquarela: {
    rotulo: "Aquarela",
    tecnica:
      "manchas de cor fluidas e translúcidas, respingos e escorridos de tinta, contornos soltos ou inexistentes, cores vibrantes se misturando nas bordas",
  },
  "realismo-pb": {
    rotulo: "Realismo P&B",
    tecnica:
      "sombreamento suave em tons de cinza contínuos, sem contornos duros, profundidade construída só por luz e sombra, microtextura sutil de agulha, alto detalhe fotográfico",
  },
  "realismo-colorido": {
    rotulo: "Realismo colorido",
    tecnica:
      "cores vivas e saturadas com transições suaves de tom, sem contornos grossos, alto detalhe fotográfico",
  },
  "old-school": {
    rotulo: "Old School",
    tecnica:
      "contornos pretos grossos e uniformes, paleta limitada e saturada (vermelho, verde, amarelo, azul), preenchimento chapado, sombreamento mínimo, composição simples e icônica",
  },
  "neo-tradicional": {
    rotulo: "Neo-tradicional",
    tecnica:
      "contornos pretos de espessura variável, paleta rica com sombreamento gradual, ornamentação mais elaborada que old school",
  },
  oriental: {
    rotulo: "Oriental",
    tecnica:
      "traços fortes e fluidos, elementos clássicos do estilo japonês tradicional, paleta vibrante com contornos pretos definidos, composição dinâmica",
  },
  tribal: {
    rotulo: "Tribal",
    tecnica:
      "formas sólidas em preto puro, padrões abstratos simétricos com curvas e pontas afiadas, sem sombreamento nem cor",
  },
  geometrico: {
    rotulo: "Geométrico",
    tecnica:
      "formas e linhas precisas (triângulos, hexágonos, padrões simétricos), traço limpo e uniforme, pouco ou nenhum sombreamento",
  },
  dotwork: {
    rotulo: "Dotwork",
    tecnica:
      "toda a textura e sombreado construídos só com pontos de densidade variável, sem linhas contínuas de contorno",
  },
  chicano: {
    rotulo: "Chicano",
    tecnica:
      "realismo preto e cinza com influência da cultura mexicano-americana, traços suaves, sombreamento delicado",
  },
  biomecanico: {
    rotulo: "Biomecânico",
    tecnica:
      "mistura de elementos orgânicos com estruturas mecânicas, efeito tridimensional de profundidade e textura metálica",
  },
  "trash-polka": {
    rotulo: "Trash Polka",
    tecnica:
      "traços realistas em preto e cinza combinados com manchas e formas abstratas em vermelho vibrante, composição tipo colagem, caótica mas intencional",
  },
} as const;

export type EstiloId = keyof typeof ESTILOS;

export function montarPromptComEstilo(
  assunto: string,
  estiloId: string
): string {
  if (!Object.hasOwn(ESTILOS, estiloId)) {
    throw new Error(`Estilo desconhecido: "${estiloId}"`);
  }

  const estilo = ESTILOS[estiloId as EstiloId];

  return `Um design de tatuagem pronto para transferência de decalque em estilo ${estilo.rotulo}: ${estilo.tecnica}. ${assunto}. A ilustração segue seu próprio contorno artístico natural — nunca o contorno de um braço, perna, ou qualquer parte do corpo, mesmo que a descrição mencione onde a tatuagem será aplicada. Impresso em fundo branco puro.`;
}
