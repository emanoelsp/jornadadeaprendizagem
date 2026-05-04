# PRD - Product Requirements Document

## Tipo de projeto

Sistema Web

## Objetivo

Criar um sistema preparatório para o ENADE 2026 do CST em Análise e Desenvolvimento de Sistemas do UniSENAI, apoiando a coordenação e os estudantes na aplicação de simulados, no mapeamento das questões por unidade curricular e competência, na identificação de lacunas de aprendizagem e no acompanhamento de ações pedagógicas ao longo do semestre.

## Público-alvo

- Gestores/coordenadores do curso.
- Docentes envolvidos na preparação ENADE.
- Estudantes elegíveis ao ENADE 2026, especialmente turmas de 3º e 4º semestres indicadas no alinhamento inicial.

## Problema que resolve

O curso precisa organizar uma preparação objetiva para o ENADE 2026. O e-mail de alinhamento solicita apoio para construir um plano de ação com simulado baseado em provas anteriores, mapeamento das questões em relação às unidades curriculares e competências avaliadas, identificação de lacunas e direcionamento de ações pedagógicas. Sem uma visão integrada, a coordenação perde rastreabilidade entre questão, competência, unidade curricular, desempenho dos estudantes e intervenção planejada.

## Funcionalidades principais

- [x] Autenticação por e-mail e senha com Firebase Auth quando configurado
- [x] Dashboard inicial
- [x] Visão do gestor
- [x] Visão do aluno
- [x] Mapeamento inicial de questões, unidades curriculares e competências
- [x] Plano de ações pedagógicas inicial
- [x] Upload de Excel/CSV com respostas de várias turmas
- [x] Upload de PDF/Excel/CSV para Vercel Blob via rota de API
- [x] Upload e análise de PDFs no formato “Análise Detalhada da Prova”
- [x] Estatísticas por prova, questão e alternativa
- [x] Sínteses estratégicas para apoiar a escolha de questões da jornada
- [x] Diagnóstico visual por turma, questão, competência, unidade curricular e aluno
- [x] Criação e edição de questões pelo gestor
- [x] Seleção de questões para jornada de aprendizagem por turma
- [x] Jornada do aluno em três macros: exploração, flashcards e novo simulado
- [x] Persistência preparada para Firestore
- [ ] CRUD completo de simulados persistido no Firestore
- [ ] Cadastro administrativo de estudantes elegíveis
- [ ] Controle de permissões
- [ ] Logs básicos
- [x] Responsividade mobile

## Requisitos funcionais

- RF001: O gestor deve visualizar indicadores consolidados de estudantes elegíveis, desempenho em simulados, lacunas críticas e ações pedagógicas.
- RF002: O gestor deve visualizar o plano de preparação ENADE em etapas: simulado, mapeamento, diagnóstico e intervenção.
- RF003: O gestor deve consultar o mapeamento entre questões, objetos de conhecimento, competências do ENADE e unidades curriculares do curso.
- RF004: O gestor deve identificar unidades curriculares com maior risco a partir do desempenho e da quantidade de questões associadas.
- RF005: O gestor deve acompanhar ações pedagógicas por responsável, prazo, status e competência relacionada.
- RF006: O aluno deve visualizar sua prontidão para o ENADE, desempenho, pontos fortes e lacunas prioritárias.
- RF007: O aluno deve receber um plano de estudo com atividades, duração estimada, prioridade e relação com competências.
- RF008: O aluno deve consultar questões recomendadas para revisão e as unidades curriculares relacionadas.
- RF009: A interface deve permitir alternar entre a visão do gestor e a visão do aluno na versão inicial do produto.
- RF010: O gestor deve conseguir enviar arquivos Excel, CSV ou PDF. Planilhas devem alimentar respostas por turma; PDFs devem ser armazenados como documento de apoio.
- RF011: O sistema deve calcular estatísticas por turma, por questão, por competência, por unidade curricular e por estudante.
- RF012: O gestor deve selecionar questões críticas, editar questões existentes ou criar novas questões.
- RF013: O gestor deve gerar uma jornada de aprendizagem por turma usando as questões selecionadas.
- RF014: O aluno deve se identificar por nome e turma antes de iniciar a jornada.
- RF015: A jornada do aluno deve seguir três macros: Semana 1 exploração guiada das questões críticas, Semana 2 flashcards com memória espaçada, Semana 3 novo simulado preparatório.
- RF016: O sistema deve salvar uploads no Vercel Blob e dados estruturados no Firestore quando as variáveis de ambiente estiverem configuradas.
- RF017: O gestor deve importar PDFs de prova no formato IDEA/SENAI e visualizar distribuição de respostas por alternativa.
- RF018: O sistema deve calcular convergência, dispersão, questão crítica, facilidade e insights por prova.
- RF019: O gestor deve poder transformar questões importadas da prova em rascunhos editáveis no banco de questões.

## Requisitos não funcionais

- Performance boa em produção
- Código seguro
- UI responsiva
- Acessibilidade básica
- Testes automatizados
- Deploy na Vercel

## Critérios de aceite

- O sistema deve funcionar em desktop e mobile.
- O usuário deve conseguir alternar entre visão do gestor e visão do aluno.
- O usuário deve conseguir autenticar por e-mail e senha ou usar modo demonstração quando Firebase não estiver configurado.
- A visão do gestor deve mostrar indicadores, lacunas por unidade curricular, métricas por turma, questões críticas e construtor de jornada.
- A visão do gestor deve permitir upload de planilha/PDF, edição/criação de questão e publicação de jornada por turma.
- A visão do gestor deve permitir analisar provas PDF no formato dos exemplos em `provas/`.
- A visão do gestor deve exibir gráficos de barras por alternativa e ranking de questões estratégicas.
- A visão do aluno deve permitir identificação por nome/turma e execução das três macros da jornada.
- Os dados iniciais devem refletir os requisitos do e-mail: simulado com provas anteriores, mapeamento por unidades curriculares/competências, identificação de lacunas e ações pedagógicas.
- As principais ações devem ter feedback visual.
- O sistema deve continuar utilizável em modo local sem credenciais, mas persistir no Firebase/Vercel Blob quando configurado.
- O build deve passar sem erro.
- Os testes principais devem passar.
