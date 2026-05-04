"use client";

import { readSheet } from "read-excel-file/browser";
import { normalizeCompetencyId } from "./analytics";
import type { AssessmentResponse, QuestionBankItem } from "./types";

type RawImportRow = Record<string, unknown>;
type SpreadsheetCell = string | number | boolean | Date | null;

const fieldAliases = {
  className: ["turma", "classe", "class", "className", "cohort"],
  studentName: ["aluno", "estudante", "nome", "student", "studentName"],
  questionId: ["questao", "questão", "question", "questionId", "idQuestao"],
  selectedOption: ["resposta", "alternativa", "selectedOption", "answer"],
  correctOption: ["gabarito", "correta", "correctOption", "correct"],
  score: ["acerto", "correto", "score", "nota", "resultado"],
  object: ["objeto", "object", "conteudo", "conteúdo"],
  competencyId: ["competencia", "competência", "competency", "competencyId"],
  unitCodes: ["uc", "unidade", "unidades", "unit", "unitCodes"],
};

function normalizeKey(key: string) {
  return key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function pick(row: RawImportRow, aliases: string[]) {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [
    normalizeKey(key),
    value,
  ]);
  const normalizedAliases = aliases.map(normalizeKey);
  const found = normalizedEntries.find(([key]) => normalizedAliases.includes(String(key)));

  return found?.[1];
}

function normalizeScore(value: unknown, selectedOption: string, correctOption: string) {
  if (typeof value === "number") {
    return value > 0 ? 1 : 0;
  }

  const text = String(value ?? "").trim().toLowerCase();

  if (["1", "sim", "s", "true", "correto", "certo", "acertou"].includes(text)) {
    return 1;
  }

  if (["0", "nao", "não", "n", "false", "errado", "errou"].includes(text)) {
    return 0;
  }

  return selectedOption && correctOption && selectedOption === correctOption ? 1 : 0;
}

export async function parseAssessmentSpreadsheet(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const sheetRows =
    extension === "csv"
      ? parseDelimitedRows(await file.text())
      : ((await readSheet(file)) as unknown as SpreadsheetCell[][]);
  const rows = sheetRowsToObjects(sheetRows);

  return rowsToResponses(rows);
}

function sheetRowsToObjects(rows: SpreadsheetCell[][]): RawImportRow[] {
  const [headerRow, ...dataRows] = rows;

  if (!headerRow) {
    return [];
  }

  const headers = headerRow.map((cell) => String(cell ?? "").trim());

  return dataRows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
  );
}

function parseDelimitedRows(text: string): SpreadsheetCell[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => splitCsvLine(line));
}

function splitCsvLine(line: string): SpreadsheetCell[] {
  const separator = line.includes(";") ? ";" : ",";
  const cells: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (const character of line) {
    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (character === separator && !insideQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current.trim());

  return cells;
}

export function rowsToResponses(rows: RawImportRow[]): AssessmentResponse[] {
  return rows
    .map((row, index) => {
      const className = String(pick(row, fieldAliases.className) ?? "").trim();
      const studentName = String(pick(row, fieldAliases.studentName) ?? "").trim();
      const questionId = String(pick(row, fieldAliases.questionId) ?? "").trim();
      const selectedOption = String(pick(row, fieldAliases.selectedOption) ?? "").trim();
      const correctOption = String(pick(row, fieldAliases.correctOption) ?? "").trim();

      if (!className || !studentName || !questionId) {
        return null;
      }

      return {
        id: `import-${className}-${studentName}-${questionId}-${index}`.replace(/\W+/g, "-"),
        className,
        studentName,
        questionId,
        selectedOption,
        correctOption,
        score: normalizeScore(pick(row, fieldAliases.score), selectedOption, correctOption),
        answeredAt: new Date().toISOString(),
      };
    })
    .filter((response): response is AssessmentResponse => Boolean(response));
}

export function rowsToQuestionDrafts(rows: RawImportRow[]): QuestionBankItem[] {
  return rows.reduce<QuestionBankItem[]>((drafts, row) => {
    const questionId = String(pick(row, fieldAliases.questionId) ?? "").trim();
    const object = String(pick(row, fieldAliases.object) ?? "Objeto importado").trim();
    const unitCodes = String(pick(row, fieldAliases.unitCodes) ?? "")
      .split(/[,;|]/)
      .map((unitCode) => unitCode.trim().toUpperCase())
      .filter(Boolean);

    if (!questionId) {
      return drafts;
    }

    return [
      ...drafts,
      {
        id: questionId,
        source: "Importação",
        title: object,
        prompt: "Enunciado pendente de revisão pelo gestor.",
        type: "Objetiva",
        object,
        competencyId: normalizeCompetencyId(pick(row, fieldAliases.competencyId)),
        unitCodes: unitCodes.length ? unitCodes : ["UC"],
        difficulty: "medio",
        options: [
          { id: "A", text: "Alternativa A" },
          { id: "B", text: "Alternativa B" },
          { id: "C", text: "Alternativa C" },
          { id: "D", text: "Alternativa D" },
          { id: "E", text: "Alternativa E" },
        ],
        correctOption: "A",
        explanation: "Explicação pendente de revisão pelo gestor.",
        flashcardFront: `O que revisar em ${object}?`,
        flashcardBack: "Revise conceito, aplicação, erros recorrentes e justificativa técnica.",
        estimatedMinutes: 8,
      },
    ];
  }, []);
}
