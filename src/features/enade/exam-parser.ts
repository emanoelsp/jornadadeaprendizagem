import type {
  ExamAnalysis,
  ExamInsight,
  ExamOptionStat,
  ExamQuestionAnalysis,
  QuestionBankItem,
  QuestionOption,
  RiskLevel,
} from "./types";

const optionIds: QuestionOption["id"][] = ["A", "B", "C", "D", "E"];

export function parseDetailedExamText(text: string, sourceFileName: string): ExamAnalysis {
  const normalizedText = normalizePdfText(text);
  const title = extractExamTitle(normalizedText, sourceFileName);
  const questions = extractExamQuestions(normalizedText);
  const totalRespondents = Math.max(...questions.map((question) => question.respondents), 0);
  const averageMajorityRate = average(questions.map((question) => question.majorityRate));
  const averageDispersionRate = average(questions.map((question) => question.dispersionRate));
  const insights = buildExamInsights(questions, title);

  return {
    id: `prova-${slugify(title)}-${Date.now()}`,
    title,
    sourceFileName,
    uploadedAt: new Date().toISOString(),
    classLabel: title.replace(/^IDEA\s+/i, ""),
    totalQuestions: questions.length,
    totalRespondents,
    averageMajorityRate,
    averageDispersionRate,
    highRiskQuestionCount: questions.filter((question) => question.strategicRisk === "alto").length,
    mediumRiskQuestionCount: questions.filter((question) => question.strategicRisk === "medio").length,
    lowRiskQuestionCount: questions.filter((question) => question.strategicRisk === "baixo").length,
    questions,
    insights,
  };
}

export function examQuestionsToQuestionBankItems(
  analysis: ExamAnalysis,
  existingQuestionIds: string[],
): QuestionBankItem[] {
  return analysis.questions
    .filter((question) => !existingQuestionIds.includes(question.id))
    .map((question) => ({
      id: question.id,
      source: analysis.title,
      title: question.title,
      prompt: question.prompt,
      type: "Objetiva",
      object: inferObjectFromQuestion(question),
      competencyId: question.code.startsWith("TIC") ? "C1" : "C2",
      unitCodes: inferUnitCodes(question),
      difficulty: question.strategicRisk,
      options: question.options.length ? question.options : fallbackOptions(),
      correctOption: "A",
      explanation:
        "Questão importada da análise detalhada. Revise o gabarito e a explicação antes de usar no simulado.",
      flashcardFront: `Qual conceito resolve a ${question.title}?`,
      flashcardBack:
        question.insight || "Revise o enunciado, as alternativas e o erro mais frequente da turma.",
      estimatedMinutes: question.strategicRisk === "alto" ? 12 : 8,
    }));
}

function normalizePdfText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/\f/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
}

function extractExamTitle(text: string, sourceFileName: string) {
  const match = text.match(/Análise Detalhada da Prova\s+([^\n]+)/i);

  return match?.[1]?.trim() || sourceFileName.replace(/\.pdf$/i, "");
}

function extractExamQuestions(text: string): ExamQuestionAnalysis[] {
  const questionPattern =
    /(^|\n)([A-Z]{2,}\d{3})\s*\nQuestão:\s*(\d{3})([\s\S]*?)(?=\n[A-Z]{2,}\d{3}\s*\nQuestão:\s*\d{3}|\s*$)/g;
  const questions: ExamQuestionAnalysis[] = [];
  let match: RegExpExecArray | null;

  while ((match = questionPattern.exec(text))) {
    const [, , code, number, body] = match;
    const stats = extractOptionStats(body);
    const options = extractOptions(body);
    const prompt = extractPrompt(body);
    const facilityLabel = extractFacilityLabel(body);
    const respondents = Math.max(...stats.map((stat) => stat.total), 0);
    const majority = stats.reduce<ExamOptionStat | null>(
      (current, stat) => (!current || stat.percentage > current.percentage ? stat : current),
      null,
    );
    const majorityRate = majority?.percentage ?? 0;
    const dispersionRate = Math.max(0, 100 - majorityRate);
    const strategicRisk = riskFromExamStats(majorityRate, dispersionRate, facilityLabel);
    const id = `${code}-${number}`;

    questions.push({
      id,
      code,
      number,
      title: `Questão ${number} · ${code}`,
      prompt,
      options,
      optionStats: stats,
      facilityLabel,
      respondents,
      majorityOption: majority?.optionId ?? "A",
      majorityRate,
      dispersionRate,
      strategicRisk,
      insight: buildQuestionInsight(majority?.optionId ?? "A", majorityRate, dispersionRate),
    });
  }

  return questions.sort((a, b) => Number(a.number) - Number(b.number));
}

function extractPrompt(body: string) {
  const promptMatch = body.match(/Assuntos:\s*([\s\S]*?)(?=\nA\)|\nA\))/i);
  const prompt = promptMatch?.[1] ?? body.split(/\nQuestão\s*\n\d{3}/)[0] ?? "";

  return cleanText(prompt).slice(0, 1400);
}

function extractOptions(body: string): QuestionOption[] {
  const optionsArea = body.split(/\nQuestão\s*\n\d{3}/)[0] ?? body;
  const options: QuestionOption[] = [];

  optionIds.forEach((optionId, index) => {
    const nextOption = optionIds[index + 1];
    const pattern = nextOption
      ? new RegExp(`\\n${optionId}\\)\\s*([\\s\\S]*?)(?=\\n${nextOption}\\))`, "i")
      : new RegExp(`\\n${optionId}\\)\\s*([\\s\\S]*?)(?=\\nQuestão\\s*\\n\\d{3}|$)`, "i");
    const match = optionsArea.match(pattern);
    const text = cleanText(match?.[1] ?? "");

    if (text) {
      options.push({ id: optionId, text });
    }
  });

  return options;
}

function extractOptionStats(body: string): ExamOptionStat[] {
  const compactStatsArea =
    body.match(/Questão\s+A\s+B\s+C\s+D\s+E\s+Média de Facilidade\s*([\s\S]*)/i)?.[1] ??
    "";

  if (compactStatsArea) {
    const matches = Array.from(
      compactStatsArea.matchAll(/(?:(\d+(?:[,.]\d+)?)%|-)\s*\n?\s*(\d+)\/(\d+)/g),
    ).slice(0, optionIds.length);

    if (matches.length) {
      return optionIds.map((optionId, index) => {
        const match = matches[index];
        const percentage = match?.[1] ? Number(match[1].replace(",", ".")) : 0;
        const count = match?.[2] ? Number(match[2]) : 0;
        const total = match?.[3] ? Number(match[3]) : 0;

        return { optionId, percentage, count, total };
      });
    }
  }

  const statsArea = body.match(/\nQuestão\s*\n\d{3}([\s\S]*?)Média de Facilidade/i)?.[1] ?? "";

  return optionIds.map((optionId) => {
    const pattern = new RegExp(
      `\\n${optionId}\\s*\\n(?:(\\d+(?:[,.]\\d+)?)%\\s*\\n)?(\\d+)\\/(\\d+)`,
      "i",
    );
    const match = statsArea.match(pattern);
    const percentage = match?.[1] ? Number(match[1].replace(",", ".")) : 0;
    const count = match?.[2] ? Number(match[2]) : 0;
    const total = match?.[3] ? Number(match[3]) : 0;

    return { optionId, percentage, count, total };
  });
}

function extractFacilityLabel(body: string) {
  const compactStatsArea =
    body.match(/Questão\s+A\s+B\s+C\s+D\s+E\s+Média de Facilidade\s*([\s\S]*)/i)?.[1] ??
    "";

  if (compactStatsArea) {
    const label = compactStatsArea.match(/\d+\/\d+\s*([A-Za-zÀ-ÿ]+)\s*$/)?.[1];

    if (label) {
      return label.trim();
    }
  }

  return body.match(/Média de Facilidade\s*\n([^\n]+)/i)?.[1]?.trim() ?? "Sem classificação";
}

function buildExamInsights(questions: ExamQuestionAnalysis[], title: string): ExamInsight[] {
  const highRisk = questions
    .filter((question) => question.strategicRisk === "alto")
    .sort((a, b) => b.dispersionRate - a.dispersionRate);
  const highDispersion = questions
    .filter((question) => question.dispersionRate >= 45)
    .sort((a, b) => b.dispersionRate - a.dispersionRate);
  const lowMajority = questions
    .filter((question) => question.majorityRate < 55)
    .sort((a, b) => a.majorityRate - b.majorityRate);
  const ticQuestions = questions.filter((question) => question.code.startsWith("TIC"));
  const adsQuestions = questions.filter((question) => question.code.startsWith("ADS"));

  return [
    {
      id: "risco-alto",
      title: "Questões críticas para intervenção",
      description: `${highRisk.length} questões da ${title} têm alta dispersão ou baixa concentração de respostas, boas candidatas para exploração guiada.`,
      severity: highRisk.length ? "alto" : "baixo",
      questionIds: highRisk.slice(0, 8).map((question) => question.id),
    },
    {
      id: "distratores-fortes",
      title: "Distratores com força pedagógica",
      description:
        "Questões com dispersão alta indicam alternativas concorrentes que podem revelar conceitos confundidos pela turma.",
      severity: highDispersion.length ? "medio" : "baixo",
      questionIds: highDispersion.slice(0, 8).map((question) => question.id),
    },
    {
      id: "baixa-convergencia",
      title: "Baixa convergência de resposta",
      description:
        "Quando nenhuma alternativa concentra a turma, vale priorizar revisão conceitual antes de novo simulado.",
      severity: lowMajority.length ? "alto" : "baixo",
      questionIds: lowMajority.slice(0, 8).map((question) => question.id),
    },
    {
      id: "balanco-area",
      title: "Balanço formação geral e específica",
      description: `A prova tem ${ticQuestions.length} questões TIC/formação geral tecnológica e ${adsQuestions.length} questões específicas ADS analisadas.`,
      severity: "baixo",
      questionIds: [],
    },
  ];
}

function buildQuestionInsight(
  majorityOption: QuestionOption["id"],
  majorityRate: number,
  dispersionRate: number,
) {
  if (majorityRate < 50) {
    return "Baixa convergência: a turma se dividiu entre alternativas, indicando base conceitual instável.";
  }

  if (dispersionRate >= 45) {
    return `Distratores fortes: mesmo com maioria em ${majorityOption}, há dispersão relevante para revisar.`;
  }

  return `Boa convergência na alternativa ${majorityOption}; use como reforço ou revisão rápida.`;
}

function riskFromExamStats(
  majorityRate: number,
  dispersionRate: number,
  facilityLabel: string,
): RiskLevel {
  const normalizedLabel = facilityLabel.toLowerCase();

  if (
    majorityRate < 50 ||
    dispersionRate >= 55 ||
    normalizedLabel.includes("dif") ||
    normalizedLabel.includes("baixo")
  ) {
    return "alto";
  }

  if (majorityRate < 70 || dispersionRate >= 35 || normalizedLabel.includes("médio")) {
    return "medio";
  }

  return "baixo";
}

function inferObjectFromQuestion(question: ExamQuestionAnalysis) {
  if (question.code.startsWith("TIC")) {
    return "Formação geral tecnológica";
  }

  const prompt = question.prompt.toLowerCase();

  if (prompt.includes("pilha") || prompt.includes("estrutura")) {
    return "Estruturas de dados";
  }

  if (prompt.includes("sql") || prompt.includes("banco")) {
    return "Banco de dados";
  }

  if (prompt.includes("teste") || prompt.includes("qualidade")) {
    return "Qualidade e testes";
  }

  if (prompt.includes("requisito") || prompt.includes("modelo")) {
    return "Análise e modelagem";
  }

  return "Componente específico ADS";
}

function inferUnitCodes(question: ExamQuestionAnalysis) {
  const object = inferObjectFromQuestion(question);

  if (object.includes("Estruturas")) {
    return ["EDA"];
  }

  if (object.includes("Banco")) {
    return ["DSW", "DWE"];
  }

  if (object.includes("Qualidade")) {
    return ["QTS"];
  }

  if (object.includes("Análise")) {
    return ["AMS", "GAP"];
  }

  if (question.code.startsWith("TIC")) {
    return ["COE", "SIE"];
  }

  return ["AMS"];
}

function fallbackOptions(): QuestionOption[] {
  return optionIds.map((id) => ({ id, text: `Alternativa ${id}` }));
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
