"use client";

import { useState } from "react";

type ImagemGerada = {
  data: string;
  mimeType: string;
};

type Resultado = {
  imagens: ImagemGerada[];
  solicitadas: number;
  geradas: number;
  aviso?: string;
};

type Erro = {
  mensagem: string;
  restantes?: number;
};

function extensaoDoMimeType(mimeType: string): string {
  return mimeType.split("/")[1] || "png";
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<Erro | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);
    setResultado(null);
    setCarregando(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, quantidade }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setErro({
          mensagem: body?.error ?? "Não foi possível gerar as imagens",
          restantes: response.status === 409 ? body?.restantes : undefined,
        });
        return;
      }

      setResultado(body);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-10 font-sans dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
          Gerar referências de tatuagem
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-black"
        >
          <label
            htmlFor="prompt"
            className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
          >
            Descreva a tatuagem
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            className="rounded border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
          />

          <label
            htmlFor="quantidade"
            className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
          >
            Quantidade
          </label>
          <select
            id="quantidade"
            value={quantidade}
            onChange={(event) => setQuantidade(Number(event.target.value))}
            className="rounded border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>

          <button
            type="submit"
            disabled={carregando || prompt.trim().length === 0}
            className="flex h-11 items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
          >
            {carregando ? "Gerando..." : "Gerar"}
          </button>
        </form>

        {erro && (
          <p className="text-sm text-red-600">
            {erro.mensagem}
            {erro.restantes !== undefined &&
              ` Restam ${erro.restantes} geração(ões) neste mês.`}
          </p>
        )}

        {resultado && (
          <div className="flex flex-col gap-4">
            {resultado.aviso && (
              <p className="text-sm text-amber-600">{resultado.aviso}</p>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {resultado.imagens.map((imagem, indice) => {
                const dataUrl = `data:${imagem.mimeType};base64,${imagem.data}`;
                const extensao = extensaoDoMimeType(imagem.mimeType);

                return (
                  <div key={indice} className="flex flex-col gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- imagem gerada em memoria (data URL), sem dominio remoto pra otimizar */}
                    <img
                      src={dataUrl}
                      alt={`Tatuagem gerada ${indice + 1}`}
                      className="rounded border border-black/[.08] dark:border-white/[.145]"
                    />
                    <a
                      href={dataUrl}
                      download={`tatuagem-${indice + 1}.${extensao}`}
                      className="flex h-9 items-center justify-center rounded-full border border-black/[.08] px-4 text-sm font-medium text-black transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
                    >
                      Baixar
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
