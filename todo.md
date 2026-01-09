# eAI BR? Ops - Project TODO

## Core Features

### Phase 1: Architecture & Database Schema
- [x] Define complete database schema (episodes, sources, curations, scripts, blog posts, editorial calendar)
- [x] Create Drizzle ORM migrations
- [x] Set up tRPC routers structure

### Phase 2: Dashboard & Editorial Calendar
- [x] Build central dashboard with next episode overview
- [x] Implement editorial calendar with biweekly publication dates
- [x] Add Tuesday 7 AM live session highlighting
- [x] Create episode status tracking (planning, curation, scripting, published)
- [x] Display curation progress metrics

### Phase 3: Content Curation System
- [x] Implement RSS/newsletter source collection system
- [x] Create AI-powered pre-curation module (classification by theme, maturity level, practical impact)
- [x] Build human curation interface for final topic selection
- [x] Integrate LLM for content analysis and categorization
- [x] Create source management library with URL and categorization

### Phase 4: Script & Content Generation
- [x] Build podcast script generator with fixed template (Radar Global, Tema Central, Ferramenta da Quinzena, Aplicação Prática)
- [x] Implement blog content generator from podcast scripts
- [x] Create markdown export functionality
- [x] Generate social media microcontents suggestions

### Phase 5: Editorial System
- [x] Implement editorial tags and pillars (Produtividade, Marketing & Vendas, Operações, Tomada de Decisão, Tendências Globais)
- [x] Create editorial pillar management interface
- [x] Build source categorization by pillar

### Phase 6: Testing & Deployment
- [x] Write Vitest unit tests for core procedures
- [x] Test complete workflows (source collection → curation → script generation → publication)
- [x] Prepare Vercel deployment configuration
- [x] Create deployment documentation

### Phase 7: Delivery
- [x] Create user documentation
- [x] Prepare integration guide for eAI BR? admin platform
- [x] Final testing and quality assurance
- [x] Deliver project with instructions

## Non-Functional Requirements
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Performance optimization for large source lists
- [ ] Error handling and user feedback
- [ ] Loading states and skeleton screens
- [ ] Accessibility compliance


## RSS Integration Features

### Phase 1: RSS Parser & Feed Collection
- [x] Implement RSS parser with error handling
- [x] Create feed fetching service for 3 regions (USA, China, Brazil)
- [x] Add deduplication logic to prevent duplicate content
- [x] Implement feed caching with TTL

### Phase 2: Background Jobs & Sync
- [x] Set up job queue system (node-cron)
- [x] Create recurring sync job (every 30 minutes)
- [x] Implement exponential backoff for failed feeds
- [x] Add feed health monitoring

### Phase 3: Notifications & Webhooks
- [x] Implement webhook system for new content alerts
- [x] Create notification service integration
- [x] Add real-time updates via WebSocket/SSE
- [x] Create admin notification preferences

### Phase 4: Testing & Validation
- [x] Write integration tests for RSS parser
- [x] Test background job execution
- [x] Validate notification delivery
- [x] Performance testing with large feed lists
