# App de geração de tatuagens com IA — Especificação v0.1

## O quê

Uma ferramenta web pra tatuadores e estúdios gerarem referências visuais de
tatuagem a partir de uma descrição em texto, usando IA. O tatuador escreve o
que quer, a ferramenta gera as imagens, ele baixa a que gostar. Sem instalar
nada, sem curva de aprendizado.

## Por quê

- O AIMASTER TOOL (referência que motivou esse projeto) expõe a chave de API
  no navegador, usa um esquema de licença por tempo com relógio de servidor
  externo, e empilha features (stencil, editor, temas) que a maioria dos
  estúdios nunca usa.
- Baixa manutenção é requisito de produto, não só técnico: quanto menos
  estado o servidor precisa guardar e cuidar, menos coisa quebra com o tempo.
- Distribuição inicial: estúdios de tatuagem que já são clientes do Gustavo
  (Jotadablio Tattoo, Minas Tattoo, NA PELE 67).

## Fluxo principal (v1)

1. Usuário (tatuador) acessa o app autenticado.
2. Escreve um prompt de texto descrevendo a tatuagem desejada.
3. Clica em gerar → o servidor chama o Gemini → retorna 1 a 4 imagens.
4. As imagens aparecem na tela. O usuário baixa direto pro dispositivo as
   que gostar.
5. O servidor não guarda nenhuma imagem depois de responder — só registra
   que aquele usuário consumiu 1 geração (controle de uso/custo).

## Fora de escopo pra v1 (de propósito)

- Sem histórico ou galeria persistente de imagens
- Sem editor de imagem com IA
- Sem gerador de stencil
- Sem seleção de partes do corpo ou múltiplos temas visuais
- Sem multi-tenant / marca por estúdio — todo mundo usa a mesma interface

## Restrições técnicas (não negociáveis)

- A chave da API do Gemini nunca fica acessível no navegador — toda chamada
  de IA acontece numa rota de servidor autenticada.
- Existe um controle mínimo de uso/créditos por usuário, guardado no banco,
  pra impedir custo descontrolado — mesmo sem guardar as imagens geradas.
- Nenhuma imagem gerada é persistida no servidor além do tempo necessário
  pra devolver a resposta ao navegador.

## Stack decidida

- Next.js (App Router) + TypeScript
- Postgres via Neon — só usuários e uso/créditos, nada de imagem
- Deploy: Vercel
- Geração de imagem: Google Gemini, chamada só em rota de servidor
- Autenticação: código de acesso único por estúdio (sem contas individuais)

## Modelo de dados (mínimo)

- `studios`: id, nome, hash do código de acesso, criado_em
- `usage_log`: id, studio_id, criado_em — uma linha por geração, sem
  imagem nenhuma. Contar uso é uma query de `COUNT` com filtro de data.

Sessão do estúdio após validar o código: cookie assinado, sem tabela de
sessão própria.

## Critério de "pronto" pra v1

Um tatuador consegue: logar → escrever um prompt → gerar imagens → baixar a
que quiser. Sem erro, sem custo fora de controle, sem estado guardado além
do necessário pro controle de créditos.
