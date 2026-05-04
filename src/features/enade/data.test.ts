import {
  createJourneyFromQuestionIds,
  percentage,
  riskFromAccuracy,
} from "./analytics";
import {
  getCompetencyTitle,
  getUnitName,
  questionBank,
  questionMappings,
} from "./data";
import { examQuestionsToQuestionBankItems, parseDetailedExamText } from "./exam-parser";

describe("ENADE preparation data", () => {
  it("keeps question mappings linked to known labels", () => {
    const criticalQuestion = questionMappings.find((question) => question.id === "Q24");

    expect(criticalQuestion).toBeDefined();
    expect(getCompetencyTitle("C2")).toContain("Arquitetura");
    expect(getUnitName("EDA")).toBe("Estruturas de Dados");
  });

  it("generates a three-macro learning journey from selected questions", () => {
    const journey = createJourneyFromQuestionIds("ADS TESTE", ["Q24", "Q21"], questionBank);

    expect(journey.macros).toHaveLength(3);
    expect(journey.macros.map((macro) => macro.id)).toEqual([
      "exploracao",
      "flashcards",
      "simulado",
    ]);
    expect(journey.questionIds).toEqual(["Q24", "Q21"]);
  });

  it("normalizes risk and percentage calculations", () => {
    expect(percentage(3, 4)).toBe(75);
    expect(riskFromAccuracy(54)).toBe("alto");
    expect(riskFromAccuracy(69)).toBe("medio");
    expect(riskFromAccuracy(70)).toBe("baixo");
  });

  it("parses the detailed exam PDF text format into strategic question metrics", () => {
    const analysis = parseDetailedExamText(
      `Análise Detalhada da Prova
IDEA 3º SEMESTRE 2025/2

TIC001
Questão: 001
Assuntos:
Texto da questão para análise.

A) Alternativa correta a revisar.
B) Alternativa B.
C) Alternativa C.
D) Alternativa D.
E) Alternativa E.

Questão
001

A
40%
4/10

B
30%
3/10

C
20%
2/10

D
10%
1/10

E
0/10

Média de Facilidade
Médio`,
      "prova.pdf",
    );

    expect(analysis.title).toBe("IDEA 3º SEMESTRE 2025/2");
    expect(analysis.totalQuestions).toBe(1);
    expect(analysis.questions[0].majorityOption).toBe("A");
    expect(analysis.questions[0].strategicRisk).toBe("alto");
  });

  it("turns parsed exam questions into editable question bank drafts", () => {
    const analysis = parseDetailedExamText(
      `Análise Detalhada da Prova
IDEA 2º SEMESTRE 2025/2

ADS001
Questão: 001
Assuntos:
Uma questão sobre pilha.
A) A.
B) B.
C) C.
D) D.
E) E.
Questão
001
A
80%
8/10
B
20%
2/10
C
0/10
D
0/10
E
0/10
Média de Facilidade
Fácil`,
      "prova.pdf",
    );
    const drafts = examQuestionsToQuestionBankItems(analysis, []);

    expect(drafts).toHaveLength(1);
    expect(drafts[0].id).toBe("ADS001-001");
    expect(drafts[0].unitCodes).toContain("EDA");
  });
});
