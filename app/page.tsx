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

const QUANTIDADES = [1, 2, 3, 4] as const;
const PROPORCOES = ["9:16", "1:1", "16:9"] as const;
const ROTACOES_CARTAO = ["-3deg", "2deg", "-1.5deg", "2.5deg"];

function extensaoDoMimeType(mimeType: string): string {
  return mimeType.split("/")[1] || "png";
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [quantidade, setQuantidade] = useState<(typeof QUANTIDADES)[number]>(1);
  const [proporcao, setProporcao] =
    useState<(typeof PROPORCOES)[number]>("9:16");
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
        body: JSON.stringify({ prompt, quantidade, proporcao }),
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
    <div className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="flex w-full max-w-5xl flex-col gap-6">
        <p className="font-display text-[22px] font-bold">
          Traço Re<span className="text-oxide">4</span>l
        </p>

        <h1 className="text-xl font-semibold text-ink">
          Gerar referências de tatuagem
        </h1>

        <div className="border-t border-line" />

        <div className="flex flex-col gap-10 lg:flex-row">
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-4 lg:w-[520px] lg:shrink-0"
          >
            <label
              htmlFor="prompt"
              className="text-sm font-medium text-faded"
            >
              Descreva a tatuagem
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              className="border-0 border-b-2 border-field bg-transparent px-1 py-2 text-ink outline-none focus:border-ink"
            />

            <span className="text-sm font-medium text-faded">Quantidade</span>
            <div role="group" aria-label="Quantidade" className="flex gap-2">
              {QUANTIDADES.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={quantidade === n}
                  onClick={() => setQuantidade(n)}
                  className={`flex h-12 w-12 items-center justify-center border-2 border-ink text-base font-medium transition-colors ${
                    quantidade === n ? "bg-ink text-paper" : "text-ink"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <span className="text-sm font-medium text-faded">Proporção</span>
            <div role="group" aria-label="Proporção" className="flex gap-2">
              {PROPORCOES.map((valor) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={proporcao === valor}
                  onClick={() => setProporcao(valor)}
                  className={`flex h-12 items-center justify-center border-2 border-ink px-4 text-sm font-medium transition-colors ${
                    proporcao === valor ? "bg-ink text-paper" : "text-ink"
                  }`}
                >
                  {valor}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={carregando || prompt.trim().length === 0}
              className="flex h-11 items-center justify-center rounded bg-oxide px-5 font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {carregando ? "Gerando..." : "Gerar"}
            </button>

            {erro && (
              <p className="text-sm text-oxide">
                {erro.mensagem}
                {erro.restantes !== undefined &&
                  ` Restam ${erro.restantes} geração(ões) neste mês.`}
              </p>
            )}
          </form>

          <div className="flex-1">
            {resultado && (
              <div className="flex flex-col gap-4">
                {resultado.aviso && (
                  <p className="text-sm text-faded">{resultado.aviso}</p>
                )}

                <div className="grid grid-cols-2 gap-6">
                  {resultado.imagens.map((imagem, indice) => {
                    const dataUrl = `data:${imagem.mimeType};base64,${imagem.data}`;
                    const extensao = extensaoDoMimeType(imagem.mimeType);
                    const rotacao =
                      ROTACOES_CARTAO[indice % ROTACOES_CARTAO.length];

                    return (
                      <div
                        key={indice}
                        className="relative flex flex-col gap-2 bg-[#FBF7EE] p-3 pb-4 shadow-md"
                        style={{ transform: `rotate(${rotacao})` }}
                      >
                        <div className="absolute -top-3 left-1/2 h-5 w-14 -translate-x-1/2 rotate-[-6deg] bg-[rgba(138,127,108,0.55)]" />

                        {/* eslint-disable-next-line @next/next/no-img-element -- imagem gerada em memoria (data URL), sem dominio remoto pra otimizar */}
                        <img
                          src={dataUrl}
                          alt={`Tatuagem gerada ${indice + 1}`}
                          className="w-full"
                        />

                        <a
                          href={dataUrl}
                          download={`tatuagem-${indice + 1}.${extensao}`}
                          className="text-center text-sm font-medium text-oxide underline"
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
      </div>
    </div>
  );
}
