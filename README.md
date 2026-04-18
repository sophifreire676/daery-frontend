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

O sistema foi projetado para dois perfis principais:

### População Geral
- Acesso ao mapa epidemiológico simplificado
- Visualização de dados básicos
- Alertas informativos

### Pesquisador / Profissional de Saúde
- Acesso a dados detalhados
- Filtros avançados
- Exportação de dados (CSV)
- Visualização analítica

## Funcionalidades Implementadas

- Tela de Login
- Tela de Cadastro
- Tela "Esqueci minha senha"
- Home pública (dados simplificados)
- Home profissional (dados avançados)
- Sistema de rotas protegidas
- Controle de acesso por perfil (RBAC simulado)
- Geolocalização do usuário
- Mapa epidemiológico interativo
- Exportação de dados (CSV)
- Persistência de sessão (sessionStorage)
- Interface responsiva

## Arquitetura do Projeto

A aplicação segue uma organização baseada em separação de responsabilidades:

```bash
src/
 ├── assets/        # Imagens e arquivos estáticos
 ├── components/    # Componentes reutilizáveis
 ├── context/       # Gerenciamento de estado global (Auth)
 ├── hooks/         # Hooks customizados
 ├── pages/         # Telas da aplicação
 ├── routes/        # Proteção e controle de rotas
 ├── services/      # Comunicação com API (mock)
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

## Autenticação (Modo Mock)

Nesta fase do projeto, a autenticação é simulada.

### Regra de identificação:

* Emails contendo:

  * `pesquisador`
  * `researcher`
  * `medic`
  * `dr.`

São tratados como **Pesquisador**

* Qualquer outro email:
 É tratado como **Usuário Público**

---

## Como Executar o Projeto

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/daery-frontend.git
```

### 2. Acesse a pasta

```bash
cd daery-frontend
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Execute o projeto

```bash
npm run dev
```

### 5. Acesse no navegador

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
| Frontend   |  Concluído          |
| Backend    |  Em desenvolvimento |
| Integração |  Pendente           |


## Contexto Acadêmico

Projeto desenvolvido como parte do **Projeto Integrador do curso de Engenharia de Software**.


## Autoria

Desenvolvido por:

* **Equipe Daery**

## Observações

* O projeto atualmente utiliza dados simulados (mock)
* A integração com backend será implementada nas próximas fases
* Estrutura preparada para escalabilidade


## Próximos Passos

* Integração com API backend
* Autenticação real com JWT
* Persistência em banco de dados
* Sistema real de notificações
* Melhoria na performance e otimizações


## Considerações Finais

O frontend do Daery demonstra a viabilidade da arquitetura proposta e valida a experiência do usuário antes da implementação completa do backend, garantindo uma base sólida para evolução do sistema.
