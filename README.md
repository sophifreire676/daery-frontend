## Descrição do Projeto

O **Daery** é uma plataforma de vigilância epidemiológica que tem como objetivo monitorar, organizar e visualizar dados de saúde pública em tempo real, auxiliando na identificação de surtos e no apoio à tomada de decisão.

Este repositório contém o **frontend da aplicação**, responsável pela interface do usuário, navegação e experiência visual do sistema.

## Objetivo do Frontend

O frontend foi desenvolvido com foco em:

- Visualização clara de dados epidemiológicos
- Experiência diferenciada por perfil de usuário
- Interface moderna e responsiva
- Simulação de autenticação e controle de acesso
- Preparação para futura integração com backend

## Perfis de Usuário

Os perfis vêm do back-end (campo `role` do usuário):

| Perfil | Como obtém | Home |
|---|---|---|
| Visitante (sem login) | — | Home 1 (mapa geral) |
| `CITIZEN` — população geral | Cadastro "População Geral" | Home 1 com detalhes e alertas da região |
| `HEALTH_PROFESSIONAL` | Cadastro com conselho, registro e UF + aprovação do admin | Home 2 |
| `INSTITUTION` | Cadastro com CNPJ + aprovação do admin | Home 2 |
| `RESEARCHER` / `ADMIN` | Atribuído por um admin | Home 2 |

Profissionais e instituições entram como `CITIZEN` até a aprovação; a Home 1 mostra o aviso
"cadastro em análise". As regras ficam em `src/utils/roles.ts`.

## Funcionalidades Implementadas

- Tela de Login
- Tela de Cadastro
- Tela "Esqueci minha senha"
- Home pública (dados simplificados)
- Home profissional (dados avançados)
- Sistema de rotas protegidas
- Login, cadastro e sessão integrados à API real (JWT)
- Controle de acesso por perfil, alinhado ao back-end
- Geolocalização do usuário
- Mapa epidemiológico com dados reais (`GET /api/epidemiological-data/summary`), em dois modos:
  marcadores (cor pela severidade) e intensidade (área proporcional aos casos). Um marcador por
  município: a cor é a da doença mais grave e o popup lista todas as doenças. Os créditos mostram
  "InfoDengue" só quando há dados dele e avisam quando há dados fictícios de demonstração
- Filtros por período e doença (consultam a API) e por severidade e texto (locais)
- Alertas preventivos públicos (`GET /api/alerts`), ordenados pela proximidade do usuário
- Exportação CSV dos registros exibidos, restrita a `RESEARCHER` e `ADMIN` (RF-005), no padrão do
  Excel em português. Profissionais e instituições veem os mesmos dados na Home 2, mas não exportam
  (regra em `canExportData`, separada do acesso à Home 2)
- Casos reportados no Daery: perfis profissionais veem os números completos; visitantes e cidadãos
  recebem contagens de 1 a 4 omitidas pela API, exibidas como "menos de 5" (e "<5" no CSV)
- Perfil com os dados reais da conta e alteração do nome (`PATCH /api/auth/me`)
- Reportar caso (RF-001) para profissionais de saúde e instituições aprovados (`POST /api/case-notifications`),
  sem dados que identifiquem o paciente; o caso aparece no mapa como "casos reportados no Daery"
- Persistência de sessão (sessionStorage), mantida ao recarregar a página
- Interface responsiva

## Arquitetura do Projeto

A aplicação segue uma organização baseada em separação de responsabilidades:

```bash
src/
 ├── components/    # Componentes reutilizáveis
 ├── context/       # Sessão do usuário (AuthContext)
 ├── hooks/         # Hooks customizados
 ├── pages/         # Telas da aplicação (register/ guarda a lógica testável do cadastro)
 ├── routes/        # Proteção de rotas por sessão e perfil
 ├── services/      # api.ts (cliente HTTP da API) e authStorage.ts (sessão)
 ├── types/         # api.ts: contrato da API do back-end
 ├── utils/         # Perfis, CPF/CNPJ, mensagens de erro
 ├── tests/         # Testes (Vitest)
 ├── App.tsx        # Configuração de rotas
 └── main.tsx       # Entrada da aplicação
````

## Tecnologias Utilizadas

* **React**
* **TypeScript**
* **Vite**
* **Tailwind CSS**
* **React Router DOM**
* **Leaflet (mapas)**
* **Context API**
* **fetch nativo** (com um wrapper em `services/api.ts` que injeta o token e padroniza erros)

As versões em uso (React 18, Tailwind CSS 3, fetch em vez de Axios) diferem da seção 21 do
documento 6.1.3, que cita React 19, Tailwind CSS 4 e Axios. O uso do fetch é a decisão D10
(explicada em `services/api.ts`); as versões de React e Tailwind ainda precisam ser confirmadas pela
equipe. As duas coisas devem entrar na próxima revisão do documento.
* **Vitest** (testes)

## Autenticação

A autenticação usa a API do back-end (`daery-backend`):

1. `POST /api/auth/login` ou `POST /api/auth/register` devolvem `{ token, user }`.
2. O token e o usuário ficam no `sessionStorage` e o token vai em `Authorization: Bearer` em toda requisição.
3. Ao abrir o app, `GET /api/auth/me` revalida a sessão (o perfil pode ter mudado após uma aprovação).
4. Qualquer resposta 401 (token vencido, adulterado ou conta desativada) encerra a sessão.
5. Uma resposta 403 relê a conta (`GET /api/auth/me`): se o admin mudou o perfil, as rotas
   protegidas redirecionam para a Home correta sem precisar sair e entrar de novo.

As permissões da interface (`src/utils/roles.ts`) só decidem o que aparece na tela. Quem autoriza
de fato é o back-end, que valida token e perfil em cada operação protegida.

**Exportação e RF-005.** O CSV é gerado no navegador a partir do resumo do mapa, que é um dado
agregado. A regra "só pesquisador e admin" vale na interface; os números agregados continuam
acessíveis pela API pública, com as contagens pequenas do Daery omitidas para quem não é perfil
profissional.

---

## Como Executar o Projeto

### 1. Clone o repositório

```bash
git clone https://github.com/sophifreire676/daery-frontend.git
```

### 2. Acesse a pasta

```bash
cd daery-frontend
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Configure a URL da API

```bash
cp .env.example .env
```

Por padrão, o front usa `http://localhost:3000/api`. O back-end precisa estar rodando
(veja o README do `daery-backend`) com `CORS_ORIGIN=http://localhost:5173`.

### 5. Execute o projeto

```bash
npm run dev
```

### Testes

```bash
npm test
```

### 6. Acesse no navegador

```bash
http://localhost:5173
```

## Interface

O sistema foi desenvolvido com foco em:

* Design limpo e moderno
* Boa experiência do usuário
* Clareza na apresentação dos dados
* Responsividade

## Status do Projeto

| Etapa      | Status               |
| ---------- | -------------------- |
| Frontend   |  Telas concluídas |
| Backend    |  Fase 02 concluída (B1–B3) |
| Integração |  Concluída: autenticação, mapa, filtros, alertas, exportação e perfil (F1 e F2) |


## Contexto Acadêmico

Projeto desenvolvido como parte do **Projeto Integrador do curso de Engenharia de Software**.


## Autoria

Desenvolvido por:

* **Equipe Daery**

## Observações

* Todas as telas usam a API real; não há mais dados fixos no código
* Severidade = nível de alerta do InfoDengue (1 baixo, 2 médio, 3 alto, 4 crítico); sem nível, "Sem classificação"
* Ainda não disponíveis (a tela avisa): recuperação de senha por e-mail, perfil de saúde, preferências,
  exportação e exclusão dos dados pessoais
* Estrutura preparada para escalabilidade
