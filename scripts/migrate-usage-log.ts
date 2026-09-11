import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "../lib/db";

const SCHEMA_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../db/schema.sql"
);

type StudioRow = { id: string; nome: string };

export function lerCreateTableUsageLog(): string {
  const schemaSql = readFileSync(SCHEMA_PATH, "utf-8");
  const match = schemaSql.match(/CREATE TABLE IF NOT EXISTS usage_log[\s\S]*?\);/);

  if (!match) {
    throw new Error("Não encontrei a definição de usage_log em db/schema.sql");
  }

  return match[0];
}

export async function migrar(): Promise<StudioRow[]> {
  await sql`ALTER TABLE studios ADD COLUMN IF NOT EXISTS limite_mensal INTEGER`;
  await sql.query(lerCreateTableUsageLog());

  return (await sql`
    SELECT id, nome FROM studios WHERE limite_mensal IS NULL
  `) as StudioRow[];
}

async function main() {
  const semLimite = await migrar();

  console.log("Migração aplicada: coluna limite_mensal e tabela usage_log prontas.");

  if (semLimite.length > 0) {
    console.warn(
      `Aviso: ${semLimite.length} estúdio(s) ficaram sem limite_mensal e serão bloqueados até rodar scripts/set-limit.ts:`
    );
    for (const studio of semLimite) {
      console.warn(`  - ${studio.id} (${studio.nome})`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
