"use client";

import { useEffect, useState } from "react";
import type { Proporcao } from "@/lib/gemini";
import { gerarStencil } from "@/lib/stencil";

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
  const [stencil, setStencil] = useState<string | null>(null);
  const [carregandoStencil, setCarregandoStencil] = useState(false);
  const [erroStencil, setErroStencil] = useState<string | null>(null);

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

  async function handleGerarStencil() {
    setErroStencil(null);
    setCarregandoStencil(true);

    try {
      setStencil(await gerarStencil(dataUrl));
    } catch (error) {
      setErroStencil(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o stencil."
      );
    } finally {
      setCarregandoStencil(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto bg-[#FBF7EE] p-6"
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center text-xl font-medium text-ink"
        >
          ×
        </button>

        <div className="flex gap-4">
          <div className="flex flex-1 flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- imagem gerada em memoria (data URL), sem dominio remoto pra otimizar */}
            <img
              src={dataUrl}
              alt={`Tatuagem gerada ${indice + 1}`}
              className="max-h-[60vh] w-auto max-w-full object-contain"
            />
            <a
              href={dataUrl}
              download={`tatuagem-${indice + 1}.${extensao}`}
              className="text-center text-sm font-medium text-oxide underline"
            >
              Baixar
            </a>
          </div>

          {stencil && (
            <div className="flex flex-1 flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- imagem gerada em memoria (data URL), sem dominio remoto pra otimizar */}
              <img
                src={stencil}
                alt={`Stencil da tatuagem ${indice + 1}`}
                className="max-h-[60vh] w-auto max-w-full object-contain"
              />
              <a
                href={stencil}
                download={`tatuagem-${indice + 1}-stencil.png`}
                className="text-center text-sm font-medium text-oxide underline"
              >
                Baixar stencil
              </a>
            </div>
          )}
        </div>

        <p className="text-sm text-faded">{imagem.prompt}</p>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onRegenerar}
            disabled={carregando}
            className="flex h-11 items-center justify-center rounded bg-oxide px-5 font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {carregando ? "Gerando..." : "Gerar novamente"}
          </button>

          <button
            type="button"
            onClick={handleGerarStencil}
            disabled={carregandoStencil}
            className="flex h-11 items-center justify-center rounded border-2 border-ink px-5 font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {carregandoStencil ? "Gerando stencil..." : "Gerar stencil"}
          </button>
        </div>

        {erro && <p className="text-sm text-oxide">{erro}</p>}
        {erroStencil && <p className="text-sm text-oxide">{erroStencil}</p>}
      </div>
    </div>
  );
}
