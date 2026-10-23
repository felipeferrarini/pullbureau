# Pullbureau

Uma repartição 3D para acompanhar a fila de pull requests da sua organização no GitHub. Repositórios viram guichês, PRs viram senhas e revisores dão vida à sala. Feito com Next.js, React Three Fiber, Three.js, Auth.js e Zustand.

![Cena demo do Pullbureau](public/screenshots/pt-BR-scene.png)

[English](README.md) · [Como contribuir](CONTRIBUTING.md) · [Vocabulário](GLOSSARY.md)

## Demonstração sem credenciais

Use Node.js 22 ou superior e a versão de pnpm indicada em `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm demo
```

Abra [localhost:3000](http://localhost:3000). A demonstração usa dados fictícios e dispensa credenciais do GitHub. O navegador precisa de WebGL. O som depende de uma interação inicial com a página.

## Conectar sua organização

Copie `.env.example` para `.env.local`. Configure `GITHUB_ORG`, `GITHUB_TOKEN`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` e `AUTH_URL`. Crie um OAuth App no GitHub com callback `http://localhost:3000/api/auth/callback/github`; em produção, troque a origem pela URL publicada. O login pede `read:user` e o servidor verifica a participação na organização.

Para um token clássico, use `read:org` e `repo` para repositórios privados, incluindo acesso aos workflow runs. Para token refinado, selecione a organização e os repositórios e conceda leitura de Members, Pull requests, Contents, Actions e metadados. Confira também a aprovação da organização e SSO. Veja a [documentação completa de configuração e permissões](README.md#connect-an-organization).

Personalização: `LOCALE=pt-BR`, `TIME_ZONE=America/Sao_Paulo`, `BUSINESS_START_HOUR=9`, `BUSINESS_END_HOUR=18`, `READY_LABEL=ready-for-review` e `ORG_DISPLAY_NAME`. O nome da organização usa `GITHUB_ORG` como alternativa. `CTO_LOGIN` é opcional. `IGNORED_LOGINS`, `EXCLUDED_LOGINS` e `CHARACTER_OVERRIDES` controlam pessoas e personagens. `DEMO_MODE=1` ativa os dados fictícios.

```sh
pnpm dev
# Produção com credenciais configuradas:
pnpm build
pnpm start
```

## Deploy

Cada deploy atende uma organização e mantém o acesso restrito aos membros dela. Na Vercel, importe seu próprio repositório com o preset Next.js, configure as cinco variáveis obrigatórias, `AUTH_URL` com a origem HTTPS e o callback `/api/auth/callback/github` no OAuth App. Em um host Node genérico, configure o mesmo ambiente, execute `pnpm build` e `pnpm start --hostname 0.0.0.0`, com um proxy HTTPS na frente. Mantenha `E2E_BYPASS_AUTH` desativado. Nenhum serviço AWS é necessário.

Idioma, fuso, horário comercial, label, nome exibido e `DEMO_MODE` são configurações públicas definidas durante o build; gere outro build ao alterá-las. Para hospedar somente a demo, use `DEMO_MODE=1` tanto no build quanto na inicialização. A demo não libera APIs com dados reais. O horário de conclusão do CI vem da API REST de Actions, sem depender de Check Runs com o token refinado usado pelo projeto. A tabela completa de variáveis está no [README em inglês](README.md#connect-an-organization).

## Desenvolvimento

```sh
pnpm lint
pnpm tsc --noEmit
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm e2e
```

A CI usa dados fictícios, sem credenciais reais. O E2E usa servidor de desenvolvimento e autenticação local de teste; produção nunca deve aceitar esse desvio. Não publique gravações de organizações reais, tokens ou arquivos de ambiente.

`?replay=demo` abre o replay fictício; `speed=2` altera a velocidade, `intro=0` pula a entrada e `egg=caramelo,sexta` dispara eventos de cena. A [lista de parâmetros](README.md#controls-and-diagnostic-urls) inclui as opções de diagnóstico.

## Licença

Código sob [MIT](LICENSE), copyright 2026 Felipe Ferrarini. O pacote permanece privado para evitar publicação acidental no npm. Modelos e HDRIs usam CC0; a fonte Inter usa OFL-1.1. Consulte os [créditos dos recursos](public/CREDITS.md) e a [auditoria de dependências](docs/licenses/README.md). Os sons são sintetizados no navegador.

PRs que não são rascunhos e possuem `READY_LABEL` entram na fila do guichê; rascunhos e PRs sem esse label ficam na sala de espera. O padrão é `ready-for-review`.
