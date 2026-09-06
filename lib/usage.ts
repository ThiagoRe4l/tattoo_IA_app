import { sql } from "@/lib/db";

type StudioLimiteRow = {
  limite_mensal: number | null;
};

type ContagemRow = {
  count: number;
};

export type QuotaStatus = {
  allowed: boolean;
  used: number;
  limit: number | null;
};

export async function checkQuota(studioId: string): Promise<QuotaStatus> {
  const [studio] = (await sql`
    SELECT limite_mensal FROM studios WHERE id = ${studioId}
  `) as StudioLimiteRow[];

  const limit = studio?.limite_mensal ?? null;

  if (limit === null) {
    return { allowed: false, used: 0, limit: null };
  }

  const [{ count }] = (await sql`
    SELECT COUNT(*)::int AS count
    FROM usage_log
    WHERE studio_id = ${studioId}
      AND criado_em >= date_trunc('month', now())
  `) as ContagemRow[];

  return { allowed: count < limit, used: count, limit };
}

export async function recordUsage(studioId: string): Promise<void> {
  await sql`INSERT INTO usage_log (studio_id) VALUES (${studioId})`;
}
