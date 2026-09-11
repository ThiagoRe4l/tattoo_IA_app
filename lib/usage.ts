import { sql } from "@/lib/db";

type StudioLimiteRow = {
  limite_mensal: number | null;
};

type ContagemRow = {
  count: number;
};

export type QuotaStatus =
  | { status: "estudio_nao_encontrado" }
  | { status: "sem_limite_configurado" }
  | { status: "ok"; allowed: boolean; used: number; limit: number };

export async function checkQuota(studioId: string): Promise<QuotaStatus> {
  const [studio] = (await sql`
    SELECT limite_mensal FROM studios WHERE id = ${studioId}
  `) as StudioLimiteRow[];

  if (!studio) {
    return { status: "estudio_nao_encontrado" };
  }

  if (studio.limite_mensal === null) {
    return { status: "sem_limite_configurado" };
  }

  const limit = studio.limite_mensal;

  const [{ count }] = (await sql`
    SELECT COUNT(*)::int AS count
    FROM usage_log
    WHERE studio_id = ${studioId}
      AND criado_em >= (
        date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')
        AT TIME ZONE 'America/Sao_Paulo'
      )
  `) as ContagemRow[];

  return { status: "ok", allowed: count < limit, used: count, limit };
}

export async function recordUsage(studioId: string): Promise<void> {
  await sql`INSERT INTO usage_log (studio_id) VALUES (${studioId})`;
}
