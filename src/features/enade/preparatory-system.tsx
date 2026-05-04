"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  LibraryBig,
  Lock,
  LogOut,
  Mail,
  Pencil,
  PlayCircle,
  Plus,
  Save,
  Sparkles,
  Trophy,
  Upload,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import {
  createPasswordAccount,
  logoutFirebaseUser,
  signInWithGooglePopup,
  signInWithPassword,
} from "@/lib/firebase/auth-service";
import {
  saveClassDiagnostic,
  saveExamAnalysis,
  saveJourney,
  saveQuestion,
  saveStudentProgress,
  saveUploadedDocument,
} from "@/lib/firebase/firestore-service";
import { cn, formatPercent } from "@/lib/utils";
import {
  buildDiagnosticsByClass,
  createJourneyFromQuestionIds,
} from "./analytics";
import {
  defaultJourneys,
  enadeCompetencies,
  initialClassDiagnostics,
  questionBank,
  sampleResponses,
} from "./data";
import { examQuestionsToQuestionBankItems } from "./exam-parser";
import { parseAssessmentSpreadsheet } from "./upload-parser";
import type {
  AssessmentResponse,
  ClassDiagnostic,
  ExamAnalysis,
  LearningJourney,
  QuestionBankItem,
  QuestionOption,
  RiskLevel,
  StudentJourneyProgress,
  UploadedDocument,
  UserRole,
} from "./types";

type SessionUser = {
  role: UserRole;
  name: string;
  email: string;
  demo: boolean;
};

type ManagerTab = "provas" | "diagnostico" | "questoes" | "jornada";

const riskVariant: Record<RiskLevel, "success" | "warning" | "danger"> = {
  baixo: "success",
  medio: "warning",
  alto: "danger",
};

const defaultQuestionDraft: QuestionBankItem = {
  id: "",
  source: "Gestor",
  title: "",
  prompt: "",
  type: "Objetiva",
  object: "",
  competencyId: "C2",
  unitCodes: ["EDA"],
  difficulty: "medio",
  options: [
    { id: "A", text: "" },
    { id: "B", text: "" },
    { id: "C", text: "" },
    { id: "D", text: "" },
    { id: "E", text: "" },
  ],
  correctOption: "A",
  explanation: "",
  flashcardFront: "",
  flashcardBack: "",
  estimatedMinutes: 8,
};

export function PreparatorySystem() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [responses, setResponses] = useState<AssessmentResponse[]>(sampleResponses);
  const [questions, setQuestions] = useState<QuestionBankItem[]>(questionBank);
  const [journeys, setJourneys] = useState<LearningJourney[]>(defaultJourneys);
  const [uploads, setUploads] = useState<UploadedDocument[]>([]);
  const [examAnalyses, setExamAnalyses] = useState<ExamAnalysis[]>([]);

  const diagnostics = useMemo(
    () => buildDiagnosticsByClass(responses, questions),
    [questions, responses],
  );

  if (!session) {
    return <LoginScreen onAuthenticated={setSession} />;
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                Preparatório ENADE 2026
              </p>
              <h1 className="truncate text-xl font-semibold tracking-normal sm:text-2xl">
                {session.role === "gestor" ? "Workspace do gestor" : "Jornada do aluno"}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={session.demo ? "warning" : "success"}>
              {session.demo ? "Modo demonstração" : "Firebase ativo"}
            </Badge>
            <Badge variant="neutral">{session.name}</Badge>
            <Button
              onClick={async () => {
                if (!session.demo && isFirebaseConfigured()) {
                  await logoutFirebaseUser();
                }

                setSession(null);
              }}
              size="sm"
              variant="outline"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {session.role === "gestor" ? (
          <ManagerWorkspace
            diagnostics={diagnostics.length ? diagnostics : initialClassDiagnostics}
            examAnalyses={examAnalyses}
            journeys={journeys}
            onExamAnalysesChange={setExamAnalyses}
            onJourneysChange={setJourneys}
            onQuestionsChange={setQuestions}
            onResponsesChange={setResponses}
            onUploadsChange={setUploads}
            questions={questions}
            responses={responses}
            uploads={uploads}
          />
        ) : (
          <StudentLearningJourney
            diagnostics={diagnostics.length ? diagnostics : initialClassDiagnostics}
            journeys={journeys}
            questions={questions}
          />
        )}
      </div>
    </main>
  );
}

function LoginScreen({
  onAuthenticated,
}: {
  onAuthenticated: (session: SessionUser) => void;
}) {
  const [role, setRole] = useState<UserRole>("gestor");
  const [name, setName] = useState("Coordenação ADS");
  const [email, setEmail] = useState("gestor@unisenai.local");
  const [password, setPassword] = useState("enade2026");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firebaseReady = isFirebaseConfigured();

  async function authenticate(mode: "signin" | "signup" | "demo") {
    setIsSubmitting(true);
    setMessage("");

    try {
      if (mode === "demo" || !firebaseReady) {
        onAuthenticated({ role, name, email, demo: true });
        return;
      }

      const user =
        mode === "signup"
          ? await createPasswordAccount(email, password)
          : await signInWithPassword(email, password);

      onAuthenticated({
        role,
        name: user.displayName ?? name,
        email: user.email ?? email,
        demo: false,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível autenticar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function authenticateWithGoogle() {
    setIsSubmitting(true);
    setMessage("");

    try {
      if (!firebaseReady) {
        setMessage("Configure o Firebase para usar login com Google/Gmail.");
        return;
      }

      const user = await signInWithGooglePopup();

      onAuthenticated({
        role,
        name: user.displayName ?? name,
        email: user.email ?? email,
        demo: false,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível autenticar com Google.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
        <section className="space-y-6">
          <Badge variant="info">SENAI-SC · ENADE 2026 ADS</Badge>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
              Diagnóstico por turma e jornada de aprendizagem.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              O gestor importa Excel/PDF, acompanha métricas por turma e questão,
              seleciona itens críticos e publica uma trilha em três macros para o aluno.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <FeaturePill icon={Upload} text="Upload Excel/PDF" />
            <FeaturePill icon={BarChart3} text="Métricas visuais" />
            <FeaturePill icon={Brain} text="Flashcards espaçados" />
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Acesso ao sistema</CardTitle>
            <CardDescription>
              Login com Firebase Auth quando configurado, ou modo demonstração local para desenvolvimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-background p-1">
              <Button
                onClick={() => {
                  setRole("gestor");
                  setName("Coordenação ADS");
                  setEmail("gestor@unisenai.local");
                }}
                type="button"
                variant={role === "gestor" ? "default" : "ghost"}
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                Gestor
              </Button>
              <Button
                onClick={() => {
                  setRole("aluno");
                  setName("Estudante ADS");
                  setEmail("aluno@unisenai.local");
                }}
                type="button"
                variant={role === "aluno" ? "default" : "ghost"}
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Aluno
              </Button>
            </div>

            <Field label="Nome">
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="E-mail">
              <Input
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label="Senha">
              <Input
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>

            {message ? <p className="text-sm text-rose-700">{message}</p> : null}
            {!firebaseReady ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                Configure as variáveis `NEXT_PUBLIC_FIREBASE_*` para autenticar e salvar no Firestore.
              </div>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <Button disabled={isSubmitting} onClick={() => authenticate("signin")}>
                <Lock className="h-4 w-4" aria-hidden="true" />
                Entrar
              </Button>
              <Button
                disabled={isSubmitting || !firebaseReady}
                onClick={authenticateWithGoogle}
                variant="outline"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Gmail
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={() => authenticate("signup")}
                variant="outline"
              >
                Criar acesso
              </Button>
              <Button
                disabled={isSubmitting}
                onClick={() => authenticate("demo")}
                variant="ghost"
              >
                Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function ManagerWorkspace({
  diagnostics,
  examAnalyses,
  journeys,
  onExamAnalysesChange,
  onJourneysChange,
  onQuestionsChange,
  onResponsesChange,
  onUploadsChange,
  questions,
  responses,
  uploads,
}: {
  diagnostics: ClassDiagnostic[];
  examAnalyses: ExamAnalysis[];
  journeys: LearningJourney[];
  onExamAnalysesChange: (analyses: ExamAnalysis[]) => void;
  onJourneysChange: (journeys: LearningJourney[]) => void;
  onQuestionsChange: (questions: QuestionBankItem[]) => void;
  onResponsesChange: (responses: AssessmentResponse[]) => void;
  onUploadsChange: (uploads: UploadedDocument[]) => void;
  questions: QuestionBankItem[];
  responses: AssessmentResponse[];
  uploads: UploadedDocument[];
}) {
  const [selectedClass, setSelectedClass] = useState(diagnostics[0]?.className ?? "ADS 3A");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(
    diagnostics[0]?.topProblemQuestionIds.slice(0, 4) ?? [],
  );
  const [tab, setTab] = useState<ManagerTab>("provas");
  const [notice, setNotice] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [questionDraft, setQuestionDraft] = useState<QuestionBankItem>(defaultQuestionDraft);

  const currentDiagnostic =
    diagnostics.find((diagnostic) => diagnostic.className === selectedClass) ?? diagnostics[0];
  const currentJourney = journeys.find((journey) => journey.className === selectedClass);
  const averageAccuracy = diagnostics.length
    ? Math.round(
        diagnostics.reduce((sum, diagnostic) => sum + diagnostic.averageAccuracy, 0) /
          diagnostics.length,
      )
    : 0;
  const totalStudents = diagnostics.reduce(
    (sum, diagnostic) => sum + diagnostic.totalStudents,
    0,
  );
  const highRiskQuestions = diagnostics.reduce(
    (sum, diagnostic) => sum + diagnostic.highRiskQuestionCount,
    0,
  );
  const examQuestionCount = examAnalyses.reduce(
    (sum, analysis) => sum + analysis.totalQuestions,
    0,
  );
  const examHighRiskCount = examAnalyses.reduce(
    (sum, analysis) => sum + analysis.highRiskQuestionCount,
    0,
  );

  async function uploadFile(file: File) {
    setIsUploading(true);
    setNotice("");

    try {
      let blobUrl: string | undefined;
      let importedResponses: AssessmentResponse[] = [];
      const extension = file.name.split(".").pop()?.toLowerCase();
      const fileType =
        extension === "pdf" ? "pdf" : extension === "csv" ? "csv" : "excel";

      if (fileType === "pdf") {
        await uploadExamPdf(file);
        return;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const payload = (await response.json()) as { url?: string };
          blobUrl = payload.url;
        }
      } catch {
        blobUrl = undefined;
      }

      importedResponses = await parseAssessmentSpreadsheet(file);

      const classNames = Array.from(
        new Set(importedResponses.map((response) => response.className)),
      );
      const importedQuestionIds = Array.from(
        new Set(importedResponses.map((response) => response.questionId)),
      );
      const placeholderQuestions = importedQuestionIds
        .filter((questionId) => !questions.some((question) => question.id === questionId))
        .map((questionId): QuestionBankItem => ({
          ...defaultQuestionDraft,
          id: questionId,
          title: `Questão ${questionId}`,
          prompt: "Enunciado importado pendente de edição pelo gestor.",
          object: "Objeto importado",
          explanation: "Explicação pendente.",
          flashcardFront: `Qual conceito resolve a questão ${questionId}?`,
          flashcardBack: "Revise o erro da turma e registre a explicação final.",
          correctOption: "A",
        }));
      const nextQuestions = [...questions, ...placeholderQuestions];
      const nextResponses = [...responses, ...importedResponses];
      const nextDiagnostics = buildDiagnosticsByClass(nextResponses, nextQuestions);
      const document: UploadedDocument = {
        id: `upload-${file.name}-${uploads.length + 1}`.replace(/\W+/g, "-"),
        fileName: file.name,
        fileType,
        classNames: classNames.length ? classNames : [selectedClass],
        uploadedAt: new Date().toISOString(),
        blobUrl,
        status: blobUrl ? "processado" : "pendente_configuracao",
        importedResponses: importedResponses.length,
      };

      onQuestionsChange(nextQuestions);
      onResponsesChange(nextResponses);
      onUploadsChange([document, ...uploads]);
      await saveUploadedDocument(document);
      await Promise.all(nextDiagnostics.map(saveClassDiagnostic));
      setNotice(
        importedResponses.length
          ? `${importedResponses.length} respostas importadas e diagnóstico atualizado.`
          : "Documento armazenado para consulta do gestor.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível processar o arquivo.");
    } finally {
      setIsUploading(false);
    }
  }

  async function uploadExamPdf(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/provas/analyze", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as {
      analysis?: ExamAnalysis;
      document?: UploadedDocument;
      error?: string;
    };

    if (!response.ok || !payload.analysis || !payload.document) {
      throw new Error(payload.error ?? "Não foi possível analisar a prova.");
    }

    const importedQuestions = examQuestionsToQuestionBankItems(
      payload.analysis,
      questions.map((question) => question.id),
    );
    const nextQuestions = [...questions, ...importedQuestions];
    const nextAnalyses = [payload.analysis, ...examAnalyses];
    const nextUploads = [payload.document, ...uploads];

    onQuestionsChange(nextQuestions);
    onExamAnalysesChange(nextAnalyses);
    onUploadsChange(nextUploads);
    await saveExamAnalysis(payload.analysis);
    await saveUploadedDocument(payload.document);
    setTab("provas");
    setNotice(
      `${payload.analysis.totalQuestions} questões analisadas em ${payload.analysis.title}. ${importedQuestions.length} rascunhos entraram no banco de questões.`,
    );
  }

  async function loadExampleExams() {
    setIsUploading(true);
    setNotice("");

    try {
      const response = await fetch("/api/provas/examples");
      const payload = (await response.json()) as { analyses?: ExamAnalysis[]; error?: string };

      if (!response.ok || !payload.analyses) {
        throw new Error(payload.error ?? "Não foi possível carregar as provas de exemplo.");
      }

      const existingIds = new Set(examAnalyses.map((analysis) => analysis.sourceFileName));
      const newAnalyses = payload.analyses.filter(
        (analysis) => !existingIds.has(analysis.sourceFileName),
      );
      const importedQuestions = newAnalyses.flatMap((analysis) =>
        examQuestionsToQuestionBankItems(
          analysis,
          questions.map((question) => question.id),
        ),
      );

      onExamAnalysesChange([...newAnalyses, ...examAnalyses]);
      onQuestionsChange([...questions, ...importedQuestions]);
      await Promise.all(newAnalyses.map(saveExamAnalysis));
      setTab("provas");
      setNotice(
        `${newAnalyses.length} provas de exemplo carregadas com ${importedQuestions.length} questões rascunhadas.`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Não foi possível carregar exemplos.");
    } finally {
      setIsUploading(false);
    }
  }

  function toggleQuestion(questionId: string) {
    setSelectedQuestionIds((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId],
    );
  }

  async function saveQuestionDraft() {
    if (!questionDraft.id || !questionDraft.title || !questionDraft.prompt) {
      setNotice("Preencha pelo menos ID, título e enunciado da questão.");
      return;
    }

    const normalizedQuestion = {
      ...questionDraft,
      unitCodes: questionDraft.unitCodes.length ? questionDraft.unitCodes : ["UC"],
      flashcardFront:
        questionDraft.flashcardFront || `Qual conceito resolve ${questionDraft.title}?`,
      flashcardBack:
        questionDraft.flashcardBack || questionDraft.explanation || "Explicação a revisar.",
    };
    const nextQuestions = questions.some((question) => question.id === normalizedQuestion.id)
      ? questions.map((question) =>
          question.id === normalizedQuestion.id ? normalizedQuestion : question,
        )
      : [normalizedQuestion, ...questions];

    onQuestionsChange(nextQuestions);
    await saveQuestion(normalizedQuestion);
    setQuestionDraft(defaultQuestionDraft);
    setNotice("Questão salva e disponível para compor jornadas.");
  }

  async function generateJourney() {
    if (!selectedQuestionIds.length) {
      setNotice("Selecione ao menos uma questão para gerar a jornada.");
      return;
    }

    const journey = createJourneyFromQuestionIds(selectedClass, selectedQuestionIds, questions);
    const nextJourneys = journeys.some((item) => item.className === selectedClass)
      ? journeys.map((item) => (item.className === selectedClass ? journey : item))
      : [journey, ...journeys];

    onJourneysChange(nextJourneys);
    await saveJourney(journey);
    setNotice(`Jornada publicada para ${selectedClass} com ${selectedQuestionIds.length} questões.`);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={ClipboardList} label="Provas" value={examAnalyses.length} helper={`${examQuestionCount} questões`} />
        <MetricCard icon={Users} label="Alunos" value={totalStudents} helper="Respostas importadas" />
        <MetricCard
          icon={BarChart3}
          label="Acerto médio"
          value={formatPercent(averageAccuracy)}
          helper="Todas as turmas"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Questões críticas"
          value={examAnalyses.length ? examHighRiskCount : highRiskQuestions}
          helper="Risco alto"
        />
        <MetricCard icon={FileText} label="Documentos" value={uploads.length} helper="Excel/PDF" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upload de provas e resultados</CardTitle>
            <CardDescription>
              PDF no formato “Análise Detalhada da Prova” gera estatísticas por prova. Excel/CSV gera diagnóstico por turma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-background p-6 text-center transition-colors hover:bg-muted">
              <Upload className="h-8 w-8 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">
                  Carregar prova PDF, planilha de respostas ou CSV
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PDF das provas IDEA ou planilhas com turma, aluno, questão, resposta, gabarito, acerto.
                </p>
              </div>
              <Input
                accept=".xlsx,.csv,.pdf"
                className="hidden"
                disabled={isUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadFile(file);
                  }
                }}
                type="file"
              />
            </label>

            {notice ? (
              <div className="rounded-lg border bg-muted p-3 text-sm text-muted-foreground">
                {notice}
              </div>
            ) : null}

            <Button disabled={isUploading} onClick={loadExampleExams} variant="outline">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Carregar exemplos da pasta provas
            </Button>

            <div className="space-y-2">
              {uploads.slice(0, 3).map((document) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3" key={document.id}>
                  <div className="flex min-w-0 items-center gap-3">
                    {document.fileType === "pdf" ? (
                      <FileText className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{document.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {document.importedResponses} respostas · {document.classNames.join(", ")}
                      </p>
                    </div>
                  </div>
                  <Badge variant={document.status === "pendente_configuracao" ? "warning" : "success"}>
                    {document.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Turma em análise</CardTitle>
            <CardDescription>
              Selecione uma turma para revisar estatísticas, questões críticas e jornada publicada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {diagnostics.map((diagnostic) => (
                <Button
                  className="h-auto justify-start p-4"
                  key={diagnostic.className}
                  onClick={() => {
                    setSelectedClass(diagnostic.className);
                    setSelectedQuestionIds(diagnostic.topProblemQuestionIds.slice(0, 4));
                  }}
                  variant={selectedClass === diagnostic.className ? "default" : "outline"}
                >
                  <div className="text-left">
                    <p className="font-semibold">{diagnostic.className}</p>
                    <p className="text-xs opacity-80">
                      {diagnostic.totalStudents} alunos · {formatPercent(diagnostic.averageAccuracy)} acerto
                    </p>
                  </div>
                </Button>
              ))}
            </div>
            {currentJourney ? (
              <div className="rounded-lg border bg-background p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{currentJourney.title}</p>
                  <Badge variant="success">Publicada</Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {currentJourney.questionIds.length} questões · 3 macros de aprendizagem.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-2 rounded-lg border bg-card p-1 sm:grid-cols-4">
        <TabButton active={tab === "provas"} icon={ClipboardList} label="Provas" onClick={() => setTab("provas")} />
        <TabButton active={tab === "diagnostico"} icon={BarChart3} label="Diagnóstico" onClick={() => setTab("diagnostico")} />
        <TabButton active={tab === "questoes"} icon={LibraryBig} label="Questões" onClick={() => setTab("questoes")} />
        <TabButton active={tab === "jornada"} icon={Sparkles} label="Jornada" onClick={() => setTab("jornada")} />
      </div>

      {tab === "provas" ? (
        <ExamAnalysisPanel
          analyses={examAnalyses}
          onSelectQuestion={(questionId) => {
            toggleQuestion(questionId);
            setTab("jornada");
          }}
        />
      ) : null}

      {tab === "diagnostico" && currentDiagnostic ? (
        <DiagnosticsPanel diagnostic={currentDiagnostic} questions={questions} />
      ) : null}

      {tab === "questoes" && currentDiagnostic ? (
        <QuestionBuilderPanel
          diagnostic={currentDiagnostic}
          onDraftChange={setQuestionDraft}
          onSaveQuestion={saveQuestionDraft}
          onToggleQuestion={toggleQuestion}
          questionDraft={questionDraft}
          questions={questions}
          selectedQuestionIds={selectedQuestionIds}
        />
      ) : null}

      {tab === "jornada" && currentDiagnostic ? (
        <JourneyBuilderPanel
          diagnostic={currentDiagnostic}
          journey={currentJourney}
          onGenerateJourney={generateJourney}
          onToggleQuestion={toggleQuestion}
          questions={questions}
          selectedQuestionIds={selectedQuestionIds}
        />
      ) : null}
    </div>
  );
}

function ExamAnalysisPanel({
  analyses,
  onSelectQuestion,
}: {
  analyses: ExamAnalysis[];
  onSelectQuestion: (questionId: string) => void;
}) {
  const [selectedExamId, setSelectedExamId] = useState(analyses[0]?.id ?? "");
  const selectedExam = analyses.find((analysis) => analysis.id === selectedExamId) ?? analyses[0];
  const allQuestions = analyses.flatMap((analysis) =>
    analysis.questions.map((question) => ({
      ...question,
      examTitle: analysis.title,
    })),
  );
  const criticalQuestions = [...allQuestions]
    .sort((a, b) => {
      if (riskWeight(b.strategicRisk) !== riskWeight(a.strategicRisk)) {
        return riskWeight(b.strategicRisk) - riskWeight(a.strategicRisk);
      }

      return b.dispersionRate - a.dispersionRate;
    })
    .slice(0, 8);

  if (!analyses.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de provas</CardTitle>
          <CardDescription>
            Envie um PDF de “Análise Detalhada da Prova” ou carregue os exemplos da pasta `provas`.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-background p-5 text-sm leading-6 text-muted-foreground">
            Depois do upload, esta área mostra ranking de questões críticas, distribuição por alternativa,
            dispersão de respostas, sínteses estratégicas e candidatos para a jornada de aprendizagem.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ClipboardList} label="Provas analisadas" value={analyses.length} helper="PDFs IDEA" />
        <MetricCard
          icon={LibraryBig}
          label="Questões analisadas"
          value={allQuestions.length}
          helper="Com distribuição"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Críticas"
          value={allQuestions.filter((question) => question.strategicRisk === "alto").length}
          helper="Baixa convergência"
        />
        <MetricCard
          icon={BarChart3}
          label="Dispersão média"
          value={formatPercent(
            analyses.length
              ? Math.round(
                  analyses.reduce((sum, analysis) => sum + analysis.averageDispersionRate, 0) /
                    analyses.length,
                )
              : 0,
          )}
          helper="Todas as provas"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Síntese estratégica</CardTitle>
            <CardDescription>
              Leituras rápidas para decidir o que vira exploração, flashcard e novo simulado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyses.flatMap((analysis) =>
              analysis.insights.map((insight) => (
                <div className="rounded-lg border bg-background p-4" key={`${analysis.id}-${insight.id}`}>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant={riskVariant[insight.severity]}>Risco {insight.severity}</Badge>
                    <Badge variant="neutral">{analysis.classLabel}</Badge>
                  </div>
                  <h3 className="text-sm font-semibold">{insight.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {insight.description}
                  </p>
                  {insight.questionIds.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {insight.questionIds.slice(0, 6).map((questionId) => (
                        <Badge key={questionId} variant="info">
                          {questionId}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              )),
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ranking de questões para jornada</CardTitle>
            <CardDescription>
              Ordenado por risco, dispersão e baixa concentração de respostas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalQuestions.map((question) => (
              <div className="rounded-lg border bg-background p-4" key={`${question.examTitle}-${question.id}`}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{question.id}</Badge>
                  <Badge variant={riskVariant[question.strategicRisk]}>
                    Risco {question.strategicRisk}
                  </Badge>
                  <Badge variant="info">{question.examTitle}</Badge>
                </div>
                <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                  <div>
                    <h3 className="text-sm font-semibold">{question.title}</h3>
                    <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {question.prompt}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{question.insight}</p>
                  </div>
                  <div className="space-y-3">
                    <Progress
                      indicatorClassName={barTone(question.majorityRate)}
                      label={`Maioria ${question.majorityOption}`}
                      value={question.majorityRate}
                    />
                    <Progress
                      indicatorClassName="bg-rose-500"
                      label="Dispersão"
                      value={question.dispersionRate}
                    />
                    <Button onClick={() => onSelectQuestion(question.id)} size="sm" variant="outline">
                      Usar na jornada
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Provas carregadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analyses.map((analysis) => (
              <button
                className={cn(
                  "w-full rounded-lg border bg-background p-4 text-left transition-colors hover:bg-muted",
                  selectedExam?.id === analysis.id && "border-primary bg-primary/5",
                )}
                key={analysis.id}
                onClick={() => setSelectedExamId(analysis.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{analysis.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {analysis.totalQuestions} questões · {analysis.totalRespondents} respondentes
                    </p>
                  </div>
                  <Badge variant="warning">{formatPercent(analysis.averageDispersionRate)}</Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {selectedExam ? <ExamQuestionDistribution exam={selectedExam} /> : null}
      </section>
    </div>
  );
}

function ExamQuestionDistribution({ exam }: { exam: ExamAnalysis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por alternativa · {exam.classLabel}</CardTitle>
        <CardDescription>
          Gráfico de concentração por questão para encontrar distratores fortes e baixa convergência.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {exam.questions.map((question) => (
          <div className="rounded-lg border bg-background p-4" key={question.id}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="neutral">{question.number}</Badge>
              <Badge variant={riskVariant[question.strategicRisk]}>
                {question.facilityLabel}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {question.respondents} respondentes
              </span>
            </div>
            <p className="mb-3 text-sm font-semibold">{question.title}</p>
            <div className="grid gap-2">
              {question.optionStats.map((stat) => (
                <div className="grid grid-cols-[28px_1fr_74px] items-center gap-2" key={stat.optionId}>
                  <span className="text-xs font-semibold">{stat.optionId}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        stat.optionId === question.majorityOption ? "bg-primary" : "bg-sky-300",
                      )}
                      style={{ width: `${Math.max(2, stat.percentage)}%` }}
                    />
                  </div>
                  <span className="text-right text-xs text-muted-foreground">
                    {stat.percentage}% · {stat.count}/{stat.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DiagnosticsPanel({
  diagnostic,
  questions,
}: {
  diagnostic: ClassDiagnostic;
  questions: QuestionBankItem[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas por questão · {diagnostic.className}</CardTitle>
          <CardDescription>
            Erro, impacto, competência e UCs relacionadas para priorizar intervenção.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {diagnostic.byQuestion.map((questionDiagnostic) => {
            const question = questions.find((item) => item.id === questionDiagnostic.questionId);

            return (
              <div className="rounded-lg border bg-background p-4" key={questionDiagnostic.questionId}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{questionDiagnostic.questionId}</Badge>
                  <Badge variant={riskVariant[questionDiagnostic.risk]}>
                    Risco {questionDiagnostic.risk}
                  </Badge>
                  <Badge variant="info">{questionDiagnostic.competencyId}</Badge>
                </div>
                <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                  <div>
                    <h3 className="text-sm font-semibold">
                      {question?.title ?? questionDiagnostic.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {questionDiagnostic.object}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {questionDiagnostic.unitCodes.map((unitCode) => (
                        <Badge key={unitCode} variant="neutral">
                          {unitCode}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Progress
                      indicatorClassName={barTone(questionDiagnostic.accuracy)}
                      label="Acerto"
                      value={questionDiagnostic.accuracy}
                    />
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <MiniStat label="Tent." value={questionDiagnostic.attempts} />
                      <MiniStat label="Erro" value={`${questionDiagnostic.errorRate}%`} />
                      <MiniStat label="Impacto" value={questionDiagnostic.impactScore} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Métricas essenciais</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <MetricRow label="Alunos com respostas" value={diagnostic.totalStudents} />
            <MetricRow label="Questões respondidas" value={diagnostic.totalQuestions} />
            <MetricRow label="Taxa de conclusão" value={formatPercent(diagnostic.completionRate)} />
            <MetricRow label="Mediana por questão" value={formatPercent(diagnostic.medianQuestionAccuracy)} />
            <MetricRow label="Questões de alto risco" value={diagnostic.highRiskQuestionCount} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competências e UCs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnostic.byCompetency.map((group) => (
              <Progress
                indicatorClassName={barTone(group.accuracy)}
                key={group.id}
                label={`${group.id} · ${group.attempts} respostas`}
                value={group.accuracy}
              />
            ))}
            <div className="space-y-2">
              {diagnostic.byUnit.slice(0, 6).map((group) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3" key={group.id}>
                  <span className="text-sm font-medium">{group.id}</span>
                  <Badge variant={riskVariant[group.risk]}>{formatPercent(group.accuracy)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuestionBuilderPanel({
  diagnostic,
  onDraftChange,
  onSaveQuestion,
  onToggleQuestion,
  questionDraft,
  questions,
  selectedQuestionIds,
}: {
  diagnostic: ClassDiagnostic;
  onDraftChange: (question: QuestionBankItem) => void;
  onSaveQuestion: () => void;
  onToggleQuestion: (questionId: string) => void;
  questionDraft: QuestionBankItem;
  questions: QuestionBankItem[];
  selectedQuestionIds: string[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>Selecionar questões da jornada</CardTitle>
          <CardDescription>
            Questões de maior erro aparecem primeiro para acelerar a decisão do gestor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {diagnostic.byQuestion
            .slice()
            .sort((a, b) => b.impactScore - a.impactScore)
            .map((item) => {
              const question = questions.find((candidate) => candidate.id === item.questionId);
              const selected = selectedQuestionIds.includes(item.questionId);

              return (
                <div
                  className={cn(
                    "rounded-lg border bg-background p-4 transition-colors",
                    selected && "border-primary bg-primary/5",
                  )}
                  key={item.questionId}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="neutral">{item.questionId}</Badge>
                        <Badge variant={riskVariant[item.risk]}>{formatPercent(item.accuracy)}</Badge>
                        <Badge variant="info">{item.competencyId}</Badge>
                      </div>
                      <h3 className="text-sm font-semibold">{question?.title ?? item.title}</h3>
                      <p className="text-sm leading-6 text-muted-foreground">{item.object}</p>
                    </div>
                    <Button onClick={() => onToggleQuestion(item.questionId)} size="sm" variant={selected ? "default" : "outline"}>
                      {selected ? "Selecionada" : "Selecionar"}
                    </Button>
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Criar ou editar questão</CardTitle>
          <CardDescription>
            O gestor pode corrigir enunciado, alternativas, explicação e flashcard antes de publicar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="ID">
              <Input
                value={questionDraft.id}
                onChange={(event) => onDraftChange({ ...questionDraft, id: event.target.value })}
              />
            </Field>
            <Field label="Título">
              <Input
                value={questionDraft.title}
                onChange={(event) =>
                  onDraftChange({ ...questionDraft, title: event.target.value })
                }
              />
            </Field>
          </div>
          <Field label="Enunciado">
            <Textarea
              value={questionDraft.prompt}
              onChange={(event) =>
                onDraftChange({ ...questionDraft, prompt: event.target.value })
              }
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Competência">
              <select
                className="h-10 w-full rounded-lg border bg-card px-3 text-sm"
                value={questionDraft.competencyId}
                onChange={(event) =>
                  onDraftChange({
                    ...questionDraft,
                    competencyId: event.target.value === "C1" ? "C1" : "C2",
                  })
                }
              >
                {enadeCompetencies.map((competency) => (
                  <option key={competency.id} value={competency.id}>
                    {competency.id}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="UCs">
              <Input
                value={questionDraft.unitCodes.join(", ")}
                onChange={(event) =>
                  onDraftChange({
                    ...questionDraft,
                    unitCodes: event.target.value
                      .split(",")
                      .map((unitCode) => unitCode.trim().toUpperCase())
                      .filter(Boolean),
                  })
                }
              />
            </Field>
            <Field label="Gabarito">
              <select
                className="h-10 w-full rounded-lg border bg-card px-3 text-sm"
                value={questionDraft.correctOption}
                onChange={(event) =>
                  onDraftChange({
                    ...questionDraft,
                    correctOption: event.target.value as QuestionOption["id"],
                  })
                }
              >
                {["A", "B", "C", "D", "E"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Explicação">
            <Textarea
              value={questionDraft.explanation}
              onChange={(event) =>
                onDraftChange({ ...questionDraft, explanation: event.target.value })
              }
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Frente do flashcard">
              <Textarea
                value={questionDraft.flashcardFront}
                onChange={(event) =>
                  onDraftChange({ ...questionDraft, flashcardFront: event.target.value })
                }
              />
            </Field>
            <Field label="Verso do flashcard">
              <Textarea
                value={questionDraft.flashcardBack}
                onChange={(event) =>
                  onDraftChange({ ...questionDraft, flashcardBack: event.target.value })
                }
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onSaveQuestion}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Salvar questão
            </Button>
            <Button
              onClick={() => onDraftChange({ ...defaultQuestionDraft, id: `Q${questions.length + 1}` })}
              variant="outline"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova
            </Button>
          </div>

          <div className="space-y-2">
            {questions.slice(0, 5).map((question) => (
              <button
                className="flex w-full items-center justify-between gap-3 rounded-lg border bg-background p-3 text-left text-sm hover:bg-muted"
                key={question.id}
                onClick={() => onDraftChange(question)}
                type="button"
              >
                <span>
                  <span className="font-semibold">{question.id}</span> · {question.title}
                </span>
                <Pencil className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function JourneyBuilderPanel({
  diagnostic,
  journey,
  onGenerateJourney,
  onToggleQuestion,
  questions,
  selectedQuestionIds,
}: {
  diagnostic: ClassDiagnostic;
  journey?: LearningJourney;
  onGenerateJourney: () => void;
  onToggleQuestion: (questionId: string) => void;
  questions: QuestionBankItem[];
  selectedQuestionIds: string[];
}) {
  const selectedQuestions = selectedQuestionIds
    .map((questionId) => questions.find((question) => question.id === questionId))
    .filter((question): question is QuestionBankItem => Boolean(question));

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Publicar jornada por turma</CardTitle>
          <CardDescription>
            A jornada usa somente questões selecionadas pelo gestor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-background p-4">
            <p className="text-sm font-semibold">{diagnostic.className}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {selectedQuestionIds.length} questões selecionadas para 3 macros.
            </p>
          </div>
          <Button className="w-full" onClick={onGenerateJourney}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Gerar jornada de aprendizagem
          </Button>
          {journey ? (
            <div className="space-y-3">
              {journey.macros.map((macro) => (
                <div className="rounded-lg border bg-background p-4" key={macro.id}>
                  <Badge variant="info">{macro.weekLabel}</Badge>
                  <h3 className="mt-2 text-sm font-semibold">{macro.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{macro.subtitle}</p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questões da jornada</CardTitle>
          <CardDescription>
            Revise a composição antes de publicar para os alunos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedQuestions.map((question) => {
            const stats = diagnostic.byQuestion.find((item) => item.questionId === question.id);

            return (
              <div className="rounded-lg border bg-background p-4" key={question.id}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{question.id}</Badge>
                  <Badge variant={riskVariant[stats?.risk ?? question.difficulty]}>
                    {stats ? formatPercent(stats.accuracy) : "Nova"}
                  </Badge>
                  <Badge variant="info">{question.competencyId}</Badge>
                </div>
                <h3 className="text-sm font-semibold">{question.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{question.prompt}</p>
                <Button
                  className="mt-3"
                  onClick={() => onToggleQuestion(question.id)}
                  size="sm"
                  variant="outline"
                >
                  Remover
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function StudentLearningJourney({
  diagnostics,
  journeys,
  questions,
}: {
  diagnostics: ClassDiagnostic[];
  journeys: LearningJourney[];
  questions: QuestionBankItem[];
}) {
  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState(journeys[0]?.className ?? "");
  const [started, setStarted] = useState(false);
  const [macroIndex, setMacroIndex] = useState(0);
  const [tourIndex, setTourIndex] = useState(0);
  const [flashcardQueue, setFlashcardQueue] = useState<string[]>([]);
  const [showFlashcardBack, setShowFlashcardBack] = useState(false);
  const [learnedQuestionIds, setLearnedQuestionIds] = useState<string[]>([]);
  const [simulationAnswers, setSimulationAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  const journey = journeys.find((item) => item.className === className) ?? journeys[0];
  const diagnostic = diagnostics.find((item) => item.className === className) ?? diagnostics[0];
  const activeMacro = journey?.macros[macroIndex];
  const journeyQuestions =
    journey?.questionIds
      .map((questionId) => questions.find((question) => question.id === questionId))
      .filter((question): question is QuestionBankItem => Boolean(question)) ?? [];
  const currentTourQuestion = journeyQuestions[tourIndex];
  const currentFlashcard = questions.find((question) => question.id === flashcardQueue[0]);
  const simulationScore = journeyQuestions.filter(
    (question) => simulationAnswers[question.id] === question.correctOption,
  ).length;

  function startJourney() {
    setStarted(true);
    setMacroIndex(0);
    setTourIndex(0);
    setFlashcardQueue(journey?.questionIds ?? []);
    setLearnedQuestionIds([]);
    setSimulationAnswers({});
    setCompleted(false);
  }

  async function persistProgress(nextCompleted: boolean) {
    if (!journey) {
      return;
    }

    const progress: StudentJourneyProgress = {
      studentName,
      className,
      currentMacro: activeMacro?.id ?? "simulado",
      exploredQuestionIds: journey.questionIds.slice(0, tourIndex + 1),
      learnedQuestionIds,
      pendingFlashcardIds: flashcardQueue,
      simulationAnswers,
      completed: nextCompleted,
    };

    await saveStudentProgress(progress);
  }

  if (!journey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhuma jornada publicada</CardTitle>
          <CardDescription>
            O gestor precisa publicar uma jornada para que os alunos iniciem.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!started) {
    return (
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Identificação do aluno</CardTitle>
            <CardDescription>
              Informe nome e turma para iniciar a trilha preparada pelo gestor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nome do aluno">
              <Input value={studentName} onChange={(event) => setStudentName(event.target.value)} />
            </Field>
            <Field label="Turma">
              <select
                className="h-10 w-full rounded-lg border bg-card px-3 text-sm"
                value={className}
                onChange={(event) => setClassName(event.target.value)}
              >
                {journeys.map((item) => (
                  <option key={item.id} value={item.className}>
                    {item.className}
                  </option>
                ))}
              </select>
            </Field>
            <Button disabled={!studentName || !className} onClick={startJourney}>
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              Iniciar jornada
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trilha da turma</CardTitle>
            <CardDescription>{journey.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {journey.macros.map((macro) => (
              <div className="rounded-lg border bg-background p-4" key={macro.id}>
                <Badge variant="info">{macro.weekLabel}</Badge>
                <h3 className="mt-2 text-sm font-semibold">{macro.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{macro.subtitle}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        {journey.macros.map((macro, index) => (
          <div
            className={cn(
              "rounded-lg border bg-card p-4",
              index === macroIndex && "border-primary bg-primary/5",
            )}
            key={macro.id}
          >
            <Badge variant={index < macroIndex ? "success" : index === macroIndex ? "info" : "neutral"}>
              {macro.weekLabel}
            </Badge>
            <h2 className="mt-2 text-sm font-semibold">{macro.title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{macro.subtitle}</p>
          </div>
        ))}
      </section>

      {activeMacro?.id === "exploracao" && currentTourQuestion ? (
        <Card>
          <CardHeader>
            <CardTitle>Macro 1 · exploração das questões</CardTitle>
            <CardDescription>
              Tour guiado pelos maiores problemas da turma antes do estudo ativo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="neutral">{currentTourQuestion.id}</Badge>
                <Badge variant="info">{currentTourQuestion.competencyId}</Badge>
                {currentTourQuestion.unitCodes.map((unitCode) => (
                  <Badge key={unitCode} variant="neutral">
                    {unitCode}
                  </Badge>
                ))}
              </div>
              <h2 className="text-xl font-semibold">{currentTourQuestion.title}</h2>
              <p className="text-base leading-8 text-muted-foreground">{currentTourQuestion.prompt}</p>
              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm font-semibold">Explicação orientada</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {currentTourQuestion.explanation}
                </p>
              </div>
              <Button
                onClick={() => {
                  if (tourIndex + 1 >= journeyQuestions.length) {
                    setMacroIndex(1);
                  } else {
                    setTourIndex((current) => current + 1);
                  }
                }}
              >
                Entendi
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <ProblemStats diagnostic={diagnostic} questionId={currentTourQuestion.id} />
          </CardContent>
        </Card>
      ) : null}

      {activeMacro?.id === "flashcards" ? (
        <Card>
          <CardHeader>
            <CardTitle>Macro 2 · flashcards de aprendizagem</CardTitle>
            <CardDescription>
              Memória espaçada: marque como aprendido ou devolva para a fila.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Progress
              indicatorClassName="bg-emerald-600"
              label="Flashcards aprendidos"
              value={
                journey.questionIds.length
                  ? Math.round((learnedQuestionIds.length / journey.questionIds.length) * 100)
                  : 0
              }
            />
            {currentFlashcard ? (
              <div className="rounded-lg border bg-background p-6">
                <Badge variant="info">{currentFlashcard.id}</Badge>
                <h2 className="mt-4 text-2xl font-semibold">
                  {showFlashcardBack
                    ? currentFlashcard.flashcardBack
                    : currentFlashcard.flashcardFront}
                </h2>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button onClick={() => setShowFlashcardBack((current) => !current)} variant="outline">
                    Virar card
                  </Button>
                  <Button
                    onClick={() => {
                      setLearnedQuestionIds((current) => [...current, currentFlashcard.id]);
                      setFlashcardQueue((current) => current.slice(1));
                      setShowFlashcardBack(false);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Aprendi
                  </Button>
                  <Button
                    onClick={() => {
                      setFlashcardQueue((current) =>
                        current.length > 1 ? [...current.slice(1), current[0]] : current,
                      );
                      setShowFlashcardBack(false);
                    }}
                    variant="outline"
                  >
                    Ainda não
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-emerald-50 p-5 text-emerald-800">
                Flashcards concluídos. Você já pode avançar para o novo simulado.
              </div>
            )}
            <Button disabled={Boolean(currentFlashcard)} onClick={() => setMacroIndex(2)}>
              Avançar para simulado
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {activeMacro?.id === "simulado" ? (
        <Card>
          <CardHeader>
            <CardTitle>Macro 3 · novo simulado preparatório</CardTitle>
            <CardDescription>
              Responda as questões da jornada para concluir o ciclo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {journeyQuestions.map((question) => (
              <div className="rounded-lg border bg-background p-4" key={question.id}>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant="neutral">{question.id}</Badge>
                  <Badge variant="info">{question.competencyId}</Badge>
                </div>
                <h3 className="text-sm font-semibold">{question.prompt}</h3>
                <div className="mt-4 grid gap-2">
                  {question.options.map((option) => (
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 text-sm",
                        simulationAnswers[question.id] === option.id && "border-primary bg-primary/5",
                      )}
                      key={option.id}
                    >
                      <input
                        checked={simulationAnswers[question.id] === option.id}
                        className="mt-1"
                        name={question.id}
                        onChange={() =>
                          setSimulationAnswers((current) => ({
                            ...current,
                            [question.id]: option.id,
                          }))
                        }
                        type="radio"
                      />
                      <span>
                        <span className="font-semibold">{option.id}.</span> {option.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <Button
              disabled={Object.keys(simulationAnswers).length < journeyQuestions.length}
              onClick={() => {
                setCompleted(true);
                void persistProgress(true);
              }}
            >
              <Trophy className="h-4 w-4" aria-hidden="true" />
              Concluir jornada
            </Button>
            {completed ? (
              <div className="rounded-lg border bg-emerald-50 p-5 text-emerald-800">
                Jornada concluída: {simulationScore}/{journeyQuestions.length} acertos no novo simulado.
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ProblemStats({
  diagnostic,
  questionId,
}: {
  diagnostic?: ClassDiagnostic;
  questionId: string;
}) {
  const stats = diagnostic?.byQuestion.find((item) => item.questionId === questionId);

  if (!stats) {
    return (
      <div className="rounded-lg border bg-background p-4">
        <p className="text-sm text-muted-foreground">Sem estatística importada para esta questão.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm font-semibold">Índice da turma</p>
      <div className="mt-4 space-y-4">
        <Progress indicatorClassName={barTone(stats.accuracy)} label="Acerto" value={stats.accuracy} />
        <MetricRow label="Erro" value={formatPercent(stats.errorRate)} />
        <MetricRow label="Tentativas" value={stats.attempts} />
        <MetricRow label="Impacto" value={stats.impactScore} />
      </div>
    </div>
  );
}

function FeaturePill({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium">
      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
      {text}
    </div>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button onClick={onClick} variant={active ? "default" : "ghost"}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}

function MetricCard({
  helper,
  icon: Icon,
  label,
  value,
}: {
  helper: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <p className="font-semibold text-foreground">{value}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function barTone(value: number) {
  if (value < 55) {
    return "bg-rose-500";
  }

  if (value < 70) {
    return "bg-amber-500";
  }

  return "bg-emerald-500";
}

function riskWeight(risk: RiskLevel) {
  if (risk === "alto") {
    return 3;
  }

  if (risk === "medio") {
    return 2;
  }

  return 1;
}
