// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { redimensionarImagemMock } = vi.hoisted(() => ({
  redimensionarImagemMock: vi.fn(),
}));

vi.mock("@/lib/redimensionar-imagem", () => ({
  redimensionarImagem: redimensionarImagemMock,
}));

import Home from "./page";

function imagemRedimensionadaFake(sufixo: string | number) {
  return {
    data: `base64-redimensionado-${sufixo}`,
    mimeType: "image/jpeg",
    dataUrl: `data:image/jpeg;base64,base64-redimensionado-${sufixo}`,
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  redimensionarImagemMock.mockReset();
  redimensionarImagemMock.mockImplementation((arquivo: File) =>
    Promise.resolve(imagemRedimensionadaFake(arquivo.name))
  );
});

afterEach(() => {
  cleanup();
});

function preencherEGerar(
  options: {
    prompt?: string;
    quantidade?: number;
    proporcao?: string;
    estilo?: string;
  } = {}
) {
  const { prompt = "um dragão em aquarela", quantidade, proporcao, estilo } =
    options;

  fireEvent.change(screen.getByLabelText(/descreva a tatuagem/i), {
    target: { value: prompt },
  });

  if (quantidade !== undefined) {
    fireEvent.click(
      screen.getByRole("button", { name: String(quantidade) })
    );
  }

  if (proporcao !== undefined) {
    fireEvent.click(screen.getByRole("button", { name: proporcao }));
  }

  if (estilo !== undefined) {
    fireEvent.click(screen.getByRole("button", { name: estilo }));
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

describe("seletor de proporção", () => {
  it("comeca com 9:16 selecionado e troca o aria-pressed ao clicar em outra opcao", () => {
    render(<Home />);
    const grupo = screen.getByRole("group", { name: /proporção/i });

    expect(
      within(grupo).getByRole("button", { name: "9:16" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(grupo).getByRole("button", { name: "16:9" })
    ).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(within(grupo).getByRole("button", { name: "16:9" }));

    expect(
      within(grupo).getByRole("button", { name: "16:9" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(grupo).getByRole("button", { name: "9:16" })
    ).toHaveAttribute("aria-pressed", "false");
  });
});

describe("seletor de estilo", () => {
  it("comeca sem nenhum estilo selecionado", () => {
    render(<Home />);
    const grupo = screen.getByRole("group", { name: /^estilo$/i });

    expect(
      within(grupo).getByRole("button", { name: "Blackwork" })
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(grupo).getByRole("button", { name: "Aquarela" })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("seleciona um estilo ao clicar e desmarca ao clicar de novo no mesmo", () => {
    render(<Home />);
    const grupo = screen.getByRole("group", { name: /^estilo$/i });
    const botaoBlackwork = within(grupo).getByRole("button", {
      name: "Blackwork",
    });

    fireEvent.click(botaoBlackwork);
    expect(botaoBlackwork).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(botaoBlackwork);
    expect(botaoBlackwork).toHaveAttribute("aria-pressed", "false");
  });

  it("selecionar um estilo diferente troca a selecao, sem manter os dois marcados", () => {
    render(<Home />);
    const grupo = screen.getByRole("group", { name: /^estilo$/i });

    fireEvent.click(within(grupo).getByRole("button", { name: "Blackwork" }));
    fireEvent.click(within(grupo).getByRole("button", { name: "Aquarela" }));

    expect(
      within(grupo).getByRole("button", { name: "Blackwork" })
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(grupo).getByRole("button", { name: "Aquarela" })
    ).toHaveAttribute("aria-pressed", "true");
  });
});

function anexar(nomeArquivo: string) {
  const arquivo = new File(["conteudo-fake"], nomeArquivo, {
    type: "image/png",
  });

  fireEvent.change(screen.getByLabelText(/anexar imagem/i), {
    target: { files: [arquivo] },
  });

  return arquivo;
}

describe("anexar imagens de referencia", () => {
  it("mostra previa e muda o rotulo do campo depois de anexar; remover volta ao normal", async () => {
    render(<Home />);

    expect(screen.getByLabelText(/descreva a tatuagem/i)).toBeInTheDocument();

    anexar("referencia.png");

    expect(
      await screen.findByAltText(/prévia da imagem anexada/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/o que você quer mudar ou recriar/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /remover/i }));

    expect(
      screen.queryByAltText(/prévia da imagem anexada/i)
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/descreva a tatuagem/i)).toBeInTheDocument();
  });

  it("rejeita arquivo maior que o limite de entrada sem anexar nem redimensionar", () => {
    render(<Home />);

    const arquivoGrande = new File(["x"], "grande.png", { type: "image/png" });
    Object.defineProperty(arquivoGrande, "size", { value: 16 * 1024 * 1024 });

    fireEvent.change(screen.getByLabelText(/anexar imagem/i), {
      target: { files: [arquivoGrande] },
    });

    expect(screen.getByText(/imagem muito grande/i)).toBeInTheDocument();
    expect(
      screen.queryByAltText(/prévia da imagem anexada/i)
    ).not.toBeInTheDocument();
    expect(redimensionarImagemMock).not.toHaveBeenCalled();
  });

  it("anexa ate 4 imagens, remove uma especifica da lista, e esconde o controle de anexar ao chegar em 4", async () => {
    render(<Home />);

    anexar("um.png");
    await screen.findByAltText(/prévia da imagem anexada 1/i);
    anexar("dois.png");
    await screen.findByAltText(/prévia da imagem anexada 2/i);

    const botoesRemover = screen.getAllByRole("button", { name: /remover/i });
    expect(botoesRemover).toHaveLength(2);

    // remove a primeira (indice 0) - a segunda deve ser a unica que sobra
    fireEvent.click(botoesRemover[0]);

    expect(screen.getAllByRole("img", { name: /prévia/i })).toHaveLength(1);
    expect(
      screen.getByAltText(/prévia da imagem anexada 1/i)
    ).toHaveAttribute("src", "data:image/jpeg;base64,base64-redimensionado-dois.png");

    anexar("tres.png");
    await screen.findByAltText(/prévia da imagem anexada 2/i);
    anexar("quatro.png");
    await screen.findByAltText(/prévia da imagem anexada 3/i);
    anexar("cinco.png");
    await screen.findByAltText(/prévia da imagem anexada 4/i);

    expect(screen.getAllByRole("img", { name: /prévia/i })).toHaveLength(4);
    expect(
      screen.queryByLabelText(/anexar imagem/i)
    ).not.toBeInTheDocument();
  });

  it("inclui imagensReferencia (array) em base64 no corpo do POST quando ha imagens anexadas", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ imagens: [], solicitadas: 1, geradas: 0 }),
        { status: 200 }
      )
    );

    render(<Home />);

    anexar("um.png");
    await screen.findByAltText(/prévia da imagem anexada 1/i);
    anexar("dois.png");
    await screen.findByAltText(/prévia da imagem anexada 2/i);

    fireEvent.change(
      screen.getByLabelText(/o que você quer mudar ou recriar/i),
      { target: { value: "junte essas duas" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /^gerar$/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(options.body as string);

    expect(body.prompt).toBe("junte essas duas");
    expect(body.imagensReferencia).toHaveLength(2);
    expect(body.imagensReferencia[0]).toEqual({
      data: "base64-redimensionado-um.png",
      mimeType: "image/jpeg",
    });
    expect(body.imagensReferencia[1]).toEqual({
      data: "base64-redimensionado-dois.png",
      mimeType: "image/jpeg",
    });
  });
});

describe("Home", () => {
  it("envia prompt, quantidade e proporcao pra /api/generate", async () => {
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
    preencherEGerar({
      prompt: "um dragão em aquarela",
      quantidade: 2,
      proporcao: "16:9",
    });

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/generate",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            prompt: "um dragão em aquarela",
            quantidade: 2,
            proporcao: "16:9",
            estilo: null,
            imagensReferencia: [],
          }),
        })
      )
    );
  });

  it("usa 9:16 como proporcao padrao quando nao muda a selecao", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ imagens: [], solicitadas: 1, geradas: 0 }),
        { status: 200 }
      )
    );

    render(<Home />);
    preencherEGerar();

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/generate",
        expect.objectContaining({
          body: JSON.stringify({
            prompt: "um dragão em aquarela",
            quantidade: 1,
            proporcao: "9:16",
            estilo: null,
            imagensReferencia: [],
          }),
        })
      )
    );
  });

  it("envia o id do estilo selecionado no corpo do POST", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ imagens: [], solicitadas: 1, geradas: 0 }),
        { status: 200 }
      )
    );

    render(<Home />);
    preencherEGerar({ estilo: "Blackwork" });

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/generate",
        expect.objectContaining({
          body: JSON.stringify({
            prompt: "um dragão em aquarela",
            quantidade: 1,
            proporcao: "9:16",
            estilo: "blackwork",
            imagensReferencia: [],
          }),
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

describe("popup de imagem", () => {
  async function gerarLoteDeDuas() {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          imagens: [
            { data: "img-a", mimeType: "image/png" },
            { data: "img-b", mimeType: "image/png" },
          ],
          solicitadas: 2,
          geradas: 2,
        }),
        { status: 200 }
      )
    );

    render(<Home />);
    preencherEGerar({
      prompt: "um dragão em aquarela",
      quantidade: 2,
      proporcao: "16:9",
    });

    await screen.findAllByRole("img");
  }

  it("abre o popup com a imagem, prompt e proporcao usados naquela geracao", async () => {
    await gerarLoteDeDuas();

    const imagensDoGrid = screen.getAllByRole("img");
    fireEvent.click(imagensDoGrid[1]);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("img")).toHaveAttribute(
      "src",
      "data:image/png;base64,img-b"
    );
    expect(within(dialog).getByText("um dragão em aquarela")).toBeInTheDocument();
  });

  it("gerar novamente substitui so a imagem do indice clicado, sem afetar as outras", async () => {
    await gerarLoteDeDuas();

    const imagensDoGrid = screen.getAllByRole("img");
    fireEvent.click(imagensDoGrid[1]);

    const dialog = await screen.findByRole("dialog");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          imagens: [{ data: "img-b-nova", mimeType: "image/png" }],
          solicitadas: 1,
          geradas: 1,
        }),
        { status: 200 }
      )
    );

    fireEvent.click(
      within(dialog).getByRole("button", { name: /gerar novamente/i })
    );

    await waitFor(() =>
      expect(fetch).toHaveBeenLastCalledWith(
        "/api/generate",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            prompt: "um dragão em aquarela",
            quantidade: 1,
            proporcao: "16:9",
            estilo: null,
            imagensReferencia: [],
          }),
        })
      )
    );

    await waitFor(() =>
      expect(within(dialog).getByRole("img")).toHaveAttribute(
        "src",
        "data:image/png;base64,img-b-nova"
      )
    );

    const todasImagens = screen.getAllByRole("img");
    const comImgBNova = todasImagens.filter((img) =>
      img.getAttribute("src")?.includes("img-b-nova")
    );
    const comImgA = todasImagens.filter((img) =>
      img.getAttribute("src")?.includes("img-a")
    );

    // uma no grid (indice 1) + uma no popup
    expect(comImgBNova).toHaveLength(2);
    // a imagem do indice 0 permanece intacta, so no grid (popup nao a mostra)
    expect(comImgA).toHaveLength(1);
  });

  it("gerar novamente reenvia o mesmo estilo usado na geracao original", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          imagens: [{ data: "img-a", mimeType: "image/png" }],
          solicitadas: 1,
          geradas: 1,
        }),
        { status: 200 }
      )
    );

    render(<Home />);
    preencherEGerar({ estilo: "Blackwork" });

    fireEvent.click(await screen.findByRole("img"));
    const dialog = await screen.findByRole("dialog");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          imagens: [{ data: "img-a-nova", mimeType: "image/png" }],
          solicitadas: 1,
          geradas: 1,
        }),
        { status: 200 }
      )
    );

    fireEvent.click(
      within(dialog).getByRole("button", { name: /gerar novamente/i })
    );

    await waitFor(() =>
      expect(fetch).toHaveBeenLastCalledWith(
        "/api/generate",
        expect.objectContaining({
          body: JSON.stringify({
            prompt: "um dragão em aquarela",
            quantidade: 1,
            proporcao: "9:16",
            estilo: "blackwork",
            imagensReferencia: [],
          }),
        })
      )
    );
  });

  it("gerar novamente reenvia as imagens de referencia usadas na geracao original", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          imagens: [{ data: "img-a", mimeType: "image/png" }],
          solicitadas: 1,
          geradas: 1,
        }),
        { status: 200 }
      )
    );

    render(<Home />);

    anexar("referencia.png");
    await screen.findByAltText(/prévia da imagem anexada 1/i);

    fireEvent.change(
      screen.getByLabelText(/o que você quer mudar ou recriar/i),
      { target: { value: "deixe azul" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /^gerar$/i }));

    fireEvent.click(await screen.findByRole("img", { name: /tatuagem/i }));
    const dialog = await screen.findByRole("dialog");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          imagens: [{ data: "img-a-nova", mimeType: "image/png" }],
          solicitadas: 1,
          geradas: 1,
        }),
        { status: 200 }
      )
    );

    fireEvent.click(
      within(dialog).getByRole("button", { name: /gerar novamente/i })
    );

    await waitFor(() =>
      expect(fetch).toHaveBeenLastCalledWith(
        "/api/generate",
        expect.objectContaining({
          body: JSON.stringify({
            prompt: "deixe azul",
            quantidade: 1,
            proporcao: "9:16",
            estilo: null,
            imagensReferencia: [
              { data: "base64-redimensionado-referencia.png", mimeType: "image/jpeg" },
            ],
          }),
        })
      )
    );
  });

  it("mostra erro dentro do popup sem fechar quando gerar novamente falha", async () => {
    await gerarLoteDeDuas();

    const imagensDoGrid = screen.getAllByRole("img");
    fireEvent.click(imagensDoGrid[0]);

    const dialog = await screen.findByRole("dialog");

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: "Falha ao gerar as imagens. Tente novamente." }),
        { status: 502 }
      )
    );

    fireEvent.click(
      within(dialog).getByRole("button", { name: /gerar novamente/i })
    );

    expect(
      await within(dialog).findByText(/falha ao gerar as imagens/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(within(dialog).getByRole("img")).toHaveAttribute(
      "src",
      "data:image/png;base64,img-a"
    );
  });

  it("fecha o popup ao apertar Esc", async () => {
    await gerarLoteDeDuas();

    fireEvent.click(screen.getAllByRole("img")[0]);
    await screen.findByRole("dialog");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
