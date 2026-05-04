import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "./client";
import type {
  ClassDiagnostic,
  ExamAnalysis,
  LearningJourney,
  QuestionBankItem,
  StudentJourneyProgress,
  UploadedDocument,
} from "@/features/enade/types";

type SaveResult = {
  persisted: boolean;
  reason?: string;
};

async function saveRecord(
  collectionName: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<SaveResult> {
  const db = getFirebaseDb();

  if (!db) {
    return {
      persisted: false,
      reason: "Firestore não configurado; dados mantidos apenas na sessão local.",
    };
  }

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );

  await setDoc(
    doc(db, collectionName, id),
    {
      ...cleanPayload,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { persisted: true };
}

export function saveUploadedDocument(document: UploadedDocument) {
  return saveRecord("uploads", document.id, { ...document });
}

export function saveClassDiagnostic(diagnostic: ClassDiagnostic) {
  return saveRecord("classDiagnostics", diagnostic.className, { ...diagnostic });
}

export function saveQuestion(question: QuestionBankItem) {
  return saveRecord("questions", question.id, { ...question });
}

export function saveExamAnalysis(analysis: ExamAnalysis) {
  return saveRecord("examAnalyses", analysis.id, { ...analysis });
}

export function saveJourney(journey: LearningJourney) {
  return saveRecord("journeys", journey.id, { ...journey });
}

export function saveStudentProgress(progress: StudentJourneyProgress) {
  return saveRecord("studentProgress", `${progress.className}-${progress.studentName}`, {
    ...progress,
  });
}
