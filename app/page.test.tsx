// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Home from "./page";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
});

function preencherEGerar(
  options: { prompt?: string; quantidade?: number } = {}
) {
  const { prompt = "um dragão em aquarela", quantidade } = options;

  fireEvent.change(screen.getByLabelText(/descreva a tatuagem/i), {
    target: { value: prompt },
  });

  if (quantidade !== undefined) {
    fireEvent.click(
      screen.getByRole("button", { name: String(quantidade) })
    );
  }

  fireEvent.click(screen.getByRole("button", { name: /^gerar$/i }));
}

describe("seletor de quantidade", () => {
  it("comeca com 1 selecionado e troca o aria-pressed ao clicar em outro numero", () => {
    render(<Home />);
    const grupo = screen.getByRole("group", { name: /quantidade/i });

    expect(within(grupo).getByRole("button", { name: "1" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(within(grupo).getByRole("button", { name: "3" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    fireEvent.click(within(grupo).getByRole("button", { name: "3" }));

    expect(within(grupo).getByRole("button", { name: "3" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(within(grupo).getByRole("button", { name: "1" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});

describe("Home", () => {
  it("envia prompt e quantidade pra /api/generate", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          imagens: [{ data: "a", mimeType: "image/png" }],
          solicitadas: 2,
          geradas: 2,
        }),
        { status: 200 }
      )
    );

    render(<Home />);
    preencherEGerar({ prompt: "um dragão em aquarela", quantidade: 2 });

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/generate",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ prompt: "um dragão em aquarela", quantidade: 2 }),
        })
      )
    );
  });

  it("mostra estado de carregamento durante a requisicao e volta ao normal depois", async () => {
    let resolverFetch: (response: Response) => void = () => {};
    (fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((resolve) => {
        resolverFetch = resolve;
      })
    );

    render(<Home />);
    preencherEGerar();

    expect(screen.getByRole("button", { name: /gerando/i })).toBeDisabled();

    resolverFetch(
      new Response(
        JSON.stringify({ imagens: [], solicitadas: 1, geradas: 0 }),
        { status: 200 }
      )
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^gerar$/i })).not.toBeDisabled()
    );
  });

  it("renderiza o grid de imagens e o link de download quando a geracao e total", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          imagens: [{ data: "base64fake", mimeType: "image/png" }],
          solicitadas: 1,
          geradas: 1,
        }),
        { status: 200 }
      )
    );

    render(<Home />);
    preencherEGerar();

    const link = await screen.findByRole("link", { name: /baixar/i });
    expect(link).toHaveAttribute("href", "data:image/png;base64,base64fake");
    expect(link).toHaveAttribute("download", "tatuagem-1.png");
    expect(screen.queryByText(/somente/i)).not.toBeInTheDocument();
  });

  it("mostra o aviso quando a geracao e parcial", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          imagens: [{ data: "a", mimeType: "image/png" }],
          solicitadas: 2,
          geradas: 1,
          aviso: "Somente 1 de 2 imagens foram geradas.",
        }),
        { status: 200 }
      )
    );

    render(<Home />);
    preencherEGerar();

    expect(await screen.findByText(/somente 1 de 2/i)).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /baixar/i })).toBeInTheDocument();
  });

  it.each([400, 401, 403, 502])(
    "mostra a mensagem de erro quando a resposta e %i",
    async (status) => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: `erro ${status}` }), { status })
      );

      render(<Home />);
      preencherEGerar();

      expect(await screen.findByText(`erro ${status}`)).toBeInTheDocument();
    }
  );

  it("mostra a mensagem de erro e quantas restam quando a resposta e 409", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: "Cota insuficiente", restantes: 2 }),
        { status: 409 }
      )
    );

    render(<Home />);
    preencherEGerar();

    expect(await screen.findByText(/cota insuficiente/i)).toBeInTheDocument();
    expect(await screen.findByText(/restam 2/i)).toBeInTheDocument();
  });
});
