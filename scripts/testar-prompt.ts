import "./env";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { generateImage } from "../lib/gemini";
import { ESTILOS, montarPromptComEstilo, montarPromptFinal } from "../lib/prompts";

const PROPORCAO = "9:16";
const QUANTIDADE_MIN = 1;
const QUANTIDADE_MAX = 4;
const PASTA_SAIDA = path.resolve(import.meta.dirname, "../tmp");

function uso(): never {
  console.error(
    "Uso: npx tsx --conditions=react-server scripts/testar-prompt.ts <assunto> [estilo] [quantidade]"
  );
  process.exit(1);
}

async function main() {
  const [assunto, arg2, arg3] = process.argv.slice(2);

  if (!assunto) {
    uso();
  }

  let estiloId: string | undefined;
  let quantidadeArg: string | undefined;

  if (arg2 !== undefined && !/^\d+$/.test(arg2)) {
    estiloId = arg2;
    quantidadeArg = arg3;
  } else {
    quantidadeArg = arg2;
  }

  if (estiloId && !Object.hasOwn(ESTILOS, estiloId)) {
    console.error(`estilo deve ser um de: ${Object.keys(ESTILOS).join(", ")}`);
    process.exit(1);
  }

  const quantidade = quantidadeArg ? Number(quantidadeArg) : 1;

  if (
    !Number.isInteger(quantidade) ||
    quantidade < QUANTIDADE_MIN ||
    quantidade > QUANTIDADE_MAX
  ) {
    console.error(
      `quantidade deve ser um número inteiro entre ${QUANTIDADE_MIN} e ${QUANTIDADE_MAX}`
    );
    process.exit(1);
  }

  const promptFinal = estiloId
    ? montarPromptComEstilo(assunto, estiloId)
    : montarPromptFinal(assunto);

  console.log("Prompt final:", promptFinal);

  mkdirSync(PASTA_SAIDA, { recursive: true });

  for (let i = 0; i < quantidade; i++) {
    const imagem = await generateImage(promptFinal, PROPORCAO);
    const extensao = imagem.mimeType.split("/")[1] || "png";
    const nomeArquivo = `${estiloId ?? "sem-estilo"}-${Date.now()}-${i + 1}.${extensao}`;
    const caminho = path.join(PASTA_SAIDA, nomeArquivo);

    writeFileSync(caminho, Buffer.from(imagem.data, "base64"));

    console.log(caminho);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
