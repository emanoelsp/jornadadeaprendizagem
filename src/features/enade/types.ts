export type RiskLevel = "baixo" | "medio" | "alto";

export type ActionStatus = "planejada" | "em_andamento" | "concluida";

export type Priority = "baixa" | "media" | "alta";

export type CompetencyId = "C1" | "C2";

export type UserRole = "gestor" | "aluno";

export type CurricularUnit = {
  code: string;
  name: string;
  semester: 3 | 4;
  module: "Específico I" | "Específico II";
  workload: number;
  competencyId: CompetencyId;
};

export type EnadeCompetency = {
  id: CompetencyId;
  title: string;
  description: string;
  abilities: string[];
};

export type QuestionMapping = {
  id: string;
  exam: string;
  type: "Objetiva" | "Discursiva";
  object: string;
  competencyId: CompetencyId;
  unitCodes: string[];
  difficulty: RiskLevel;
  status: "mapeada" | "revisao_docente";
};

export type PedagogicalAction = {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: ActionStatus;
  priority: Priority;
  competencyId: CompetencyId;
  unitCodes: string[];
};

export type StudyTask = {
  id: string;
  title: string;
  duration: string;
  priority: Priority;
  unitCode: string;
  competencyId: CompetencyId;
};

export type StudentPreparationPlan = {
  studentName: string;
  cohort: string;
  courseProgress: number;
  readiness: number;
  averageAccuracy: number;
  targetAccuracy: number;
  strengths: string[];
  priorityGaps: string[];
  studyTasks: StudyTask[];
  recommendedQuestionIds: string[];
};

export type QuestionOption = {
  id: "A" | "B" | "C" | "D" | "E";
  text: string;
};

export type QuestionBankItem = {
  id: string;
  source: string;
  title: string;
  prompt: string;
  type: "Objetiva" | "Discursiva";
  object: string;
  competencyId: CompetencyId;
  unitCodes: string[];
  difficulty: RiskLevel;
  options: QuestionOption[];
  correctOption: QuestionOption["id"];
  explanation: string;
  flashcardFront: string;
  flashcardBack: string;
  estimatedMinutes: number;
};

export type AssessmentResponse = {
  id: string;
  className: string;
  studentName: string;
  questionId: string;
  selectedOption: string;
  correctOption: string;
  score: number;
  answeredAt: string;
};

export type QuestionDiagnostic = {
  questionId: string;
  title: string;
  object: string;
  competencyId: CompetencyId;
  unitCodes: string[];
  attempts: number;
  correct: number;
  accuracy: number;
  errorRate: number;
  risk: RiskLevel;
  impactScore: number;
};

export type GroupDiagnostic = {
  id: string;
  label: string;
  attempts: number;
  correct: number;
  accuracy: number;
  risk: RiskLevel;
};

export type StudentDiagnostic = {
  studentName: string;
  answered: number;
  correct: number;
  accuracy: number;
  risk: RiskLevel;
};

export type ClassDiagnostic = {
  className: string;
  totalStudents: number;
  totalQuestions: number;
  totalResponses: number;
  averageAccuracy: number;
  medianQuestionAccuracy: number;
  completionRate: number;
  highRiskQuestionCount: number;
  topProblemQuestionIds: string[];
  strongestQuestionIds: string[];
  byQuestion: QuestionDiagnostic[];
  byCompetency: GroupDiagnostic[];
  byUnit: GroupDiagnostic[];
  byStudent: StudentDiagnostic[];
};

export type UploadedDocument = {
  id: string;
  fileName: string;
  fileType: "excel" | "pdf" | "csv";
  classNames: string[];
  uploadedAt: string;
  blobUrl?: string;
  status: "processado" | "armazenado" | "pendente_configuracao";
  importedResponses: number;
};

export type ExamOptionStat = {
  optionId: QuestionOption["id"];
  percentage: number;
  count: number;
  total: number;
};

export type ExamQuestionAnalysis = {
  id: string;
  code: string;
  number: string;
  title: string;
  prompt: string;
  options: QuestionOption[];
  optionStats: ExamOptionStat[];
  facilityLabel: string;
  respondents: number;
  majorityOption: QuestionOption["id"];
  majorityRate: number;
  dispersionRate: number;
  strategicRisk: RiskLevel;
  insight: string;
};

export type ExamInsight = {
  id: string;
  title: string;
  description: string;
  severity: RiskLevel;
  questionIds: string[];
};

export type ExamAnalysis = {
  id: string;
  title: string;
  sourceFileName: string;
  uploadedAt: string;
  classLabel: string;
  totalQuestions: number;
  totalRespondents: number;
  averageMajorityRate: number;
  averageDispersionRate: number;
  highRiskQuestionCount: number;
  mediumRiskQuestionCount: number;
  lowRiskQuestionCount: number;
  questions: ExamQuestionAnalysis[];
  insights: ExamInsight[];
  blobUrl?: string;
};

export type LearningMacro = {
  id: "exploracao" | "flashcards" | "simulado";
  title: string;
  subtitle: string;
  weekLabel: string;
  questionIds: string[];
};

export type LearningJourney = {
  id: string;
  className: string;
  title: string;
  description: string;
  questionIds: string[];
  macros: LearningMacro[];
  createdAt: string;
  updatedAt: string;
  status: "rascunho" | "publicada";
};

export type StudentJourneyProgress = {
  studentName: string;
  className: string;
  currentMacro: LearningMacro["id"];
  exploredQuestionIds: string[];
  learnedQuestionIds: string[];
  pendingFlashcardIds: string[];
  simulationAnswers: Record<string, string>;
  completed: boolean;
};
