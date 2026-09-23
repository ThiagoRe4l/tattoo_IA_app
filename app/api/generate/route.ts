import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { checkQuota, releaseUsage, reserveUsage } from "@/lib/usage";

const QUANTIDADE_MIN = 1;
const QUANTIDADE_MAX = 4;

type ImagemGerada = {
  data: string;
  mimeType: string;
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const prompt = body?.prompt;
  const quantidade = body?.quantidade;

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: "Prompt obrigatório" }, { status: 400 });
  }

  if (
    typeof quantidade !== "number" ||
    !Number.isInteger(quantidade) ||
    quantidade < QUANTIDADE_MIN ||
    quantidade > QUANTIDADE_MAX
  ) {
    return NextResponse.json(
      {
        error: `quantidade deve ser um número inteiro entre ${QUANTIDADE_MIN} e ${QUANTIDADE_MAX}`,
      },
      { status: 400 }
    );
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const reservados = await reserveUsage(session.id, quantidade);

  if (reservados.length === 0) {
    const status = await checkQuota(session.id);

    if (status.status === "estudio_nao_encontrado") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (status.status === "sem_limite_configurado") {
      return NextResponse.json(
        { error: "Estúdio sem limite mensal configurado" },
        { status: 403 }
      );
    }

    const restantes = Math.max(status.limit - status.used, 0);

    return NextResponse.json(
      {
        error: `Cota insuficiente para gerar ${quantidade} imagem(ns). Restam ${restantes} geração(ões) neste mês.`,
        restantes,
      },
      { status: 409 }
    );
  }

  const imagens: ImagemGerada[] = [];
  const idsFalhos: string[] = [];

  for (const id of reservados) {
    try {
      imagens.push(await generateImage(prompt));
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      idsFalhos.push(id);
    }
  }

  if (idsFalhos.length > 0) {
    await releaseUsage(idsFalhos);
  }

  if (imagens.length === 0) {
    return NextResponse.json(
      { error: "Falha ao gerar as imagens. Tente novamente." },
      { status: 502 }
    );
  }

  const solicitadas = quantidade;
  const geradas = imagens.length;

  return NextResponse.json({
    imagens,
    solicitadas,
    geradas,
    ...(geradas < solicitadas
      ? { aviso: `Somente ${geradas} de ${solicitadas} imagens foram geradas.` }
      : {}),
  });
}
