"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
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
  enadeCompetencies,
  questionBank,
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
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [questions, setQuestions] = useState<QuestionBankItem[]>(questionBank);
  const [journeys, setJourneys] = useState<LearningJourney[]>([]);
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
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-semibold">
                {session.role === "gestor" ? "Workspace Gestor" : "Jornada do Aluno"}
              </h1>
              <p className="text-xs text-muted-foreground">ENADE 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={session.demo ? "warning" : "success"} className="hidden sm:flex">
              {session.demo ? "Demo" : "Firebase"}
            </Badge>
            <span className="hidden text-sm text-muted-foreground sm:block">{session.name}</span>
            <Button
              onClick={async () => {
                if (!session.demo && isFirebaseConfigured()) {
                  await logoutFirebaseUser();
                }
                setSession(null);
              }}
              size="sm"
              variant="ghost"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        {session.role === "gestor" ? (
          <ManagerWorkspace
            diagnostics={diagnostics}
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
            diagnostics={diagnostics}
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
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>("gestor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firebaseReady = isFirebaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    if (isSignUp && password !== confirmPassword) {
      setMessage("As senhas nao coincidem.");
      setIsSubmitting(false);
      return;
    }

    if (isSignUp && password.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (!firebaseReady) {
        onAuthenticated({ role, name: name || "Usuario", email, demo: true });
        return;
      }

      const user = isSignUp
        ? await createPasswordAccount(email, password)
        : await signInWithPassword(email, password);

      onAuthenticated({
        role,
        name: user.displayName ?? (name || "Usuario"),
        email: user.email ?? email,
        demo: false,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro na autenticacao.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function authenticateWithGoogle() {
    setIsSubmitting(true);
    setMessage("");

    try {
      if (!firebaseReady) {
        setMessage("Configure o Firebase para login com Google.");
        return;
      }

      const user = await signInWithGooglePopup();

      onAuthenticated({
        role,
        name: user.displayName ?? (name || "Usuario"),
        email: user.email ?? email,
        demo: false,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro no login Google.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDemo() {
    onAuthenticated({ role, name: name || "Usuario Demo", email: email || "demo@local", demo: true });
  }

  function switchMode() {
    setIsSignUp(!isSignUp);
    setMessage("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">
            {isSignUp ? "Criar Conta" : "Entrar"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Preencha os dados para criar sua conta"
              : "Sistema de diagnostico e jornada de aprendizagem"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-1">
              <Button
                onClick={() => setRole("gestor")}
                type="button"
                variant={role === "gestor" ? "default" : "ghost"}
                size="sm"
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                Gestor
              </Button>
              <Button
                onClick={() => setRole("aluno")}
                type="button"
                variant={role === "aluno" ? "default" : "ghost"}
                size="sm"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Aluno
              </Button>
            </div>

            <div className="space-y-3">
              {isSignUp && (
                <Input
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              )}
              <Input
                placeholder="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                placeholder="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {isSignUp && (
                <Input
                  placeholder="Confirmar senha"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              )}
            </div>

            {message && <p className="text-sm text-destructive">{message}</p>}

            {!firebaseReady && (
              <p className="text-xs text-muted-foreground">
                Configure NEXT_PUBLIC_FIREBASE_* para autenticar via Firebase.
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <Lock className="h-4 w-4" aria-hidden="true" />
              {isSignUp ? "Criar conta" : "Entrar"}
            </Button>

            {!isSignUp && (
              <Button
                type="button"
                disabled={isSubmitting || !firebaseReady}
                onClick={authenticateWithGoogle}
                variant="outline"
                className="w-full"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Entrar com Google
              </Button>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={isSubmitting}
              onClick={handleDemo}
              variant="ghost"
            >
              Modo Demonstracao
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? "Ja tem uma conta?" : "Nao tem uma conta?"}{" "}
              <button
                type="button"
                onClick={switchMode}
                className="font-medium text-primary hover:underline"
              >
                {isSignUp ? "Entrar" : "Criar conta"}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
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
  const [selectedClass, setSelectedClass] = useState(diagnostics[0]?.className ?? "");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [tab, setTab] = useState<ManagerTab>("provas");
  const [notice, setNotice] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [questionDraft, setQuestionDraft] = useState<QuestionBankItem>(defaultQuestionDraft);

  const currentDiagnostic = diagnostics.find((d) => d.className === selectedClass);
  const currentJourney = journeys.find((j) => j.className === selectedClass);

  const averageAccuracy = diagnostics.length
    ? Math.round(diagnostics.reduce((sum, d) => sum + d.averageAccuracy, 0) / diagnostics.length)
    : 0;
  const totalStudents = diagnostics.reduce((sum, d) => sum + d.totalStudents, 0);
  const highRiskQuestions = diagnostics.reduce((sum, d) => sum + d.highRiskQuestionCount, 0);

  async function uploadFile(file: File) {
    setIsUploading(true);
    setNotice("");

    try {
      let blobUrl: string | undefined;
      let importedResponses: AssessmentResponse[] = [];
      const extension = file.name.split(".").pop()?.toLowerCase();
      const fileType = extension === "pdf" ? "pdf" : extension === "csv" ? "csv" : "excel";

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

      const classNames = Array.from(new Set(importedResponses.map((r) => r.className)));
      const importedQuestionIds = Array.from(new Set(importedResponses.map((r) => r.questionId)));
      const placeholderQuestions = importedQuestionIds
        .filter((id) => !questions.some((q) => q.id === id))
        .map((id): QuestionBankItem => ({
          ...defaultQuestionDraft,
          id,
          title: `Questao ${id}`,
          prompt: "Enunciado pendente de edicao.",
          object: "Objeto importado",
          explanation: "Explicacao pendente.",
          flashcardFront: `Qual conceito resolve ${id}?`,
          flashcardBack: "Revisar.",
          correctOption: "A",
        }));

      const nextQuestions = [...questions, ...placeholderQuestions];
      const nextResponses = [...responses, ...importedResponses];
      const nextDiagnostics = buildDiagnosticsByClass(nextResponses, nextQuestions);

      const document: UploadedDocument = {
        id: `upload-${file.name}-${uploads.length + 1}`.replace(/\W+/g, "-"),
        fileName: file.name,
        fileType,
        classNames: classNames.length ? classNames : [selectedClass || "Turma"],
        uploadedAt: new Date().toISOString(),
        blobUrl,
        status: blobUrl ? "processado" : "pendente_configuracao",
        importedResponses: importedResponses.length,
      };

      onQuestionsChange(nextQuestions);
      onResponsesChange(nextResponses);
      onUploadsChange([document, ...uploads]);

      if (classNames.length && !selectedClass) {
        setSelectedClass(classNames[0]);
      }

      await saveUploadedDocument(document);
      await Promise.all(nextDiagnostics.map(saveClassDiagnostic));

      setNotice(
        importedResponses.length
          ? `${importedResponses.length} respostas importadas de ${classNames.length} turma(s).`
          : "Documento armazenado."
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Erro ao processar arquivo.");
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
      throw new Error(payload.error ?? "Erro ao analisar prova.");
    }

    const importedQuestions = examQuestionsToQuestionBankItems(
      payload.analysis,
      questions.map((q) => q.id),
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
      `${payload.analysis.totalQuestions} questoes analisadas. ${importedQuestions.length} adicionadas ao banco.`
    );
  }

  async function loadExampleExams() {
    setIsUploading(true);
    setNotice("");

    try {
      const response = await fetch("/api/provas/examples");
      const payload = (await response.json()) as { analyses?: ExamAnalysis[]; error?: string };

      if (!response.ok || !payload.analyses) {
        throw new Error(payload.error ?? "Erro ao carregar exemplos.");
      }

      const existingIds = new Set(examAnalyses.map((a) => a.sourceFileName));
      const newAnalyses = payload.analyses.filter((a) => !existingIds.has(a.sourceFileName));
      const importedQuestions = newAnalyses.flatMap((a) =>
        examQuestionsToQuestionBankItems(a, questions.map((q) => q.id)),
      );

      onExamAnalysesChange([...newAnalyses, ...examAnalyses]);
      onQuestionsChange([...questions, ...importedQuestions]);
      await Promise.all(newAnalyses.map(saveExamAnalysis));
      setTab("provas");
      setNotice(`${newAnalyses.length} provas carregadas com ${importedQuestions.length} questoes.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Erro ao carregar exemplos.");
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
      setNotice("Preencha ID, titulo e enunciado.");
      return;
    }

    const normalizedQuestion = {
      ...questionDraft,
      unitCodes: questionDraft.unitCodes.length ? questionDraft.unitCodes : ["UC"],
      flashcardFront: questionDraft.flashcardFront || `Conceito de ${questionDraft.title}?`,
      flashcardBack: questionDraft.flashcardBack || questionDraft.explanation || "Revisar.",
    };

    const nextQuestions = questions.some((q) => q.id === normalizedQuestion.id)
      ? questions.map((q) => (q.id === normalizedQuestion.id ? normalizedQuestion : q))
      : [normalizedQuestion, ...questions];

    onQuestionsChange(nextQuestions);
    await saveQuestion(normalizedQuestion);
    setQuestionDraft(defaultQuestionDraft);
    setNotice("Questao salva.");
  }

  async function generateJourney() {
    if (!selectedQuestionIds.length || !selectedClass) {
      setNotice("Selecione turma e questoes.");
      return;
    }

    const journey = createJourneyFromQuestionIds(selectedClass, selectedQuestionIds, questions);
    const nextJourneys = journeys.some((j) => j.className === selectedClass)
      ? journeys.map((j) => (j.className === selectedClass ? journey : j))
      : [journey, ...journeys];

    onJourneysChange(nextJourneys);
    await saveJourney(journey);
    setNotice(`Jornada publicada para ${selectedClass}.`);
  }

  const hasData = diagnostics.length > 0 || examAnalyses.length > 0;

  return (
    <div className="space-y-6">
      {/* Metricas resumidas */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={FileText}
          label="Provas"
          value={examAnalyses.length}
          helper={`${examAnalyses.reduce((s, a) => s + a.totalQuestions, 0)} questoes`}
        />
        <MetricCard
          icon={Users}
          label="Alunos"
          value={totalStudents}
          helper={`${diagnostics.length} turma(s)`}
        />
        <MetricCard
          icon={BarChart3}
          label="Acerto medio"
          value={hasData ? formatPercent(averageAccuracy) : "-"}
          helper="Dados importados"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Alto risco"
          value={highRiskQuestions}
          helper="Questoes criticas"
        />
      </section>

      {/* Upload e selecao de turma */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Upload de dados</CardTitle>
            <CardDescription>
              PDF de provas ou planilha Excel/CSV com respostas dos alunos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors hover:bg-muted/50">
              <Upload className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <span className="text-sm font-medium">Selecionar arquivo</span>
              <span className="text-xs text-muted-foreground">PDF, Excel ou CSV</span>
              <Input
                accept=".xlsx,.csv,.pdf"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadFile(file);
                }}
                type="file"
              />
            </label>

            {notice && (
              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">{notice}</p>
            )}

            <Button
              className="w-full"
              disabled={isUploading}
              onClick={loadExampleExams}
              variant="outline"
              size="sm"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Carregar provas de exemplo
            </Button>

            {uploads.length > 0 && (
              <div className="space-y-2">
                {uploads.slice(0, 3).map((doc) => (
                  <div
                    className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm"
                    key={doc.id}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {doc.fileType === "pdf" ? (
                        <FileText className="h-4 w-4 shrink-0 text-destructive" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
                      )}
                      <span className="truncate">{doc.fileName}</span>
                    </div>
                    <Badge variant={doc.status === "processado" ? "success" : "warning"}>
                      {doc.importedResponses || 0}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Turmas</CardTitle>
            <CardDescription>
              Selecione uma turma para ver diagnostico e criar jornada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {diagnostics.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Importe uma planilha de respostas para ver turmas.
              </p>
            ) : (
              <div className="grid gap-2">
                {diagnostics.map((d) => (
                  <button
                    key={d.className}
                    onClick={() => {
                      setSelectedClass(d.className);
                      setSelectedQuestionIds(d.topProblemQuestionIds.slice(0, 4));
                    }}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                      selectedClass === d.className && "border-primary bg-primary/5"
                    )}
                    type="button"
                  >
                    <div>
                      <p className="font-medium">{d.className}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.totalStudents} alunos
                      </p>
                    </div>
                    <Badge variant={d.averageAccuracy < 55 ? "danger" : d.averageAccuracy < 70 ? "warning" : "success"}>
                      {formatPercent(d.averageAccuracy)}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            {currentJourney && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{currentJourney.title}</span>
                  <Badge variant="success">Publicada</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {currentJourney.questionIds.length} questoes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
        <TabButton active={tab === "provas"} icon={FileText} label="Provas" onClick={() => setTab("provas")} />
        <TabButton active={tab === "diagnostico"} icon={BarChart3} label="Diagnostico" onClick={() => setTab("diagnostico")} />
        <TabButton active={tab === "questoes"} icon={LibraryBig} label="Questoes" onClick={() => setTab("questoes")} />
        <TabButton active={tab === "jornada"} icon={Sparkles} label="Jornada" onClick={() => setTab("jornada")} />
      </div>

      {/* Conteudo das tabs */}
      {tab === "provas" && (
        <ExamAnalysisPanel analyses={examAnalyses} onSelectQuestion={(id) => { toggleQuestion(id); setTab("jornada"); }} />
      )}

      {tab === "diagnostico" && currentDiagnostic && (
        <DiagnosticsPanel diagnostic={currentDiagnostic} questions={questions} />
      )}

      {tab === "diagnostico" && !currentDiagnostic && (
        <EmptyState message="Selecione uma turma ou importe dados para ver o diagnostico." />
      )}

      {tab === "questoes" && (
        <QuestionBuilderPanel
          diagnostic={currentDiagnostic}
          onDraftChange={setQuestionDraft}
          onSaveQuestion={saveQuestionDraft}
          onToggleQuestion={toggleQuestion}
          questionDraft={questionDraft}
          questions={questions}
          selectedQuestionIds={selectedQuestionIds}
        />
      )}

      {tab === "jornada" && (
        <JourneyBuilderPanel
          diagnostic={currentDiagnostic}
          journey={currentJourney}
          onGenerateJourney={generateJourney}
          onToggleQuestion={toggleQuestion}
          questions={questions}
          selectedQuestionIds={selectedQuestionIds}
        />
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
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
  const selectedExam = analyses.find((a) => a.id === selectedExamId) ?? analyses[0];

  const allQuestions = analyses.flatMap((a) =>
    a.questions.map((q) => ({ ...q, examTitle: a.title })),
  );

  const criticalQuestions = [...allQuestions]
    .sort((a, b) => {
      if (riskWeight(b.strategicRisk) !== riskWeight(a.strategicRisk)) {
        return riskWeight(b.strategicRisk) - riskWeight(a.strategicRisk);
      }
      return b.dispersionRate - a.dispersionRate;
    })
    .slice(0, 6);

  if (!analyses.length) {
    return <EmptyState message="Envie um PDF de prova ou carregue os exemplos para ver analises." />;
  }

  return (
    <div className="space-y-4">
      {/* Provas */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {analyses.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedExamId(a.id)}
            className={cn(
              "shrink-0 rounded-lg border px-4 py-2 text-left transition-colors hover:bg-muted/50",
              selectedExam?.id === a.id && "border-primary bg-primary/5"
            )}
            type="button"
          >
            <p className="text-sm font-medium">{a.title}</p>
            <p className="text-xs text-muted-foreground">{a.totalQuestions} questoes</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Questoes criticas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Questoes criticas</CardTitle>
            <CardDescription>Maior dispersao e baixa convergencia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {criticalQuestions.map((q) => (
              <div
                key={`${q.examTitle}-${q.id}`}
                className="flex items-center justify-between gap-2 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">{q.id}</Badge>
                    <Badge variant={riskVariant[q.strategicRisk]}>{q.strategicRisk}</Badge>
                  </div>
                  <p className="mt-1 truncate text-sm">{q.title}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => onSelectQuestion(q.id)}>
                  Usar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Distribuicao */}
        {selectedExam && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Distribuicao por alternativa</CardTitle>
              <CardDescription>{selectedExam.classLabel}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedExam.questions.slice(0, 4).map((q) => (
                <div key={q.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="neutral">{q.number}</Badge>
                    <Badge variant={riskVariant[q.strategicRisk]}>{q.facilityLabel}</Badge>
                  </div>
                  <div className="space-y-1">
                    {q.optionStats.map((s) => (
                      <div key={s.optionId} className="flex items-center gap-2 text-xs">
                        <span className="w-4 font-medium">{s.optionId}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              s.optionId === q.majorityOption ? "bg-primary" : "bg-muted-foreground/30"
                            )}
                            style={{ width: `${Math.max(2, s.percentage)}%` }}
                          />
                        </div>
                        <span className="w-10 text-right text-muted-foreground">{s.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
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
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Metricas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumo {diagnostic.className}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatRow label="Alunos" value={diagnostic.totalStudents} />
          <StatRow label="Questoes" value={diagnostic.totalQuestions} />
          <StatRow label="Acerto medio" value={formatPercent(diagnostic.averageAccuracy)} />
          <StatRow label="Mediana" value={formatPercent(diagnostic.medianQuestionAccuracy)} />
          <StatRow label="Alto risco" value={diagnostic.highRiskQuestionCount} />
        </CardContent>
      </Card>

      {/* Por competencia */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Por competencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {diagnostic.byCompetency.map((g) => (
            <div key={g.id}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span>{g.id}</span>
                <Badge variant={riskVariant[g.risk]}>{formatPercent(g.accuracy)}</Badge>
              </div>
              <Progress value={g.accuracy} indicatorClassName={barTone(g.accuracy)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Por UC */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Por unidade curricular</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {diagnostic.byUnit.slice(0, 6).map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
              <span>{g.id}</span>
              <Badge variant={riskVariant[g.risk]}>{formatPercent(g.accuracy)}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Por questao */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Desempenho por questao</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {diagnostic.byQuestion.map((q) => {
              const question = questions.find((item) => item.id === q.questionId);
              return (
                <div key={q.questionId} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="neutral">{q.questionId}</Badge>
                    <Badge variant={riskVariant[q.risk]}>{formatPercent(q.accuracy)}</Badge>
                    <Badge variant="info">{q.competencyId}</Badge>
                  </div>
                  <p className="text-sm font-medium">{question?.title || q.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{q.object}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
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
  diagnostic?: ClassDiagnostic;
  onDraftChange: (question: QuestionBankItem) => void;
  onSaveQuestion: () => void;
  onToggleQuestion: (questionId: string) => void;
  questionDraft: QuestionBankItem;
  questions: QuestionBankItem[];
  selectedQuestionIds: string[];
}) {
  const sortedQuestions = diagnostic
    ? [...diagnostic.byQuestion].sort((a, b) => b.impactScore - a.impactScore)
    : [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Lista de questoes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Selecionar para jornada</CardTitle>
          <CardDescription>
            {diagnostic ? `${sortedQuestions.length} questoes em ${diagnostic.className}` : "Banco de questoes"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {diagnostic ? (
            sortedQuestions.map((item) => {
              const question = questions.find((q) => q.id === item.questionId);
              const selected = selectedQuestionIds.includes(item.questionId);
              return (
                <div
                  key={item.questionId}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    selected && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="neutral">{item.questionId}</Badge>
                        <Badge variant={riskVariant[item.risk]}>{formatPercent(item.accuracy)}</Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium">{question?.title || item.title}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => onToggleQuestion(item.questionId)}
                    >
                      {selected ? "Remover" : "Adicionar"}
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            questions.slice(0, 8).map((q) => {
              const selected = selectedQuestionIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  className={cn(
                    "rounded-lg border p-3 transition-colors",
                    selected && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1">
                        <Badge variant="neutral">{q.id}</Badge>
                        <Badge variant="info">{q.competencyId}</Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium">{q.title}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => onToggleQuestion(q.id)}
                    >
                      {selected ? "Remover" : "Adicionar"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Editor de questao */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Criar ou editar questao</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="ID"
              value={questionDraft.id}
              onChange={(e) => onDraftChange({ ...questionDraft, id: e.target.value })}
            />
            <Input
              placeholder="Titulo"
              value={questionDraft.title}
              onChange={(e) => onDraftChange({ ...questionDraft, title: e.target.value })}
            />
          </div>
          <Textarea
            placeholder="Enunciado"
            value={questionDraft.prompt}
            onChange={(e) => onDraftChange({ ...questionDraft, prompt: e.target.value })}
            rows={3}
          />
          <div className="grid grid-cols-3 gap-2">
            <select
              className="h-9 rounded-lg border bg-background px-2 text-sm"
              value={questionDraft.competencyId}
              onChange={(e) =>
                onDraftChange({
                  ...questionDraft,
                  competencyId: e.target.value === "C1" ? "C1" : "C2",
                })
              }
            >
              {enadeCompetencies.map((c) => (
                <option key={c.id} value={c.id}>{c.id}</option>
              ))}
            </select>
            <Input
              placeholder="UCs (AMS, EDA)"
              value={questionDraft.unitCodes.join(", ")}
              onChange={(e) =>
                onDraftChange({
                  ...questionDraft,
                  unitCodes: e.target.value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean),
                })
              }
            />
            <select
              className="h-9 rounded-lg border bg-background px-2 text-sm"
              value={questionDraft.correctOption}
              onChange={(e) =>
                onDraftChange({
                  ...questionDraft,
                  correctOption: e.target.value as QuestionOption["id"],
                })
              }
            >
              {["A", "B", "C", "D", "E"].map((o) => (
                <option key={o} value={o}>Gabarito {o}</option>
              ))}
            </select>
          </div>
          <Textarea
            placeholder="Explicacao"
            value={questionDraft.explanation}
            onChange={(e) => onDraftChange({ ...questionDraft, explanation: e.target.value })}
            rows={2}
          />
          <div className="flex gap-2">
            <Button onClick={onSaveQuestion} className="flex-1">
              <Save className="h-4 w-4" /> Salvar
            </Button>
            <Button
              variant="outline"
              onClick={() => onDraftChange({ ...defaultQuestionDraft, id: `Q${questions.length + 1}` })}
            >
              <Plus className="h-4 w-4" /> Nova
            </Button>
          </div>

          {/* Lista para editar */}
          <div className="space-y-1 pt-2">
            {questions.slice(0, 5).map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => onDraftChange(q)}
                className="flex w-full items-center justify-between rounded-lg border p-2 text-left text-sm hover:bg-muted/50"
              >
                <span><strong>{q.id}</strong> - {q.title}</span>
                <Pencil className="h-3 w-3 text-muted-foreground" />
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
  diagnostic?: ClassDiagnostic;
  journey?: LearningJourney;
  onGenerateJourney: () => void;
  onToggleQuestion: (questionId: string) => void;
  questions: QuestionBankItem[];
  selectedQuestionIds: string[];
}) {
  const selectedQuestions = selectedQuestionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is QuestionBankItem => Boolean(q));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Configuracao */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Publicar jornada</CardTitle>
          <CardDescription>
            {diagnostic?.className || "Selecione uma turma"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-2xl font-semibold">{selectedQuestionIds.length}</p>
            <p className="text-sm text-muted-foreground">questoes selecionadas</p>
          </div>
          <Button
            className="w-full"
            onClick={onGenerateJourney}
            disabled={!selectedQuestionIds.length || !diagnostic}
          >
            <Sparkles className="h-4 w-4" /> Gerar jornada
          </Button>
          {journey && (
            <div className="space-y-2 pt-2">
              {journey.macros.map((m) => (
                <div key={m.id} className="rounded-lg border p-2">
                  <Badge variant="info" className="mb-1">{m.weekLabel}</Badge>
                  <p className="text-sm font-medium">{m.title}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questoes selecionadas */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Questoes da jornada</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedQuestions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Selecione questoes na aba Questoes ou Diagnostico.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {selectedQuestions.map((q) => {
                const stats = diagnostic?.byQuestion.find((item) => item.questionId === q.id);
                return (
                  <div key={q.id} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center gap-1">
                      <Badge variant="neutral">{q.id}</Badge>
                      <Badge variant={riskVariant[stats?.risk ?? q.difficulty]}>
                        {stats ? formatPercent(stats.accuracy) : q.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{q.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{q.prompt}</p>
                    <Button
                      className="mt-2"
                      size="sm"
                      variant="ghost"
                      onClick={() => onToggleQuestion(q.id)}
                    >
                      Remover
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
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

  const journey = journeys.find((j) => j.className === className) ?? journeys[0];
  const diagnostic = diagnostics.find((d) => d.className === className);
  const activeMacro = journey?.macros[macroIndex];

  const journeyQuestions =
    journey?.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter((q): q is QuestionBankItem => Boolean(q)) ?? [];

  const currentTourQuestion = journeyQuestions[tourIndex];
  const currentFlashcard = questions.find((q) => q.id === flashcardQueue[0]);
  const simulationScore = journeyQuestions.filter(
    (q) => simulationAnswers[q.id] === q.correctOption,
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
    if (!journey) return;
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
        <CardContent className="py-12 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium">Nenhuma jornada disponivel</p>
          <p className="mt-1 text-sm text-muted-foreground">
            O gestor precisa publicar uma jornada para sua turma.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BookOpen className="h-6 w-6" />
            </div>
            <CardTitle>Iniciar Jornada</CardTitle>
            <CardDescription>{journey.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Seu nome"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
            <select
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            >
              {journeys.map((j) => (
                <option key={j.id} value={j.className}>{j.className}</option>
              ))}
            </select>
            <Button
              className="w-full"
              disabled={!studentName || !className}
              onClick={startJourney}
            >
              <PlayCircle className="h-4 w-4" /> Comecar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex gap-2">
        {journey.macros.map((m, i) => (
          <div
            key={m.id}
            className={cn(
              "flex-1 rounded-lg border p-3 text-center transition-colors",
              i === macroIndex && "border-primary bg-primary/5",
              i < macroIndex && "bg-muted"
            )}
          >
            <p className="text-xs text-muted-foreground">{m.weekLabel}</p>
            <p className="text-sm font-medium">{m.title}</p>
          </div>
        ))}
      </div>

      {/* Macro 1: Exploracao */}
      {activeMacro?.id === "exploracao" && currentTourQuestion && (
        <Card>
          <CardHeader>
            <CardTitle>Exploracao</CardTitle>
            <CardDescription>
              Questao {tourIndex + 1} de {journeyQuestions.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">{currentTourQuestion.id}</Badge>
              <Badge variant="info">{currentTourQuestion.competencyId}</Badge>
              {currentTourQuestion.unitCodes.map((uc) => (
                <Badge key={uc} variant="neutral">{uc}</Badge>
              ))}
            </div>
            <h2 className="text-lg font-semibold">{currentTourQuestion.title}</h2>
            <p className="text-muted-foreground">{currentTourQuestion.prompt}</p>
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium">Explicacao</p>
              <p className="mt-1 text-sm text-muted-foreground">{currentTourQuestion.explanation}</p>
            </div>
            <Button
              onClick={() => {
                if (tourIndex + 1 >= journeyQuestions.length) {
                  setMacroIndex(1);
                } else {
                  setTourIndex((c) => c + 1);
                }
              }}
            >
              Entendi <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Macro 2: Flashcards */}
      {activeMacro?.id === "flashcards" && (
        <Card>
          <CardHeader>
            <CardTitle>Flashcards</CardTitle>
            <CardDescription>
              {learnedQuestionIds.length} de {journey.questionIds.length} aprendidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress
              value={journey.questionIds.length ? (learnedQuestionIds.length / journey.questionIds.length) * 100 : 0}
              indicatorClassName="bg-emerald-500"
            />
            {currentFlashcard ? (
              <div className="rounded-lg border p-6 text-center">
                <Badge variant="info" className="mb-4">{currentFlashcard.id}</Badge>
                <p className="text-xl font-semibold">
                  {showFlashcardBack ? currentFlashcard.flashcardBack : currentFlashcard.flashcardFront}
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <Button variant="outline" onClick={() => setShowFlashcardBack((c) => !c)}>
                    Virar
                  </Button>
                  <Button
                    onClick={() => {
                      setLearnedQuestionIds((c) => [...c, currentFlashcard.id]);
                      setFlashcardQueue((c) => c.slice(1));
                      setShowFlashcardBack(false);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Aprendi
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFlashcardQueue((c) => (c.length > 1 ? [...c.slice(1), c[0]] : c));
                      setShowFlashcardBack(false);
                    }}
                  >
                    Revisar depois
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border bg-emerald-50 p-6 text-center text-emerald-800">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8" />
                <p className="font-medium">Todos os flashcards concluidos!</p>
              </div>
            )}
            <Button
              className="w-full"
              disabled={Boolean(currentFlashcard)}
              onClick={() => setMacroIndex(2)}
            >
              Avancar para simulado <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Macro 3: Simulado */}
      {activeMacro?.id === "simulado" && (
        <Card>
          <CardHeader>
            <CardTitle>Simulado Final</CardTitle>
            <CardDescription>
              Responda as {journeyQuestions.length} questoes da jornada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {journeyQuestions.map((q) => (
              <div key={q.id} className="rounded-lg border p-4">
                <div className="mb-2 flex gap-2">
                  <Badge variant="neutral">{q.id}</Badge>
                  <Badge variant="info">{q.competencyId}</Badge>
                </div>
                <p className="font-medium">{q.prompt}</p>
                <div className="mt-3 space-y-2">
                  {q.options.map((o) => (
                    <label
                      key={o.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
                        simulationAnswers[q.id] === o.id && "border-primary bg-primary/5"
                      )}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={simulationAnswers[q.id] === o.id}
                        onChange={() => setSimulationAnswers((c) => ({ ...c, [q.id]: o.id }))}
                        className="mt-1"
                      />
                      <span className="text-sm">
                        <strong>{o.id}.</strong> {o.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <Button
              className="w-full"
              disabled={Object.keys(simulationAnswers).length < journeyQuestions.length}
              onClick={() => {
                setCompleted(true);
                void persistProgress(true);
              }}
            >
              <Trophy className="h-4 w-4" /> Concluir jornada
            </Button>
            {completed && (
              <div className="rounded-lg border bg-emerald-50 p-6 text-center text-emerald-800">
                <Trophy className="mx-auto mb-2 h-8 w-8" />
                <p className="text-lg font-semibold">Jornada concluida!</p>
                <p className="mt-1">
                  {simulationScore}/{journeyQuestions.length} acertos no simulado
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===== Componentes auxiliares =====

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
    <Button
      onClick={onClick}
      variant={active ? "default" : "ghost"}
      size="sm"
      className="flex-1"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
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
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function barTone(value: number) {
  if (value < 55) return "bg-rose-500";
  if (value < 70) return "bg-amber-500";
  return "bg-emerald-500";
}

function riskWeight(risk: RiskLevel) {
  if (risk === "alto") return 3;
  if (risk === "medio") return 2;
  return 1;
}
