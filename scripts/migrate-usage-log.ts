import { sql } from "../lib/db";

async function main() {
  await sql`ALTER TABLE studios ADD COLUMN IF NOT EXISTS limite_mensal INTEGER`;

  await sql`
    CREATE TABLE IF NOT EXISTS usage_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      studio_id UUID NOT NULL REFERENCES studios(id),
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  console.log("Migração aplicada: coluna limite_mensal e tabela usage_log prontas.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
