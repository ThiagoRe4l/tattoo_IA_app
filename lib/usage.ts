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

type ReservaRow = {
  id: string;
};

export async function reserveUsage(
  studioId: string,
  quantidade: number
): Promise<string[]> {
  const rows = (await sql`
    WITH lock AS MATERIALIZED (
      SELECT pg_advisory_xact_lock(hashtext(${studioId})::bigint) AS locked
    ),
    mes_atual AS MATERIALIZED (
      SELECT COUNT(*)::int AS usados
      FROM usage_log, lock
      WHERE studio_id = ${studioId}
        AND criado_em >= (
          date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo')
          AT TIME ZONE 'America/Sao_Paulo'
        )
    ),
    estudio AS MATERIALIZED (
      SELECT limite_mensal FROM studios, lock WHERE id = ${studioId}
    )
    INSERT INTO usage_log (studio_id)
    SELECT ${studioId}
    FROM generate_series(1, ${quantidade}), mes_atual, estudio
    WHERE estudio.limite_mensal IS NOT NULL
      AND mes_atual.usados + ${quantidade} <= estudio.limite_mensal
    RETURNING id
  `) as ReservaRow[];

  return rows.map((row) => row.id);
}

export async function releaseUsage(ids: string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await sql`DELETE FROM usage_log WHERE id = ANY(${ids})`;
}
