import "server-only";
import { ESTILOS_UI, type EstiloId } from "./estilos";

const ENVELOPE_FINAL =
  "objetos adicionais ao redor e sem moldura. Design tatuável na pele, com linework preciso e em alta definição, sem detalhes impossíveis de reproduzir com agulha.";

export function montarPromptFinal(assunto: string): string {
  return `Um design de tatuagem pronto para transferência de decalque, ${assunto}, em preto e cinza detalhado, em fundo branco puro. A ilustração segue seu próprio contorno artístico natural — nunca o contorno de um braço, perna, ou qualquer parte do corpo, mesmo que a descrição mencione onde a tatuagem será aplicada. Sem ${ENVELOPE_FINAL}`;
}

const TECNICAS: Record<EstiloId, string> = {
  blackwork:
    "preenchimento sólido em preto profundo e alto contraste, contornos grossos e definidos, sem gradações de cinza",
  fineline:
    "linhas extremamente finas e precisas, sem preenchimento sólido, traço delicado, sombreamento mínimo com pontilhado sutil onde fizer sentido",
  aquarela:
    "manchas de cor fluidas e translúcidas, respingos e escorridos de tinta, contornos soltos ou inexistentes, cores vibrantes se misturando nas bordas",
  "realismo-pb":
    "sombreamento suave em tons de cinza contínuos, com hachuras finas e cross-hatching, contraste elevado entre luzes e sombras profundas, transições suaves entre os tons, profundidade construída por luz e sombra, microtextura sutil de agulha, aspecto de gravura clássica misturado com realismo moderno, alto detalhe fotográfico",
  "realismo-colorido":
    "cores vivas e saturadas com transições suaves de tom, sem contornos grossos, alto detalhe fotográfico",
  "old-school":
    "contornos pretos grossos e uniformes, paleta limitada e saturada (vermelho, verde, amarelo, azul), preenchimento chapado, sombreamento mínimo, composição simples e icônica",
  "neo-tradicional":
    "contornos pretos de espessura variável, paleta rica com sombreamento gradual, ornamentação mais elaborada que old school",
  oriental:
    "traços fortes e fluidos, elementos clássicos do estilo japonês tradicional, paleta vibrante com contornos pretos definidos, composição dinâmica",
  tribal:
    "formas sólidas em preto puro, padrões abstratos simétricos com curvas e pontas afiadas, sem sombreamento nem cor",
  geometrico:
    "formas e linhas precisas (triângulos, hexágonos, padrões simétricos), traço limpo e uniforme, pouco ou nenhum sombreamento",
  dotwork:
    "toda a textura e sombreado construídos só com pontos de densidade variável, sem linhas contínuas de contorno",
  chicano:
    "realismo preto e cinza com influência da cultura mexicano-americana, traços suaves, sombreamento delicado",
  biomecanico:
    "mistura de elementos orgânicos com estruturas mecânicas, efeito tridimensional de profundidade e textura metálica",
  "trash-polka":
    "traços realistas em preto e cinza combinados com manchas e formas abstratas em vermelho vibrante, composição tipo colagem, caótica mas intencional",
};

export const ESTILOS: Record<EstiloId, { rotulo: string; tecnica: string }> =
  Object.fromEntries(
    ESTILOS_UI.map(({ id, rotulo }) => [id, { rotulo, tecnica: TECNICAS[id] }])
  ) as Record<EstiloId, { rotulo: string; tecnica: string }>;

export function montarPromptComEstilo(
  assunto: string,
  estiloId: string
): string {
  if (!Object.hasOwn(ESTILOS, estiloId)) {
    throw new Error(`Estilo desconhecido: "${estiloId}"`);
  }

  const estilo = ESTILOS[estiloId as EstiloId];

  return `Um design de tatuagem pronto para transferência de decalque em estilo ${estilo.rotulo}: ${estilo.tecnica}. ${assunto}. A ilustração segue seu próprio contorno artístico natural — nunca o contorno de um braço, perna, ou qualquer parte do corpo, mesmo que a descrição mencione onde a tatuagem será aplicada. Em fundo branco puro, sem ${ENVELOPE_FINAL}`;
}

export function montarPromptEdicao(
  instrucao: string,
  estiloId?: string | null
): string {
  if (
    estiloId !== undefined &&
    estiloId !== null &&
    !Object.hasOwn(ESTILOS, estiloId)
  ) {
    throw new Error(`Estilo desconhecido: "${estiloId}"`);
  }

  const tecnica = estiloId
    ? ` Aplique a técnica do estilo ${ESTILOS[estiloId as EstiloId].rotulo}: ${ESTILOS[estiloId as EstiloId].tecnica}.`
    : "";

  return `Edite a imagem de tatuagem anexada seguindo esta instrução: ${instrucao}. Preserve tudo o que não foi mencionado na instrução.${tecnica} Em fundo branco puro, sem ${ENVELOPE_FINAL}`;
}
