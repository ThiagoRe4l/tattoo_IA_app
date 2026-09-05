import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

type StudioRow = {
  id: string;
  nome: string;
  codigo_hash: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const codigo = body?.codigo;

  if (typeof codigo !== "string" || codigo.length === 0) {
    return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });
  }

  const studios = (await sql`
    SELECT id, nome, codigo_hash FROM studios
  `) as StudioRow[];

  let studioAutenticado: StudioRow | null = null;

  for (const studio of studios) {
    if (await bcrypt.compare(codigo, studio.codigo_hash)) {
      studioAutenticado = studio;
      break;
    }
  }

  if (!studioAutenticado) {
    return NextResponse.json({ error: "Código inválido" }, { status: 401 });
  }

  const token = await createSessionToken({
    id: studioAutenticado.id,
    nome: studioAutenticado.nome,
  });

  const response = NextResponse.json({ nome: studioAutenticado.nome });

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
