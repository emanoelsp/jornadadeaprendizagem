import type {
  CurricularUnit,
  EnadeCompetency,
  PedagogicalAction,
  QuestionBankItem,
  QuestionMapping,
} from "./types";

// Competências ENADE - dados oficiais da portaria
export const enadeCompetencies: EnadeCompetency[] = [
  {
    id: "C1",
    title: "Análise, requisitos e ciclo de vida",
    description:
      "Analisar contextos e regras de negócio, aplicar processos de software e estruturar soluções com qualidade.",
    abilities: [
      "Analisar tabelas, gráficos e diagramas",
      "Compreender processos e ciclo de vida de sistemas",
      "Aplicar modelagem, requisitos, projetos e qualidade",
    ],
  },
  {
    id: "C2",
    title: "Arquitetura, implementação, dados e segurança",
    description:
      "Arquitetar e implementar software com métodos, ferramentas, qualidade, dados e segurança.",
    abilities: [
      "Implementar programas de computador",
      "Gerenciar dados e estruturas de dados",
      "Aplicar arquitetura, programação, qualidade e segurança",
    ],
  },
];

// Unidades curriculares do PPC
export const curricularUnits: CurricularUnit[] = [
  {
    code: "AMS",
    name: "Arquitetura e Modelagem de Sistemas",
    semester: 3,
    module: "Específico I",
    workload: 108,
    competencyId: "C1",
  },
  {
    code: "EDA",
    name: "Estruturas de Dados",
    semester: 3,
    module: "Específico I",
    workload: 72,
    competencyId: "C2",
  },
  {
    code: "DWE",
    name: "Desenvolvimento Web",
    semester: 3,
    module: "Específico I",
    workload: 72,
    competencyId: "C2",
  },
  {
    code: "IHC",
    name: "Interface Humano-Computador",
    semester: 3,
    module: "Específico I",
    workload: 36,
    competencyId: "C1",
  },
  {
    code: "TRL",
    name: "Tecnologia de Redes Locais",
    semester: 3,
    module: "Específico I",
    workload: 72,
    competencyId: "C2",
  },
  {
    code: "CNU",
    name: "Computação em Nuvem",
    semester: 4,
    module: "Específico II",
    workload: 72,
    competencyId: "C2",
  },
  {
    code: "DSW",
    name: "Desenvolvimento de Sistemas Web",
    semester: 4,
    module: "Específico II",
    workload: 72,
    competencyId: "C2",
  },
  {
    code: "DSD",
    name: "Desenvolvimento de Sistemas Distribuídos",
    semester: 4,
    module: "Específico II",
    workload: 72,
    competencyId: "C2",
  },
  {
    code: "DSM",
    name: "Desenvolvimento de Sistemas Móveis",
    semester: 4,
    module: "Específico II",
    workload: 72,
    competencyId: "C2",
  },
  {
    code: "GAP",
    name: "Gestão Ágil de Projetos",
    semester: 4,
    module: "Específico II",
    workload: 36,
    competencyId: "C1",
  },
];

// Mapeamento de questões ENADE anterior (referência para análise)
export const questionMappings: QuestionMapping[] = [
  {
    id: "Q09",
    exam: "ENADE ADS 2021",
    type: "Objetiva",
    object: "Engenharia de requisitos e análise de sistemas",
    competencyId: "C1",
    unitCodes: ["AMS", "GAP"],
    difficulty: "baixo",
    status: "mapeada",
  },
  {
    id: "Q13",
    exam: "ENADE ADS 2021",
    type: "Objetiva",
    object: "Banco de dados e modelagem de dados",
    competencyId: "C2",
    unitCodes: ["DSW", "DWE"],
    difficulty: "medio",
    status: "mapeada",
  },
  {
    id: "Q17",
    exam: "ENADE ADS 2021",
    type: "Objetiva",
    object: "Arquitetura de software",
    competencyId: "C2",
    unitCodes: ["AMS", "DSD"],
    difficulty: "medio",
    status: "mapeada",
  },
  {
    id: "Q21",
    exam: "ENADE ADS 2021",
    type: "Objetiva",
    object: "Redes, sistemas distribuídos e segurança",
    competencyId: "C2",
    unitCodes: ["TRL", "DSD", "CNU"],
    difficulty: "alto",
    status: "revisao_docente",
  },
  {
    id: "Q24",
    exam: "ENADE ADS 2021",
    type: "Objetiva",
    object: "Estruturas de dados e lógica computacional",
    competencyId: "C2",
    unitCodes: ["EDA"],
    difficulty: "alto",
    status: "mapeada",
  },
  {
    id: "Q28",
    exam: "ENADE ADS 2021",
    type: "Objetiva",
    object: "Processo de software e qualidade",
    competencyId: "C1",
    unitCodes: ["AMS", "GAP"],
    difficulty: "medio",
    status: "mapeada",
  },
  {
    id: "Q32",
    exam: "ENADE ADS 2021",
    type: "Objetiva",
    object: "Interação humano-computador",
    competencyId: "C1",
    unitCodes: ["IHC"],
    difficulty: "medio",
    status: "mapeada",
  },
  {
    id: "D3",
    exam: "ENADE ADS 2021",
    type: "Discursiva",
    object: "Solução interdisciplinar em desenvolvimento de sistemas",
    competencyId: "C2",
    unitCodes: ["DWE", "DSW", "DSD"],
    difficulty: "medio",
    status: "revisao_docente",
  },
];

// Banco de questões base (questões podem ser adicionadas via upload)
export const questionBank: QuestionBankItem[] = [
  {
    id: "Q09",
    source: "ENADE ADS 2021",
    title: "Requisitos e regras de negócio",
    prompt:
      "Um time precisa transformar regras de negócio em funcionalidades rastreáveis. Qual prática reduz mais o risco de erro entre necessidade e implementação?",
    type: "Objetiva",
    object: "Engenharia de requisitos e análise de sistemas",
    competencyId: "C1",
    unitCodes: ["AMS", "GAP"],
    difficulty: "baixo",
    options: [
      { id: "A", text: "Validar requisitos com usuários e manter critérios de aceite." },
      { id: "B", text: "Codificar antes da validação para acelerar o cronograma." },
      { id: "C", text: "Remover documentação para reduzir esforço de comunicação." },
      { id: "D", text: "Delegar requisitos apenas à equipe de infraestrutura." },
      { id: "E", text: "Ignorar mudanças depois da primeira reunião." },
    ],
    correctOption: "A",
    explanation:
      "A rastreabilidade melhora quando requisitos, critérios de aceite e validação com usuários sustentam a implementação.",
    flashcardFront: "Como reduzir ruído entre regra de negócio e funcionalidade?",
    flashcardBack:
      "Validando requisitos com usuários, registrando critérios de aceite e mantendo rastreabilidade.",
    estimatedMinutes: 8,
  },
  {
    id: "Q13",
    source: "ENADE ADS 2021",
    title: "Banco de dados e modelagem",
    prompt:
      "Em um sistema com dados repetidos e inconsistentes, qual decisão melhora integridade e manutenção?",
    type: "Objetiva",
    object: "Banco de dados e modelagem de dados",
    competencyId: "C2",
    unitCodes: ["DSW", "DWE"],
    difficulty: "medio",
    options: [
      { id: "A", text: "Duplicar dados em todas as tabelas para simplificar consultas." },
      { id: "B", text: "Normalizar entidades, chaves e relacionamentos essenciais." },
      { id: "C", text: "Usar apenas arquivos texto sem validação." },
      { id: "D", text: "Remover restrições para evitar erros de gravação." },
      { id: "E", text: "Misturar dados de domínio e logs na mesma coluna." },
    ],
    correctOption: "B",
    explanation:
      "Normalização, chaves e relacionamentos bem definidos reduzem redundância e preservam integridade.",
    flashcardFront: "O que a normalização ajuda a evitar?",
    flashcardBack: "Redundância, anomalias de atualização e inconsistência entre entidades.",
    estimatedMinutes: 8,
  },
  {
    id: "Q17",
    source: "ENADE ADS 2021",
    title: "Arquitetura de software",
    prompt:
      "Uma aplicação precisa crescer sem acoplar regras de negócio à interface. Qual abordagem favorece manutenção?",
    type: "Objetiva",
    object: "Arquitetura de software",
    competencyId: "C2",
    unitCodes: ["AMS", "DSD"],
    difficulty: "medio",
    options: [
      { id: "A", text: "Centralizar toda lógica na tela principal." },
      { id: "B", text: "Separar responsabilidades em camadas e contratos claros." },
      { id: "C", text: "Evitar testes para acelerar entregas." },
      { id: "D", text: "Repetir consultas em todos os componentes." },
      { id: "E", text: "Usar variáveis globais para compartilhar estado." },
    ],
    correctOption: "B",
    explanation:
      "Separação de responsabilidades reduz acoplamento e melhora evolução, teste e manutenção.",
    flashcardFront: "Por que separar responsabilidades na arquitetura?",
    flashcardBack: "Para reduzir acoplamento e facilitar testes, evolução e manutenção.",
    estimatedMinutes: 9,
  },
  {
    id: "Q21",
    source: "ENADE ADS 2021",
    title: "Redes, nuvem e segurança",
    prompt:
      "Um sistema distribuído sofre indisponibilidade quando há pico de acesso. Qual conjunto de práticas é mais adequado?",
    type: "Objetiva",
    object: "Redes, sistemas distribuídos e segurança",
    competencyId: "C2",
    unitCodes: ["TRL", "DSD", "CNU"],
    difficulty: "alto",
    options: [
      { id: "A", text: "Executar tudo em uma única instância sem monitoramento." },
      { id: "B", text: "Desabilitar autenticação para reduzir latência." },
      { id: "C", text: "Balanceamento, observabilidade, cache e políticas de segurança." },
      { id: "D", text: "Ignorar gargalos de rede até a implantação final." },
      { id: "E", text: "Armazenar senhas em texto puro para facilitar suporte." },
    ],
    correctOption: "C",
    explanation:
      "Sistemas distribuídos exigem escalabilidade, monitoramento, cache e controles de segurança desde o desenho.",
    flashcardFront: "Quais pilares sustentam disponibilidade em sistemas distribuídos?",
    flashcardBack: "Balanceamento, observabilidade, cache, resiliência e segurança.",
    estimatedMinutes: 11,
  },
  {
    id: "Q24",
    source: "ENADE ADS 2021",
    title: "Estruturas de dados",
    prompt:
      "Uma funcionalidade precisa consultar rapidamente itens por chave única. Qual estrutura tende a ser mais eficiente?",
    type: "Objetiva",
    object: "Estruturas de dados e lógica computacional",
    competencyId: "C2",
    unitCodes: ["EDA"],
    difficulty: "alto",
    options: [
      { id: "A", text: "Lista sempre percorrida do início ao fim." },
      { id: "B", text: "Tabela hash com chave adequada e tratamento de colisões." },
      { id: "C", text: "Arquivo sequencial sem índice." },
      { id: "D", text: "Ordenação manual a cada busca." },
      { id: "E", text: "Matriz bidimensional sem relação com a chave." },
    ],
    correctOption: "B",
    explanation:
      "Tabelas hash são adequadas para busca por chave, desde que haja função de espalhamento e tratamento de colisões.",
    flashcardFront: "Quando uma tabela hash é uma boa escolha?",
    flashcardBack: "Quando a busca principal é por chave e há estratégia para colisões.",
    estimatedMinutes: 10,
  },
  {
    id: "Q28",
    source: "ENADE ADS 2021",
    title: "Processo e qualidade",
    prompt:
      "Como uma equipe pode aumentar previsibilidade e qualidade durante o ciclo de vida do software?",
    type: "Objetiva",
    object: "Processo de software e qualidade",
    competencyId: "C1",
    unitCodes: ["AMS", "GAP"],
    difficulty: "medio",
    options: [
      { id: "A", text: "Planejar, acompanhar indicadores, testar e revisar continuamente." },
      { id: "B", text: "Concentrar testes apenas depois da entrega ao cliente." },
      { id: "C", text: "Evitar retrospectivas para não expor problemas." },
      { id: "D", text: "Medir apenas horas trabalhadas, sem qualidade." },
      { id: "E", text: "Eliminar versionamento para acelerar commits." },
    ],
    correctOption: "A",
    explanation:
      "Qualidade surge de processo acompanhado por indicadores, testes, revisão e melhoria contínua.",
    flashcardFront: "O que melhora previsibilidade no processo de software?",
    flashcardBack: "Planejamento, indicadores, testes, revisão e melhoria contínua.",
    estimatedMinutes: 8,
  },
  {
    id: "Q32",
    source: "ENADE ADS 2021",
    title: "Interação humano-computador",
    prompt:
      "Ao avaliar uma interface, qual evidência melhor indica problema de usabilidade?",
    type: "Objetiva",
    object: "Interação humano-computador",
    competencyId: "C1",
    unitCodes: ["IHC"],
    difficulty: "medio",
    options: [
      { id: "A", text: "Usuários concluem tarefas com baixa taxa de erro." },
      { id: "B", text: "Usuários abandonam tarefas por não entenderem fluxos." },
      { id: "C", text: "A interface usa componentes consistentes." },
      { id: "D", text: "O sistema oferece feedback após ações." },
      { id: "E", text: "O conteúdo segue hierarquia visual clara." },
    ],
    correctOption: "B",
    explanation:
      "Abandono, erros recorrentes e dificuldade de compreender fluxos são sinais fortes de problema de usabilidade.",
    flashcardFront: "Qual é um sinal forte de problema de usabilidade?",
    flashcardBack: "Usuários não conseguem concluir tarefas ou abandonam o fluxo.",
    estimatedMinutes: 7,
  },
  {
    id: "D3",
    source: "ENADE ADS 2021",
    title: "Resposta discursiva técnica",
    prompt:
      "Explique uma solução interdisciplinar para um problema de desenvolvimento de sistemas, justificando arquitetura, dados, segurança e impacto.",
    type: "Discursiva",
    object: "Solução interdisciplinar em desenvolvimento de sistemas",
    competencyId: "C2",
    unitCodes: ["DWE", "DSW", "DSD"],
    difficulty: "medio",
    options: [
      { id: "A", text: "Resposta contempla problema, solução, justificativa e critérios." },
      { id: "B", text: "Resposta lista tecnologias sem relacionar ao problema." },
      { id: "C", text: "Resposta ignora dados, segurança e usuários." },
      { id: "D", text: "Resposta contém apenas opinião sem argumento técnico." },
      { id: "E", text: "Resposta foge do tema proposto." },
    ],
    correctOption: "A",
    explanation:
      "Uma resposta discursiva forte conecta problema, solução, justificativa técnica, dados, segurança e impacto.",
    flashcardFront: "O que uma discursiva técnica precisa conter?",
    flashcardBack: "Problema, solução, justificativa, critérios técnicos, dados, segurança e impacto.",
    estimatedMinutes: 14,
  },
];

// Ações pedagógicas planejadas
export const pedagogicalActions: PedagogicalAction[] = [
  {
    id: "AP01",
    title: "Oficina de leitura de enunciado, requisitos e diagramas",
    owner: "Coordenação + docentes de AMS",
    dueDate: "20/05/2026",
    status: "em_andamento",
    priority: "alta",
    competencyId: "C1",
    unitCodes: ["AMS", "GAP"],
  },
  {
    id: "AP02",
    title: "Lista orientada de estruturas de dados com questões ENADE",
    owner: "Docente de EDA",
    dueDate: "27/05/2026",
    status: "planejada",
    priority: "alta",
    competencyId: "C2",
    unitCodes: ["EDA"],
  },
  {
    id: "AP03",
    title: "Laboratório de sistemas distribuídos, nuvem e segurança",
    owner: "Docentes de TRL, CNU e DSD",
    dueDate: "10/06/2026",
    status: "planejada",
    priority: "alta",
    competencyId: "C2",
    unitCodes: ["TRL", "CNU", "DSD"],
  },
  {
    id: "AP04",
    title: "Rodada de correção comentada das questões discursivas",
    owner: "NDE ADS",
    dueDate: "17/06/2026",
    status: "planejada",
    priority: "media",
    competencyId: "C2",
    unitCodes: ["DWE", "DSW"],
  },
  {
    id: "AP05",
    title: "Segundo simulado diagnóstico por competência ENADE",
    owner: "Coordenação",
    dueDate: "24/06/2026",
    status: "planejada",
    priority: "media",
    competencyId: "C1",
    unitCodes: ["AMS", "GAP", "IHC"],
  },
];

// Funções auxiliares
export function getCompetencyTitle(competencyId: "C1" | "C2") {
  return enadeCompetencies.find((c) => c.id === competencyId)?.title ?? competencyId;
}

export function getUnitName(unitCode: string) {
  return curricularUnits.find((u) => u.code === unitCode)?.name ?? unitCode;
}
