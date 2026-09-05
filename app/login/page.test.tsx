// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import LoginPage from "./page";

beforeEach(() => {
  pushMock.mockClear();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
});

function preencherESubmeter(codigo: string) {
  fireEvent.change(screen.getByLabelText(/código de acesso/i), {
    target: { value: codigo },
  });
  fireEvent.click(screen.getByRole("button", { name: /entrar/i }));
}

describe("LoginPage", () => {
  it("envia o codigo pra /api/auth/login e redireciona pra / em caso de sucesso", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ nome: "Jotadablio Tattoo" }), { status: 200 })
    );

    render(<LoginPage />);
    preencherESubmeter("codigo-certo");

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/"));

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ codigo: "codigo-certo" }),
      })
    );
  });

  it("mostra erro e nao redireciona quando o codigo e invalido", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Código inválido" }), { status: 401 })
    );

    render(<LoginPage />);
    preencherESubmeter("codigo-errado");

    expect(await screen.findByText(/código inválido/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
