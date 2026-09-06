import { sql } from "../lib/db";

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

  const studios = (await sql`
    SELECT id, nome FROM studios WHERE nome = ${nome}
  `) as { id: string; nome: string }[];

  if (studios.length === 0) {
    console.error(`Nenhum estúdio encontrado com o nome "${nome}"`);
    process.exit(1);
  }

  if (studios.length > 1) {
    console.error(
      `Encontrados ${studios.length} estúdios com o nome "${nome}" (ids: ${studios
        .map((s) => s.id)
        .join(", ")}). Ajuste o nome pra ser único antes de tentar de novo.`
    );
    process.exit(1);
  }

  const [studio] = await sql`
    UPDATE studios
    SET limite_mensal = ${novoLimite}
    WHERE id = ${studios[0].id}
    RETURNING id, nome, limite_mensal
  `;

  console.log("Limite atualizado:", studio);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
