import "./env";
import bcrypt from "bcryptjs";
import { sql } from "../lib/db";

async function main() {
  const [nome, codigo, limiteMensalArg] = process.argv.slice(2);

  if (!nome || !codigo || !limiteMensalArg) {
    console.error(
      "Uso: npx tsx scripts/create-studio.ts <nome> <codigo> <limite_mensal>"
    );
    process.exit(1);
  }

  const limiteMensal = Number(limiteMensalArg);

  if (!Number.isInteger(limiteMensal) || limiteMensal <= 0) {
    console.error("limite_mensal deve ser um número inteiro positivo");
    process.exit(1);
  }

  const codigoHash = await bcrypt.hash(codigo, 12);

  const [studio] = await sql`
    INSERT INTO studios (nome, codigo_hash, limite_mensal)
    VALUES (${nome}, ${codigoHash}, ${limiteMensal})
    RETURNING id, nome, limite_mensal, criado_em
  `;

  console.log("Estúdio criado:", studio);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
