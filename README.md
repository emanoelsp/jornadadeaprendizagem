# Preparatório ENADE 2026 - ADS

Sistema web para apoiar a preparação dos estudantes do CST em Análise e Desenvolvimento de Sistemas do UniSENAI Blumenau para o ENADE 2026.

O projeto nasce a partir do e-mail de requisito sobre construção de um plano de ação com simulado baseado em provas anteriores, mapeamento de questões por unidades curriculares e competências, identificação de lacunas de aprendizagem e direcionamento de ações pedagógicas.

## Fluxo principal

- Gestor faz login, importa Excel/CSV/PDF, visualiza diagnóstico por turma e por questão.
- Gestor importa PDFs de “Análise Detalhada da Prova” e visualiza estatísticas por prova, questão e alternativa.
- Gestor seleciona, edita ou cria questões e publica uma jornada de aprendizagem por turma.
- Aluno faz login, informa nome/turma e percorre três macros: exploração guiada, flashcards com memória espaçada e novo simulado.

## 📁 Estrutura

```
docs/
  PRD.md          → Requisitos do produto
  ARCHITECTURE.md → Stack e arquitetura
  AGENTS.md       → Regras do agente de IA
  TASKS.md        → Backlog e progresso
  TESTING.md      → Estratégia de testes
  DESIGN.md       → Design system e UI
  AI_AGENT.md     → Arquitetura de agentes IA (opcional)
  DEPLOY.md       → Checklist de deploy
src/
  app/             → App Router do Next.js
  components/ui/   → Componentes de UI
  features/enade/  → Dados e visão Gestor/Aluno
```

## ▶️ Rodando localmente

```bash
npm install
npm run dev
```

## ✅ Verificação

```bash
npm run lint
npm test
npm run build
```

## 🔑 Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

## 📌 Stack padrão

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js + TypeScript |
| Estilo | Tailwind CSS + shadcn/ui |
| Auth | Firebase Auth |
| Banco | Firestore |
| Documentos | Vercel Blob |
| Deploy | Vercel |
| Testes | Jest + RTL + Cypress |
