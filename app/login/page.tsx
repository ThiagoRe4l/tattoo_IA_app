"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setErro(body?.error ?? "Não foi possível entrar");
        return;
      }

      router.push("/");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <p className="font-display text-[22px] font-bold">
          Traço Re<span className="text-oxide">4</span>l
        </p>

        <h1 className="text-xl font-semibold text-ink">Acesso do estúdio</h1>

        <label htmlFor="codigo" className="text-sm font-medium text-faded">
          Código de acesso
        </label>
        <input
          id="codigo"
          type="password"
          value={codigo}
          onChange={(event) => setCodigo(event.target.value)}
          className="border-0 border-b-2 border-field bg-transparent px-1 py-2 text-ink outline-none focus:border-ink"
          autoFocus
        />

        {erro && <p className="text-sm text-oxide">{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="flex h-11 items-center justify-center rounded bg-oxide px-5 font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
