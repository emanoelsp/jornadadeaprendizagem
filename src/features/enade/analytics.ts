import type {
  AssessmentResponse,
  ClassDiagnostic,
  CompetencyId,
  GroupDiagnostic,
  LearningJourney,
  QuestionBankItem,
  QuestionDiagnostic,
  RiskLevel,
  StudentDiagnostic,
} from "./types";

export function percentage(part: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((part / total) * 100);
}

export function riskFromAccuracy(accuracy: number): RiskLevel {
  if (accuracy < 55) {
    return "alto";
  }

  if (accuracy < 70) {
    return "medio";
  }

  return "baixo";
}

export function median(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);

  if (sorted.length % 2) {
    return sorted[midpoint];
  }

  return Math.round((sorted[midpoint - 1] + sorted[midpoint]) / 2);
}

export function buildDiagnosticsByClass(
  responses: AssessmentResponse[],
  questions: QuestionBankItem[],
): ClassDiagnostic[] {
  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const classNames = Array.from(new Set(responses.map((response) => response.className))).sort();

  return classNames.map((className) => {
    const classResponses = responses.filter((response) => response.className === className);
    const students = Array.from(new Set(classResponses.map((response) => response.studentName)));
    const questionIds = Array.from(new Set(classResponses.map((response) => response.questionId)));
    const totalCorrect = classResponses.filter((response) => response.score > 0).length;
    const expectedResponses = students.length * questionIds.length;
    const byQuestion = buildQuestionDiagnostics(classResponses, questionsById);
    const byCompetency = buildGroupDiagnostics(classResponses, questionsById, "competency");
    const byUnit = buildGroupDiagnostics(classResponses, questionsById, "unit");
    const byStudent = buildStudentDiagnostics(classResponses);
    const sortedByRisk = [...byQuestion].sort((a, b) => {
      if (b.impactScore !== a.impactScore) {
        return b.impactScore - a.impactScore;
      }

      return a.accuracy - b.accuracy;
    });

    return {
      className,
      totalStudents: students.length,
      totalQuestions: questionIds.length,
      totalResponses: classResponses.length,
      averageAccuracy: percentage(totalCorrect, classResponses.length),
      medianQuestionAccuracy: median(byQuestion.map((question) => question.accuracy)),
      completionRate: percentage(classResponses.length, expectedResponses),
      highRiskQuestionCount: byQuestion.filter((question) => question.risk === "alto").length,
      topProblemQuestionIds: sortedByRisk.slice(0, 5).map((question) => question.questionId),
      strongestQuestionIds: [...byQuestion]
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 3)
        .map((question) => question.questionId),
      byQuestion,
      byCompetency,
      byUnit,
      byStudent,
    };
  });
}

function buildQuestionDiagnostics(
  responses: AssessmentResponse[],
  questionsById: Map<string, QuestionBankItem>,
): QuestionDiagnostic[] {
  const questionIds = Array.from(new Set(responses.map((response) => response.questionId))).sort();

  return questionIds.map((questionId) => {
    const questionResponses = responses.filter((response) => response.questionId === questionId);
    const correct = questionResponses.filter((response) => response.score > 0).length;
    const question = questionsById.get(questionId);
    const accuracy = percentage(correct, questionResponses.length);

    return {
      questionId,
      title: question?.title ?? questionId,
      object: question?.object ?? "Objeto pendente",
      competencyId: question?.competencyId ?? "C1",
      unitCodes: question?.unitCodes ?? [],
      attempts: questionResponses.length,
      correct,
      accuracy,
      errorRate: 100 - accuracy,
      risk: riskFromAccuracy(accuracy),
      impactScore: Math.round((100 - accuracy) * Math.max(1, questionResponses.length / 10)),
    };
  });
}

function buildGroupDiagnostics(
  responses: AssessmentResponse[],
  questionsById: Map<string, QuestionBankItem>,
  mode: "competency" | "unit",
): GroupDiagnostic[] {
  const groups = new Map<string, AssessmentResponse[]>();

  responses.forEach((response) => {
    const question = questionsById.get(response.questionId);
    const keys =
      mode === "competency"
        ? [question?.competencyId ?? "C1"]
        : question?.unitCodes.length
          ? question.unitCodes
          : ["UC pendente"];

    keys.forEach((key) => {
      const current = groups.get(key) ?? [];
      groups.set(key, [...current, response]);
    });
  });

  return Array.from(groups.entries())
    .map(([id, groupResponses]) => {
      const correct = groupResponses.filter((response) => response.score > 0).length;
      const accuracy = percentage(correct, groupResponses.length);

      return {
        id,
        label: id,
        attempts: groupResponses.length,
        correct,
        accuracy,
        risk: riskFromAccuracy(accuracy),
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);
}

function buildStudentDiagnostics(responses: AssessmentResponse[]): StudentDiagnostic[] {
  const students = Array.from(new Set(responses.map((response) => response.studentName))).sort();

  return students.map((studentName) => {
    const studentResponses = responses.filter((response) => response.studentName === studentName);
    const correct = studentResponses.filter((response) => response.score > 0).length;
    const accuracy = percentage(correct, studentResponses.length);

    return {
      studentName,
      answered: studentResponses.length,
      correct,
      accuracy,
      risk: riskFromAccuracy(accuracy),
    };
  });
}

export function createJourneyFromQuestionIds(
  className: string,
  questionIds: string[],
  questions: QuestionBankItem[],
): LearningJourney {
  const selectedQuestions = questionIds
    .map((questionId) => questions.find((question) => question.id === questionId))
    .filter((question): question is QuestionBankItem => Boolean(question));
  const now = new Date().toISOString();

  return {
    id: `jornada-${className.toLowerCase().replace(/\W+/g, "-")}-${Date.now()}`,
    className,
    title: `Jornada ENADE ${className}`,
    description:
      "Exploração guiada, flashcards com memória espaçada e novo simulado preparatório.",
    questionIds: selectedQuestions.map((question) => question.id),
    macros: [
      {
        id: "exploracao",
        title: "Exploração das questões críticas",
        subtitle: "Tour guiado com índices de acerto, erros recorrentes e vínculo com UCs.",
        weekLabel: "Macro semana 1",
        questionIds: selectedQuestions.map((question) => question.id),
      },
      {
        id: "flashcards",
        title: "Flashcards de aprendizagem",
        subtitle: "Memória espaçada: aprendeu sai da fila, não aprendeu volta para revisar.",
        weekLabel: "Macro semana 2",
        questionIds: selectedQuestions.map((question) => question.id),
      },
      {
        id: "simulado",
        title: "Novo simulado preparatório",
        subtitle: "Aplicação final usando as questões selecionadas pelo gestor.",
        weekLabel: "Macro semana 3",
        questionIds: selectedQuestions.map((question) => question.id),
      },
    ],
    createdAt: now,
    updatedAt: now,
    status: "publicada",
  };
}

export function normalizeCompetencyId(value: unknown): CompetencyId {
  return String(value ?? "").toUpperCase().includes("2") ? "C2" : "C1";
}
