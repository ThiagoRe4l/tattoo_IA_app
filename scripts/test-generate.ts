import "./env";

const BASE_URL = process.env.TEST_GENERATE_BASE_URL ?? "http://localhost:3000";
const PROMPT_PADRAO = "uma tatuagem de rosa no estilo blackwork";
const QUANTIDADE_PADRAO = 1;

async function main() {
  const [codigo, prompt = PROMPT_PADRAO, quantidadeArg] = process.argv.slice(2);

  if (!codigo) {
    console.error(
      "Uso: npx tsx scripts/test-generate.ts <codigo> [prompt] [quantidade]"
    );
    process.exit(1);
  }

  const quantidade = quantidadeArg ? Number(quantidadeArg) : QUANTIDADE_PADRAO;

  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo }),
  });

  if (!loginResponse.ok) {
    console.error(`Login falhou: ${loginResponse.status} ${await loginResponse.text()}`);
    process.exit(1);
  }

  const setCookie = loginResponse.headers.get("set-cookie");

  if (!setCookie) {
    console.error("Login não retornou cookie de sessão.");
    process.exit(1);
  }

  const cookie = setCookie.split(";")[0];

  const generateResponse = await fetch(`${BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ prompt, quantidade }),
  });

  const body = await generateResponse.json();

  console.log({
    status: generateResponse.status,
    solicitadas: body.solicitadas,
    geradas: body.geradas,
    erro: body.error,
    temImagem: Boolean(body.imagens?.[0]?.data),
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
