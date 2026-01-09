# eAI BR? Ops - Documentação Completa

## Visão Geral

O **eAI BR? Ops** é um SaaS de gestão operacional para produção de podcasts, focado em automação de curadoria, roteirização e publicação de conteúdo. O sistema foi desenvolvido para o projeto **eAI BR?** - um radar quinzenal de Inteligência Artificial aplicada aos negócios reais.

## Arquitetura Técnica

### Stack Tecnológico

- **Frontend:** React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend:** Express 4 + tRPC 11 + Node.js
- **Banco de Dados:** MySQL/TiDB (Drizzle ORM)
- **Autenticação:** Manus OAuth
- **IA/LLM:** Integração com Claude/GPT via Manus Forge API
- **Deployment:** Vercel

### Estrutura do Projeto

```
eaibr-saas-ops/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas principais
│   │   │   ├── Dashboard.tsx  # Visão geral e calendário
│   │   │   ├── Curation.tsx   # Interface de curadoria
│   │   │   └── ScriptGeneration.tsx  # Gerador de roteiros
│   │   ├── components/       # Componentes reutilizáveis
│   │   └── lib/trpc.ts       # Cliente tRPC
│   └── public/               # Ativos estáticos
├── server/                    # Backend Node.js
│   ├── routers.ts            # Procedimentos tRPC
│   ├── db.ts                 # Helpers de banco de dados
│   └── _core/                # Infraestrutura interna
├── drizzle/                   # Schema e migrações
│   └── schema.ts             # Definição de tabelas
└── shared/                    # Código compartilhado
```

## Modelo de Dados

### Tabelas Principais

**Episodes (Episódios)**
- Armazena informações de cada episódio do podcast
- Rastreia status (planning, curation, scripting, review, published)
- Monitora progresso da curadoria (0-100%)
- Agendado para terças-feiras às 7h AM

**ContentSources (Fontes de Conteúdo)**
- RSS feeds, newsletters, websites e redes sociais
- Categorizado por região (Brasil, EUA, China, Global)
- Vinculado a pilares editoriais
- Rastreamento de última coleta

**ContentItems (Itens de Conteúdo)**
- Artigos, notícias e conteúdo coletado das fontes
- Armazenado com URL, título, descrição e conteúdo completo
- Timestamp de coleta para rastreamento

**PreCurationAnalysis (Análise de Pré-Curadoria)**
- Classificação automática por IA
- Tema, nível de maturidade, impacto prático
- Score de relevância (0-1)
- Resumo em português

**EpisodeCurations (Curações de Episódio)**
- Vincula itens de conteúdo aos episódios
- Organiza por seção (Radar Global, Tema Central, Ferramenta, Aplicação)
- Permite notas editoriais

**PodcastScripts (Roteiros de Podcast)**
- Armazena as 4 seções do template fixo
- Roteiro completo em markdown
- Duração estimada em minutos

**BlogPosts (Posts de Blog)**
- Conteúdo do blog gerado a partir do roteiro
- Status (draft, published, archived)
- Slug para URLs amigáveis

**SocialMicrocontents (Conteúdo para Redes Sociais)**
- Posts otimizados para cada plataforma
- Twitter, LinkedIn, Instagram, TikTok
- Hashtags sugeridas

**EditorialPillars (Pilares Editoriais)**
- Produtividade
- Marketing & Vendas
- Operações & Processos
- Tomada de Decisão
- Tendências Globais

## Fluxo de Trabalho Principal

### 1. Coleta de Conteúdo

O sistema monitora fontes RSS/newsletters configuradas e coleta conteúdo automaticamente. Cada item é armazenado com metadados completos.

**Procedimento:** `content.getRecent`

### 2. Pré-Curadoria com IA

Cada item de conteúdo é analisado automaticamente pela IA para:
- Classificação por tema
- Determinação do nível de maturidade
- Avaliação de impacto prático
- Cálculo de score de relevância

**Procedimento:** `content.analyzeWithAI`

### 3. Curadoria Humana

O curador seleciona manualmente os itens mais relevantes e os organiza nas 4 seções do podcast:
- **Radar Global** (5 min): 3 insights-chave (1 EUA, 1 China, 1 Brasil)
- **Tema Central** (10-15 min): Um problema real e como IA está sendo usada
- **Ferramenta da Quinzena** (5 min): 1 ferramenta, 1 caso, 1 limitação
- **Aplicação Prática** (5 min): "Se você é [profissão X], faça isso"

**Procedimento:** `curation.addToEpisode`

### 4. Geração de Roteiro

A IA gera um roteiro completo em markdown baseado nos itens curados, respeitando o template fixo de 4 seções.

**Procedimento:** `scripts.generate`

### 5. Geração de Conteúdo Derivado

A partir do roteiro, o sistema gera automaticamente:
- **Blog Post:** Artigo estruturado para o site
- **Social Media:** Posts otimizados para 4 plataformas

**Procedimentos:** `blog.generate`, `social.generateMicrocontents`

## Procedimentos tRPC Disponíveis

### Dashboard

```typescript
// Obter visão geral do dashboard
trpc.dashboard.getOverview.useQuery()
```

Retorna: `{ upcomingEpisode, recentEpisodes, totalSources, totalPillars }`

### Episodes

```typescript
// Próximo episódio agendado
trpc.episodes.getUpcoming.useQuery()

// Todos os episódios
trpc.episodes.getAll.useQuery({ limit: 50, offset: 0 })

// Episódio específico
trpc.episodes.getById.useQuery({ id: 1 })

// Criar novo episódio
trpc.episodes.create.useMutation()

// Atualizar status
trpc.episodes.updateStatus.useMutation()
```

### Content Sources

```typescript
// Todas as fontes ativas
trpc.sources.getAll.useQuery()

// Fontes por região
trpc.sources.getByRegion.useQuery({ region: "brasil" })

// Criar nova fonte
trpc.sources.create.useMutation()
```

### Content & Curation

```typescript
// Conteúdo recente
trpc.content.getRecent.useQuery({ limit: 100 })

// Analisar com IA
trpc.content.analyzeWithAI.useMutation()

// Curações do episódio
trpc.curation.getByEpisode.useQuery({ episodeId: 1 })

// Adicionar à curadoria
trpc.curation.addToEpisode.useMutation()
```

### Scripts & Content Generation

```typescript
// Obter roteiro
trpc.scripts.getByEpisode.useQuery({ episodeId: 1 })

// Gerar roteiro
trpc.scripts.generate.useMutation()

// Obter blog post
trpc.blog.getByEpisode.useQuery({ episodeId: 1 })

// Gerar blog
trpc.blog.generate.useMutation()

// Obter conteúdo social
trpc.social.getByEpisode.useQuery({ episodeId: 1 })

// Gerar conteúdo social
trpc.social.generateMicrocontents.useMutation()
```

### Editorial Pillars

```typescript
// Todos os pilares
trpc.pillars.getAll.useQuery()

// Criar pilar
trpc.pillars.create.useMutation()
```

## Configuração e Deployment

### Variáveis de Ambiente

O projeto utiliza as seguintes variáveis de ambiente (injetadas automaticamente):

- `DATABASE_URL`: Conexão MySQL/TiDB
- `JWT_SECRET`: Chave de assinatura de sessão
- `VITE_APP_ID`: ID da aplicação OAuth
- `OAUTH_SERVER_URL`: URL do servidor OAuth
- `BUILT_IN_FORGE_API_URL`: URL da API Manus
- `BUILT_IN_FORGE_API_KEY`: Chave da API Manus

### Deploy na Vercel

1. Criar repositório Git
2. Conectar ao Vercel
3. Configurar variáveis de ambiente
4. Deploy automático em push para main

```bash
# Build local
pnpm build

# Start production
pnpm start
```

## Integração com eAI BR? Admin

O SaaS foi projetado para integração futura com a plataforma administrativa do eAI BR?. Os pontos de integração incluem:

1. **Autenticação:** Usa OAuth Manus (compatível com admin)
2. **API:** Todos os endpoints tRPC são públicos para integração
3. **Banco de Dados:** Compartilhado com a plataforma principal
4. **Conteúdo:** Publicação automática de roteiros e blog posts

### Exemplo de Integração

```typescript
// No admin, importar o cliente tRPC
import { trpc } from '@eaibr-admin/lib/trpc';

// Usar procedimentos do Ops
const { data: upcomingEpisode } = trpc.episodes.getUpcoming.useQuery();

// Gerar roteiro
await trpc.scripts.generate.mutateAsync({
  episodeId: upcomingEpisode.id,
  curations: [...],
});
```

## Calendário Editorial

O sistema gera automaticamente um calendário com:
- **Terças-feiras às 7h AM:** Lives agendadas
- **Formato quinzenal:** Episódios a cada 2 semanas
- **Rastreamento visual:** Próximas 8 semanas visíveis

## Testes

Todos os procedimentos principais possuem testes unitários:

```bash
# Executar testes
pnpm test

# Resultados esperados
# ✓ server/auth.logout.test.ts (1 test)
# ✓ server/episodes.test.ts (11 tests)
# Test Files: 2 passed
# Tests: 12 passed
```

## Próximos Passos

1. **Integração com RSS:** Configurar coleta automática de feeds
2. **Webhooks:** Notificações quando novo conteúdo é coletado
3. **Analytics:** Rastreamento de performance de episódios
4. **Agendamento:** Publicação automática em horários específicos
5. **Colaboração:** Interface multi-usuário para curadores

## Suporte e Troubleshooting

### Erro: "Database not available"

Verificar se `DATABASE_URL` está configurada corretamente.

### Erro: "Failed to analyze content with AI"

Verificar se `BUILT_IN_FORGE_API_KEY` está válida.

### Servidor não inicia

```bash
# Limpar cache
rm -rf .turbo node_modules/.vite

# Reinstalar
pnpm install

# Restart
pnpm dev
```

## Contato e Feedback

Para dúvidas ou sugestões sobre o eAI BR? Ops, entre em contato com a equipe de desenvolvimento.
