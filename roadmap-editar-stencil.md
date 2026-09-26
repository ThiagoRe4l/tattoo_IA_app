# Roadmap — Editar e Stencil (planejamento, não implementar ainda)

Este documento existe pra guardar a direção técnica pensada pra essas
duas features, sem comprometer nada agora. Quando alguma delas virar
tarefa de verdade, segue o mesmo processo de sempre: o quê/por quê,
plano revisado antes do código, arquivos completos antes do commit.

## Editar

**O quê:** pedir um ajuste pontual numa imagem já gerada (ex: "tira a
sombra do canto", "deixa o traço mais grosso") sem regenerar do zero.

**Como a API já suporta isso:** a Interactions API do Gemini (a mesma
que já usamos) tem edição conversacional nativa — passando o id de uma
interação anterior numa chamada nova, o modelo edita a imagem existente
preservando o contexto visual, em vez de gerar do zero. Isso já é
capacidade documentada da API, não precisa de biblioteca nova.

**O que falta decidir quando chegar a vez:**
- Guardar o id da interação (só o id, texto pequeno — não a imagem) em
  memória no navegador durante a sessão, junto do prompt/proporção que
  já vamos guardar pro popup. Sem persistir nada no servidor, mesmo
  princípio de hoje.
- UI: um campo de texto simples dentro do popup, tipo "o que ajustar".
- Cada edição consome 1 unidade de cota (é uma chamada nova ao Gemini).

## Stencil

**O quê:** converter uma imagem gerada num contorno preto e branco
pronto pra decalque — o que o tatuador de fato usa na hora de tatuar.

**Duas abordagens possíveis:**

1. **Processamento de imagem local, direto no navegador (Canvas API):**
   detecção de bordas/contorno, sem chamar o Gemini de novo. Grátis,
   instantâneo, não gasta cota. É uma tarefa técnica/geométrica, não
   criativa — provavelmente não precisa de IA nenhuma.
2. **Pedir pro Gemini transformar a imagem existente** ("stencil,
   contorno preto, sem preenchimento") via a mesma edição conversacional
   do item "Editar" acima. Mais caro, menos previsível, mas pode
   capturar nuance que um algoritmo de borda simples perde.

**Recomendação inicial:** começar pela opção 1 (client-side, sem custo).
Só vale considerar a opção 2 se a qualidade do contorno automático não
for suficiente na prática — e isso só se sabe testando de verdade.
