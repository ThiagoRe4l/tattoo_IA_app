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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-8 dark:border-white/[.145] dark:bg-black"
      >
        <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
          Acesso do estúdio
        </h1>

        <label
          htmlFor="codigo"
          className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
        >
          Código de acesso
        </label>
        <input
          id="codigo"
          type="password"
          value={codigo}
          onChange={(event) => setCodigo(event.target.value)}
          className="rounded border border-black/[.08] px-3 py-2 text-black dark:border-white/[.145] dark:text-zinc-50"
          autoFocus
        />

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="flex h-11 items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
