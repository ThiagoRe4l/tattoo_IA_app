# CLAUDE.md

Instruções permanentes pra qualquer sessão de Claude Code neste projeto.
Leia isso antes de qualquer tarefa.

## O projeto

App web pra tatuadores gerarem referências de tatuagem via IA (Google
Gemini) a partir de um prompt de texto. Especificação completa em
`especificacao-tattoo-ai-app.md` — leia lá antes de propor qualquer
mudança de escopo.

## Stack

- Next.js (App Router) + TypeScript
- Postgres via Neon
- Testes: Vitest
- Deploy: Vercel
- IA: Google Gemini (geração de imagem), chamada só em rota de servidor

## Regras não-negociáveis

1. A chave da API do Gemini nunca é referenciada em código que roda no
   navegador. Toda chamada de IA fica numa rota de servidor
   (`app/api/.../route.ts`), nunca num Client Component.
2. Nenhuma imagem gerada é salva em disco, banco ou storage. Ela só existe
   entre a chamada ao Gemini e a resposta pro navegador.
3. Toda geração de imagem grava uma linha em `usage_log` antes de contar
   como sucesso — sem isso não tem controle de custo.
4. Autenticação é por código de acesso de estúdio (tabela `studios`), não
   por conta individual. Não implementar login de usuário sem que isso
   mude na especificação.

## Como trabalhar aqui

- TDD: nenhuma funcionalidade nova sem teste. Bug corrigido sempre vem
  com teste de regressão.
- Antes de implementar qualquer coisa não trivial, descreva o plano
  (arquivos que vai tocar, decisões que vai tomar) e espere aprovação
  antes de escrever código.
- Se houver ambiguidade real na especificação, pare e pergunte — não
  assuma e siga.
- Commits pequenos e descritivos, um por unidade lógica de mudança.
  Nunca um `git add .` genérico.
- `main` só recebe commit com `npm test` e `npm run lint` passando.
  Rode os dois antes de qualquer commit.
- Nunca commitar sem antes mostrar o conteúdo completo dos arquivos
  alterados e receber aprovação explícita. Um resumo do que foi feito
  não substitui a revisão do código real — sempre cola o arquivo
  inteiro, não um diff nem uma descrição.

## Fora de escopo (não implementar sem pedido explícito)

- Histórico ou galeria de imagens geradas
- Editor de imagem com IA
- Gerador de stencil
- Múltiplos temas visuais
- Multi-tenant / marca por estúdio

## Comandos

- `npm run dev` — servidor local
- `npm test` — roda os testes (Vitest)
- `npm run lint` — lint
