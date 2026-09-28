// Stub vazio pro pacote "server-only" durante os testes (Vitest).
//
// "server-only" lança erro em qualquer resolução via condição de export
// padrão do Node — só fica em silêncio sob a condição "react-server", que
// somente o bundler RSC do Next.js define. Como o Vitest resolve módulos
// como Node puro, o import quebraria os testes sem este stub. Ver alias
// em vitest.config.ts.
export {};
