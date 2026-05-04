# Arquitetura

## Stack principal

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Firebase Auth
- Firestore
- Vercel Blob para documentos PDF/Excel/CSV
- Vercel

## Bibliotecas recomendadas

- Zod para validação
- React Hook Form para formulários
- TanStack Query para cache e estado assíncrono
- Zustand para estado global simples
- Sentry para monitoramento de erros
- PostHog para analytics
- Resend para e-mails
- Stripe para pagamentos (se necessário)
- Toastify para retorno de ações básicas
- SweetAlert2 para ações complexas que precisam de confirmação

## Estrutura sugerida

```txt
/src
  /app
  /components
    /ui
    /shared
    /features
  /features
  /lib
  /hooks
  /schemas
  /services
  /types
  /stores
  /tests
/firebase
/cypress
/docs
```

## Estrutura inicial implementada

```txt
/src
  /app
    globals.css
    layout.tsx
    page.tsx
    /api
      /provas
        /analyze
          route.ts
        /examples
          route.ts
      /uploads
        route.ts
  /components
    /ui
  /features
    /enade
      analytics.ts
      data.ts
      exam-parser.ts
      preparatory-system.tsx
      project-dashboard.tsx
      types.ts
      upload-parser.ts
  /lib
    /firebase
      auth-service.ts
      client.ts
      firestore-service.ts
    utils.ts
```

## Modelo de domínio inicial

- `CurricularUnit`: unidade curricular do PPC, com semestre, módulo, carga horária, competência ENADE relacionada e indicador de risco.
- `EnadeCompetency`: competência do componente específico da Portaria 169/2026.
- `QuestionMapping`: questão de prova anterior mapeada para objeto de conhecimento, competência ENADE e unidades curriculares.
- `QuestionBankItem`: questão editável pelo gestor, com enunciado, alternativas, gabarito, explicação e flashcard.
- `AssessmentResponse`: resposta importada de planilha, vinculada a turma, aluno e questão.
- `ClassDiagnostic`: diagnóstico calculado por turma com acerto médio, conclusão, risco por questão, competência, UC e estudante.
- `UploadedDocument`: documento recebido por upload e armazenado no Vercel Blob quando configurado.
- `ExamAnalysis`: análise de uma prova PDF importada, com distribuição por alternativa, dispersão, facilidade e insights.
- `ExamQuestionAnalysis`: estatística de uma questão dentro da prova.
- `LearningJourney`: jornada por turma com macros de exploração, flashcards e simulado.
- `PedagogicalAction`: ação pedagógica planejada para reduzir lacunas de aprendizagem.
- `StudentPreparationPlan`: visão individual do estudante com progresso, lacunas, revisões e plano de estudo.

## Papéis

- Gestor: acompanha turmas elegíveis, indicadores do simulado, lacunas por unidade curricular, mapeamento de questões e ações pedagógicas.
- Aluno: acompanha prontidão individual, lacunas prioritárias, questões recomendadas e plano de estudo.

## Regras técnicas

- Preferir Server Components quando possível.
- Usar Client Components apenas quando necessário.
- Separar lógica de UI.
- Validar dados com Zod.
- Nunca acessar Firestore diretamente em componentes complexos.
- Centralizar configuração Firebase em `/src/lib/firebase`.
- Criar services para operações de banco.

## Observações da etapa atual

- A aplicação funciona em modo demonstração sem variáveis de ambiente.
- Quando Firebase estiver configurado, Auth e Firestore são inicializados de forma preguiçosa em `/src/lib/firebase`.
- Quando `BLOB_READ_WRITE_TOKEN` estiver configurado, `/api/uploads` grava documentos no Vercel Blob com acesso privado.
- Planilhas Excel `.xlsx` são lidas no cliente com `read-excel-file`; CSV usa parser local simples. Ambos viram `AssessmentResponse` para cálculo imediato do diagnóstico.
- PDFs no formato “Análise Detalhada da Prova” são processados em rota Node com `pdf-parse`.
- As questões extraídas de PDFs entram como rascunhos no banco de questões. O gabarito deve ser revisado pelo gestor antes de uso em simulado.

## Coleções Firestore previstas

- `uploads`: documentos importados e metadados de Blob.
- `classDiagnostics`: diagnóstico consolidado por turma.
- `questions`: banco de questões editável pelo gestor.
- `journeys`: jornadas publicadas por turma.
- `studentProgress`: progresso do aluno nas macros.
- `examAnalyses`: análises de provas importadas.
