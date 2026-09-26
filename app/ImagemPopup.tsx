"use client";

import { useEffect } from "react";
import type { Proporcao } from "@/lib/gemini";

export type ImagemComMetadados = {
  data: string;
  mimeType: string;
  prompt: string;
  proporcao: Proporcao;
};

type Props = {
  imagem: ImagemComMetadados;
  indice: number;
  carregando: boolean;
  erro: string | null;
  onClose: () => void;
  onRegenerar: () => void;
};

function extensaoDoMimeType(mimeType: string): string {
  return mimeType.split("/")[1] || "png";
}

export default function ImagemPopup({
  imagem,
  indice,
  carregando,
  erro,
  onClose,
  onRegenerar,
}: Props) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const dataUrl = `data:${imagem.mimeType};base64,${imagem.data}`;
  const extensao = extensaoDoMimeType(imagem.mimeType);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative flex w-full max-w-2xl flex-col gap-4 bg-[#FBF7EE] p-6"
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-xl font-medium text-ink"
        >
          ×
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element -- imagem gerada em memoria (data URL), sem dominio remoto pra otimizar */}
        <img
          src={dataUrl}
          alt={`Tatuagem gerada ${indice + 1}`}
          className="w-full"
        />

        <p className="text-sm text-faded">{imagem.prompt}</p>

        <div className="flex gap-4">
          <a
            href={dataUrl}
            download={`tatuagem-${indice + 1}.${extensao}`}
            className="flex h-11 items-center justify-center px-5 text-base font-medium text-oxide underline"
          >
            Baixar
          </a>

          <button
            type="button"
            onClick={onRegenerar}
            disabled={carregando}
            className="flex h-11 items-center justify-center rounded bg-oxide px-5 font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {carregando ? "Gerando..." : "Gerar novamente"}
          </button>
        </div>

        {erro && <p className="text-sm text-oxide">{erro}</p>}
      </div>
    </div>
  );
}
