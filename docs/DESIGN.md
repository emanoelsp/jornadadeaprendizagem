# Design System

## Estilo visual

- Interface moderna
- Limpa
- Responsiva
- Minimalista
- Boa hierarquia visual
- Espaçamento consistente

## UI stack

- Tailwind CSS
- shadcn/ui
- lucide-react para ícones

## Regras de UI

- Usar shadcn/ui como base.
- Evitar criar componentes do zero se existir equivalente no shadcn/ui.
- Componentes devem ser acessíveis.
- Layout mobile-first.
- Usar cards, tabs, dialogs e forms de forma consistente.
- Estados obrigatórios:
  - loading
  - empty
  - error
  - success

## Padrão visual

- Bordas arredondadas
- Sombras leves
- Espaçamento generoso
- Tipografia clara
- Botões com feedback visual
- Formulários simples

## Direção visual do Preparatório ENADE

- Interface operacional, voltada a leitura rápida de indicadores e tomada de decisão pedagógica.
- Paleta neutra com acentos em verde, azul, amarelo e vermelho para diferenciar progresso, informação, atenção e risco.
- Cards usados para itens repetidos como indicadores, unidades curriculares, ações e atividades do aluno.
- Layout responsivo com navegação por visão: Gestor e Aluno.
- Tabelas e listas devem priorizar escaneabilidade, status visível e relação clara entre questão, competência e unidade curricular.

## Componentes da primeira entrega

- Seletor segmentado para alternar entre visão do gestor e visão do aluno.
- Indicadores resumidos com ícones.
- Barras de progresso para desempenho e prontidão.
- Badges para risco, status, prioridade e competência.
- Listas de ações pedagógicas e plano de estudo.

## Fluxos visuais novos

- Login com escolha de papel Gestor/Aluno.
- Gestor com cards densos de métricas, upload em área pontilhada, abas de Diagnóstico, Questões e Jornada.
- Diagnóstico por turma com barras de acerto, badges de risco, impacto, erro e tentativas.
- Construtor de jornada com seleção explícita de questões e preview das três macros.
- Aluno em experiência de aprendizagem progressiva, inspirada em trilhas semanais: exploração guiada, flashcards e simulado final.
