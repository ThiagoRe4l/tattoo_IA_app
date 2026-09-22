import "./env";
import { fileURLToPath } from "node:url";
import { sql } from "../lib/db";

type StudioRow = { id: string; nome: string };

export async function atualizarLimite(nome: string, novoLimite: number) {
  const studios = (await sql`
    SELECT id, nome FROM studios WHERE nome = ${nome}
  `) as StudioRow[];

  if (studios.length === 0) {
    throw new Error(`Nenhum estúdio encontrado com o nome "${nome}"`);
  }

  if (studios.length > 1) {
    throw new Error(
      `Encontrados ${studios.length} estúdios com o nome "${nome}" (ids: ${studios
        .map((s) => s.id)
        .join(", ")}). Ajuste o nome pra ser único antes de tentar de novo.`
    );
  }

  const [studio] = await sql`
    UPDATE studios
    SET limite_mensal = ${novoLimite}
    WHERE id = ${studios[0].id}
    RETURNING id, nome, limite_mensal
  `;

  return studio;
}

async function main() {
  const [nome, novoLimiteArg] = process.argv.slice(2);

  if (!nome || !novoLimiteArg) {
    console.error("Uso: npx tsx scripts/set-limit.ts <nome> <novo_limite>");
    process.exit(1);
  }

  const novoLimite = Number(novoLimiteArg);

  if (!Number.isInteger(novoLimite) || novoLimite <= 0) {
    console.error("novo_limite deve ser um número inteiro positivo");
    process.exit(1);
  }

  try {
    const studio = await atualizarLimite(nome, novoLimite);
    console.log("Limite atualizado:", studio);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
