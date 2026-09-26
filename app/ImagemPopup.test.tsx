// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ImagemPopup from "./ImagemPopup";

afterEach(() => {
  cleanup();
});

function renderPopup(overrides: Partial<Parameters<typeof ImagemPopup>[0]> = {}) {
  const onClose = vi.fn();
  const onRegenerar = vi.fn();

  render(
    <ImagemPopup
      imagem={{
        data: "base64fake",
        mimeType: "image/png",
        prompt: "um dragão em aquarela",
        proporcao: "9:16",
      }}
      indice={0}
      carregando={false}
      erro={null}
      onClose={onClose}
      onRegenerar={onRegenerar}
      {...overrides}
    />
  );

  return { onClose, onRegenerar };
}

describe("ImagemPopup", () => {
  it("mostra a imagem, o prompt e o link de download", () => {
    renderPopup();

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "data:image/png;base64,base64fake"
    );
    expect(screen.getByText("um dragão em aquarela")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /baixar/i })).toHaveAttribute(
      "href",
      "data:image/png;base64,base64fake"
    );
  });

  it("fecha ao apertar Esc", () => {
    const { onClose } = renderPopup();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("fecha ao clicar fora do conteudo (no overlay)", () => {
    const { onClose } = renderPopup();

    fireEvent.click(screen.getByRole("dialog"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("nao fecha ao clicar dentro do conteudo (na imagem)", () => {
    const { onClose } = renderPopup();

    fireEvent.click(screen.getByRole("img"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("fecha ao clicar no botao de fechar (X)", () => {
    const { onClose } = renderPopup();

    fireEvent.click(screen.getByRole("button", { name: /fechar/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("chama onRegenerar ao clicar em Gerar novamente", () => {
    const { onRegenerar } = renderPopup();

    fireEvent.click(screen.getByRole("button", { name: /gerar novamente/i }));

    expect(onRegenerar).toHaveBeenCalledTimes(1);
  });

  it("mostra estado de carregando e desabilita o botao de regenerar", () => {
    renderPopup({ carregando: true });

    const botao = screen.getByRole("button", { name: /gerando/i });
    expect(botao).toBeDisabled();
  });

  it("mostra a mensagem de erro sem fechar o popup", () => {
    renderPopup({ erro: "Falha ao gerar as imagens. Tente novamente." });

    expect(
      screen.getByText(/falha ao gerar as imagens/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
