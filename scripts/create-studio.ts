import bcrypt from "bcryptjs";
import { sql } from "../lib/db";

async function main() {
  const [nome, codigo] = process.argv.slice(2);

  if (!nome || !codigo) {
    console.error("Uso: npx tsx scripts/create-studio.ts <nome> <codigo>");
    process.exit(1);
  }

  const codigoHash = await bcrypt.hash(codigo, 12);

  const [studio] = await sql`
    INSERT INTO studios (nome, codigo_hash)
    VALUES (${nome}, ${codigoHash})
    RETURNING id, nome, criado_em
  `;

  console.log("Estúdio criado:", studio);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
