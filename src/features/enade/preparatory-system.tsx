"use client";

import { useEffect, useMemo, useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Lightbulb,
  Lock,
  LogOut,
  Mail,
  PlayCircle,
  Save,
  Sparkles,
  Trophy,
  Upload,
  Users,
  X,
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
  completeGoogleRedirect,
  createPasswordAccount,
  logoutFirebaseUser,
  signInWithGooglePopup,
  startGoogleRedirect,
  signInWithPassword,
} from "@/lib/firebase/auth-service";
import {
  saveClassDiagnostic,
  saveExamAnalysis,
  saveJourney,
  saveStudentProgress,
  saveUploadedDocument,
} from "@/lib/firebase/firestore-service";
import { cn, formatPercent } from "@/lib/utils";
import {
  buildDiagnosticsByClass,
  createJourneyFromQuestionIds,
} from "./analytics";
import { questionBank } from "./data";
import { examQuestionsToQuestionBankItems } from "./exam-parser";
import { QuestionImageViewer } from "./question-image-viewer";
import { parseAssessmentSpreadsheet } from "./upload-parser";
import type {
  AssessmentResponse,
  ClassDiagnostic,
  ExamAnalysis,
  ExamQuestionAnalysis,
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
  className?: string;
};

type ManagerTab = "provas" | "diagnostico" | "jornada";

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
    return (
      <LoginScreen
        journeys={journeys}
        onAuthenticated={setSession}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">
                {session.role === "gestor" ? "Painel do Gestor" : "Minha Jornada"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {session.role === "aluno" && session.className ? session.className : "ENADE 2026"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={session.demo ? "warning" : "success"} className="hidden sm:flex">
              {session.demo ? "Demo" : "Online"}
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

      <div className="mx-auto w-full max-w-5xl px-4 py-6">
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
            selectedClassName={session.className}
            studentName={session.name}
          />
        )}
      </div>
    </main>
  );
}

function LoginScreen({
  journeys,
  onAuthenticated,
}: {
  journeys: LearningJourney[];
  onAuthenticated: (session: SessionUser) => void;
}) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>("gestor");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (!firebaseReady) return;

    let active = true;
    void (async () => {
      try {
        console.info("[auth] complete redirect start", {
          origin: window.location.origin,
          href: window.location.href,
        });
        const user = await completeGoogleRedirect();
        console.info("[auth] complete redirect result", {
          hasUser: Boolean(user),
          email: user?.email,
          uid: user?.uid,
        });
        if (!active || !user) return;

        onAuthenticated({
          role,
          name: user.displayName ?? "Usuario",
          email: user.email ?? "",
          demo: false,
          className: role === "aluno" ? selectedClass : undefined,
        });
      } catch (error) {
        if (!active) return;
        console.error("[auth] complete redirect error", error);
        if (error instanceof FirebaseError) {
          setMessage(`${error.message} (${error.code})`);
          return;
        }
        setMessage(error instanceof Error ? error.message : "Erro ao finalizar login Google.");
      }
    })();

    return () => {
      active = false;
    };
  }, [firebaseReady, onAuthenticated, role, selectedClass]);

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

    if (role === "aluno" && !selectedClass && journeys.length > 0) {
      setMessage("Selecione sua turma.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (!firebaseReady) {
        onAuthenticated({
          role,
          name: name || "Usuario",
          email,
          demo: true,
          className: role === "aluno" ? selectedClass : undefined,
        });
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
        className: role === "aluno" ? selectedClass : undefined,
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

      console.info("[auth] google login start", {
        origin: window.location.origin,
        href: window.location.href,
      });
      // Em alguns navegadores (especialmente Safari/ITP), o popup pode ficar preso no __/auth/handler.
      // Por isso: tenta popup primeiro e, se falhar/bloquear, usa redirect.
      let user = await signInWithGooglePopup().catch((error) => {
        console.error("[auth] google popup error", error);
        if (error instanceof FirebaseError) {
          const shouldRedirect = [
            "auth/popup-blocked",
            "auth/popup-closed-by-user",
            "auth/cancelled-popup-request",
          ].includes(error.code);
          if (shouldRedirect) return null;
        }
        throw error;
      });

      if (!user) {
        console.info("[auth] switching to redirect flow");
        await startGoogleRedirect();
        return;
      }

      console.info("[auth] google popup success", {
        email: user.email,
        uid: user.uid,
      });
      onAuthenticated({
        role,
        name: user.displayName ?? (name || "Usuario"),
        email: user.email ?? email,
        demo: false,
        className: role === "aluno" ? selectedClass : undefined,
      });
    } catch (error) {
      console.error("[auth] google login fatal error", error);
      if (error instanceof FirebaseError) {
        if (error.code === "auth/unauthorized-domain") {
          setMessage(
            "Domínio não autorizado no Firebase Auth. Se você estiver acessando por IP (ex.: 10.1.17.103:3000), adicione esse domínio/host nos domínios autorizados do Firebase. (auth/unauthorized-domain)",
          );
          return;
        }

        if (error.code === "auth/popup-blocked") {
          setMessage(
            "Popup bloqueado pelo navegador. Vou usar o modo Redirect (mais confiável). Tente novamente. (auth/popup-blocked)",
          );
          return;
        }

        setMessage(`${error.message} (${error.code})`);
        return;
      }

      setMessage(error instanceof Error ? error.message : "Erro no login Google.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDemo() {
    onAuthenticated({
      role,
      name: name || "Usuario Demo",
      email: email || "demo@local",
      demo: true,
      className: role === "aluno" ? selectedClass : undefined,
    });
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

              {role === "aluno" && journeys.length > 0 && (
                <select
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  required
                >
                  <option value="">Selecione sua turma</option>
                  {journeys.map((j) => (
                    <option key={j.id} value={j.className}>{j.className}</option>
                  ))}
                </select>
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
    setNotice(`Jornada publicada para ${selectedClass}!`);
  }

  const hasData = diagnostics.length > 0 || examAnalyses.length > 0;

  return (
    <div className="space-y-6">
      {/* Metricas */}
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
          helper="das turmas"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Alto risco"
          value={highRiskQuestions}
          helper="questoes criticas"
        />
      </section>

      {/* Upload e Turmas lado a lado */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Enviar Prova ou Planilha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors hover:bg-muted/50">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-sm font-medium">Clique para enviar</span>
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
              <p className="rounded-lg bg-muted p-3 text-sm">{notice}</p>
            )}

            <Button
              className="w-full"
              disabled={isUploading}
              onClick={loadExampleExams}
              variant="outline"
              size="sm"
            >
              <FileText className="h-4 w-4" />
              Carregar provas de exemplo
            </Button>

            {uploads.length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-muted-foreground">Arquivos enviados</p>
                {uploads.slice(0, 3).map((doc) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-2 text-sm"
                    key={doc.id}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {doc.fileType === "pdf" ? (
                        <FileText className="h-4 w-4 shrink-0 text-rose-500" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4 shrink-0 text-emerald-600" />
                      )}
                      <span className="truncate">{doc.fileName}</span>
                    </div>
                    <Badge variant="success">{doc.importedResponses || 0}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Turmas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {diagnostics.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Importe uma planilha para ver turmas
              </p>
            ) : (
              diagnostics.map((d) => (
                <button
                  key={d.className}
                  onClick={() => {
                    setSelectedClass(d.className);
                    setSelectedQuestionIds(d.topProblemQuestionIds.slice(0, 4));
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                    selectedClass === d.className && "border-primary bg-primary/5"
                  )}
                  type="button"
                >
                  <div>
                    <p className="font-medium">{d.className}</p>
                    <p className="text-xs text-muted-foreground">{d.totalStudents} alunos</p>
                  </div>
                  <Badge variant={d.averageAccuracy < 55 ? "danger" : d.averageAccuracy < 70 ? "warning" : "success"}>
                    {formatPercent(d.averageAccuracy)}
                  </Badge>
                </button>
              ))
            )}

            {currentJourney && (
              <div className="mt-3 rounded-lg border-2 border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Jornada publicada</span>
                </div>
                <p className="mt-1 text-xs text-emerald-600">
                  {currentJourney.questionIds.length} questoes para {selectedClass}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Tabs simplificadas */}
      <div className="flex gap-1 rounded-lg border p-1">
        <TabButton active={tab === "provas"} icon={FileText} label="Provas" onClick={() => setTab("provas")} />
        <TabButton active={tab === "diagnostico"} icon={BarChart3} label="Diagnostico" onClick={() => setTab("diagnostico")} />
        <TabButton active={tab === "jornada"} icon={Sparkles} label="Jornada" onClick={() => setTab("jornada")} />
      </div>

      {/* Conteudo */}
      {tab === "provas" && (
        <ProvasPanel
          analyses={examAnalyses}
          onSelectQuestion={(id) => {
            toggleQuestion(id);
            setTab("jornada");
          }}
        />
      )}

      {tab === "diagnostico" && (
        <DiagnosticoPanel
          diagnostic={currentDiagnostic}
          examAnalyses={examAnalyses}
        />
      )}

      {tab === "jornada" && (
        <JornadaPanel
          currentJourney={currentJourney}
          diagnostic={currentDiagnostic}
          examAnalyses={examAnalyses}
          onGenerateJourney={generateJourney}
          onToggleQuestion={toggleQuestion}
          questions={questions}
          selectedClass={selectedClass}
          selectedQuestionIds={selectedQuestionIds}
        />
      )}
    </div>
  );
}

// ===== ABA PROVAS - Mostra exatamente o que foi feito upload =====

function ProvasPanel({
  analyses,
  onSelectQuestion,
}: {
  analyses: ExamAnalysis[];
  onSelectQuestion: (questionId: string) => void;
}) {
  const [selectedExamId, setSelectedExamId] = useState(analyses[0]?.id ?? "");
  const selectedExam = analyses.find((a) => a.id === selectedExamId) ?? analyses[0];

  if (!analyses.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Nenhuma prova enviada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Envie um PDF de prova ou carregue os exemplos acima
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista de provas */}
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

      {/* Detalhes da prova selecionada */}
      {selectedExam && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{selectedExam.title}</CardTitle>
                <CardDescription>{selectedExam.classLabel} - {selectedExam.totalRespondents} respondentes</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="danger">{selectedExam.highRiskQuestionCount} alto risco</Badge>
                <Badge variant="warning">{selectedExam.mediumRiskQuestionCount} medio</Badge>
                <Badge variant="success">{selectedExam.lowRiskQuestionCount} baixo</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedExam.questions.map((q) => (
                <QuestionResultCard
                  key={q.id}
                  question={q}
                  onSelect={() => onSelectQuestion(q.id)}
                  blobUrl={selectedExam.blobUrl}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuestionResultCard({
  question,
  onSelect,
  blobUrl,
}: {
  question: ExamQuestionAnalysis;
  onSelect: () => void;
  blobUrl?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="neutral">{question.number}</Badge>
            <Badge variant={riskVariant[question.strategicRisk]}>{question.facilityLabel}</Badge>
            <span className="text-xs text-muted-foreground">
              Resposta correta mais escolhida: <strong>{question.majorityOption}</strong> ({question.majorityRate}%)
            </span>
          </div>
          <p className="text-sm font-medium">{question.title}</p>
          {question.prompt && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{question.prompt}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <QuestionImageViewer
            blobUrl={blobUrl}
            pageNumber={question.pageNumber ?? parseInt(question.number, 10)}
            questionTitle={question.title}
          />
          <Button size="sm" variant="outline" onClick={onSelect}>
            Usar na jornada
          </Button>
        </div>
      </div>

      {/* Distribuicao das alternativas */}
      <div className="mt-3 grid grid-cols-5 gap-2">
        {question.optionStats.map((s) => (
          <div
            key={s.optionId}
            className={cn(
              "rounded-lg border p-2 text-center",
              s.optionId === question.majorityOption && "border-primary bg-primary/5"
            )}
          >
            <p className="text-sm font-bold">{s.optionId}</p>
            <p className="text-lg font-semibold">{s.percentage}%</p>
            <p className="text-xs text-muted-foreground">{s.count}/{s.total}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== ABA DIAGNOSTICO - Estatisticas por tema/tipo com insights =====

function DiagnosticoPanel({
  diagnostic,
  examAnalyses,
}: {
  diagnostic?: ClassDiagnostic;
  examAnalyses: ExamAnalysis[];
}) {
  // Agregar insights de todas as provas
  const allQuestions = examAnalyses.flatMap((a) => a.questions);
  const allInsights = examAnalyses.flatMap((a) => a.insights);

  // Estatisticas por dificuldade (tema baseado na facilidade)
  const byDifficulty = {
    alto: allQuestions.filter((q) => q.strategicRisk === "alto"),
    medio: allQuestions.filter((q) => q.strategicRisk === "medio"),
    baixo: allQuestions.filter((q) => q.strategicRisk === "baixo"),
  };

  // Insights gerados
  const insights = generateInsights(allQuestions, diagnostic);

  if (!diagnostic && !allQuestions.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Sem dados para diagnostico</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Importe uma prova ou planilha para ver estatisticas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo da turma se houver */}
      {diagnostic && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumo: {diagnostic.className}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox label="Alunos" value={diagnostic.totalStudents} />
              <StatBox label="Acerto medio" value={formatPercent(diagnostic.averageAccuracy)} />
              <StatBox label="Questoes" value={diagnostic.totalQuestions} />
              <StatBox label="Alto risco" value={diagnostic.highRiskQuestionCount} color="danger" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribuicao por dificuldade */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="h-3 w-3 rounded-full bg-rose-500" />
              Alto Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-rose-600">{byDifficulty.alto.length}</p>
            <p className="text-sm text-muted-foreground">questoes com baixa taxa de acerto</p>
            {byDifficulty.alto.slice(0, 3).map((q) => (
              <div key={q.id} className="mt-2 rounded border p-2 text-xs">
                <strong>{q.number}</strong> - {formatPercent(q.majorityRate)} acertos
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              Medio Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{byDifficulty.medio.length}</p>
            <p className="text-sm text-muted-foreground">questoes com taxa moderada</p>
            {byDifficulty.medio.slice(0, 3).map((q) => (
              <div key={q.id} className="mt-2 rounded border p-2 text-xs">
                <strong>{q.number}</strong> - {formatPercent(q.majorityRate)} acertos
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              Baixo Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{byDifficulty.baixo.length}</p>
            <p className="text-sm text-muted-foreground">questoes com boa taxa de acerto</p>
            {byDifficulty.baixo.slice(0, 3).map((q) => (
              <div key={q.id} className="mt-2 rounded border p-2 text-xs">
                <strong>{q.number}</strong> - {formatPercent(q.majorityRate)} acertos
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Insights
          </CardTitle>
          <CardDescription>Sugestoes baseadas nos dados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.length === 0 && allInsights.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Importe mais dados para gerar insights automaticos.
            </p>
          ) : (
            <>
              {insights.map((insight, i) => (
                <div key={i} className="flex gap-3 rounded-lg border p-3">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    insight.type === "danger" && "bg-rose-100 text-rose-600",
                    insight.type === "warning" && "bg-amber-100 text-amber-600",
                    insight.type === "success" && "bg-emerald-100 text-emerald-600",
                  )}>
                    {insight.type === "danger" && <AlertTriangle className="h-4 w-4" />}
                    {insight.type === "warning" && <Lightbulb className="h-4 w-4" />}
                    {insight.type === "success" && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              ))}
              {allInsights.map((insight) => (
                <div key={insight.id} className="flex gap-3 rounded-lg border p-3">
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    insight.severity === "alto" && "bg-rose-100 text-rose-600",
                    insight.severity === "medio" && "bg-amber-100 text-amber-600",
                    insight.severity === "baixo" && "bg-emerald-100 text-emerald-600",
                  )}>
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Por competencia se tiver diagnostico */}
      {diagnostic && diagnostic.byCompetency.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Por Competencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {diagnostic.byCompetency.map((g) => (
              <div key={g.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{g.id} - {g.label}</span>
                  <Badge variant={riskVariant[g.risk]}>{formatPercent(g.accuracy)}</Badge>
                </div>
                <Progress value={g.accuracy} indicatorClassName={barTone(g.accuracy)} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function generateInsights(
  questions: ExamQuestionAnalysis[],
  diagnostic?: ClassDiagnostic,
): { type: "danger" | "warning" | "success"; title: string; description: string }[] {
  const insights: { type: "danger" | "warning" | "success"; title: string; description: string }[] = [];

  const highRisk = questions.filter((q) => q.strategicRisk === "alto");
  const lowRisk = questions.filter((q) => q.strategicRisk === "baixo");

  if (highRisk.length > questions.length * 0.3) {
    insights.push({
      type: "danger",
      title: "Muitas questoes de alto risco",
      description: `${highRisk.length} questoes (${Math.round((highRisk.length / questions.length) * 100)}%) tem baixa taxa de acerto. Priorize essas na jornada.`,
    });
  }

  if (lowRisk.length > questions.length * 0.5) {
    insights.push({
      type: "success",
      title: "Boa base de conhecimento",
      description: `${lowRisk.length} questoes tem boa taxa de acerto. Os alunos dominam esses temas.`,
    });
  }

  if (diagnostic && diagnostic.averageAccuracy < 60) {
    insights.push({
      type: "danger",
      title: "Turma precisa de atencao",
      description: `Media de ${formatPercent(diagnostic.averageAccuracy)} de acerto esta abaixo do esperado.`,
    });
  }

  if (diagnostic && diagnostic.averageAccuracy >= 70) {
    insights.push({
      type: "success",
      title: "Turma com bom desempenho",
      description: `Media de ${formatPercent(diagnostic.averageAccuracy)} indica boa preparacao.`,
    });
  }

  // Dispersao alta
  const highDispersion = questions.filter((q) => q.dispersionRate > 30);
  if (highDispersion.length > 0) {
    insights.push({
      type: "warning",
      title: "Questoes com respostas dispersas",
      description: `${highDispersion.length} questoes tem alta dispersao entre alternativas. Pode indicar confusao ou chute.`,
    });
  }

  return insights;
}

// ===== ABA JORNADA - Selecionar questoes e gerar jornada =====

function JornadaPanel({
  currentJourney,
  diagnostic,
  examAnalyses,
  onGenerateJourney,
  onToggleQuestion,
  questions,
  selectedClass,
  selectedQuestionIds,
}: {
  currentJourney?: LearningJourney;
  diagnostic?: ClassDiagnostic;
  examAnalyses: ExamAnalysis[];
  onGenerateJourney: () => void;
  onToggleQuestion: (questionId: string) => void;
  questions: QuestionBankItem[];
  selectedClass: string;
  selectedQuestionIds: string[];
}) {
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);

  // Pegar questoes das provas para selecionar
  const examQuestions = examAnalyses.flatMap((a) =>
    a.questions.map((q) => ({
      ...q,
      examTitle: a.title,
      fullQuestion: questions.find((fq) => fq.id === q.id),
    })),
  );

  const selectedQuestions = selectedQuestionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is QuestionBankItem => Boolean(q));

  if (!examAnalyses.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Envie uma prova primeiro</p>
          <p className="mt-1 text-sm text-muted-foreground">
            As questoes da prova aparecerao aqui para voce selecionar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Coluna esquerda - Questoes disponiveis */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Selecionar Questoes para Jornada</CardTitle>
          <CardDescription>
            Marque as questoes que os alunos devem estudar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
          {examQuestions.map((q) => {
            const isSelected = selectedQuestionIds.includes(q.id);
            return (
              <div
                key={q.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                  isSelected && "border-primary bg-primary/5"
                )}
              >
                <button
                  type="button"
                  onClick={() => onToggleQuestion(q.id)}
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 hover:border-primary"
                  )}
                >
                  {isSelected && <Check className="h-4 w-4" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="neutral">{q.number}</Badge>
                    <Badge variant={riskVariant[q.strategicRisk]}>{q.facilityLabel}</Badge>
                    <span className="text-xs text-muted-foreground">{q.majorityRate}% acertos</span>
                  </div>
                  <p className="text-sm truncate">{q.title}</p>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const full = questions.find((fq) => fq.id === q.id);
                    if (full) setEditingQuestion(full);
                  }}
                >
                  Editar
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Coluna direita - Resumo e acao */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Jornada para {selectedClass || "..."}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-3xl font-bold">{selectedQuestionIds.length}</p>
              <p className="text-sm text-muted-foreground">questoes selecionadas</p>
            </div>

            {selectedQuestions.length > 0 && (
              <div className="space-y-2">
                {selectedQuestions.slice(0, 5).map((q) => (
                  <div key={q.id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{q.id} - {q.title}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => onToggleQuestion(q.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {selectedQuestions.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{selectedQuestions.length - 5} mais
                  </p>
                )}
              </div>
            )}

            <Button
              className="w-full"
              onClick={onGenerateJourney}
              disabled={!selectedQuestionIds.length || !selectedClass}
            >
              <Save className="h-4 w-4" />
              Salvar e Gerar Jornada
            </Button>

            {currentJourney && (
              <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-3 text-center">
                <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
                <p className="mt-1 text-sm font-medium text-emerald-700">Jornada publicada!</p>
                <p className="text-xs text-emerald-600">
                  {currentJourney.questionIds.length} questoes disponiveis para os alunos
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Editor rapido */}
        {editingQuestion && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Editar {editingQuestion.id}</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setEditingQuestion(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium">Titulo</label>
                <Input
                  value={editingQuestion.title}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Enunciado</label>
                <Textarea
                  value={editingQuestion.prompt}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, prompt: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Explicacao (aparece para o aluno)</label>
                <Textarea
                  value={editingQuestion.explanation}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  rows={2}
                />
              </div>
              <Button className="w-full" onClick={() => setEditingQuestion(null)}>
                <Save className="h-4 w-4" /> Salvar edicao
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ===== VISAO DO ALUNO =====

function StudentLearningJourney({
  diagnostics,
  journeys,
  questions,
  selectedClassName,
  studentName,
}: {
  diagnostics: ClassDiagnostic[];
  journeys: LearningJourney[];
  questions: QuestionBankItem[];
  selectedClassName?: string;
  studentName: string;
}) {
  const [macroIndex, setMacroIndex] = useState(0);
  const [tourIndex, setTourIndex] = useState(0);
  const [flashcardQueue, setFlashcardQueue] = useState<string[]>([]);
  const [showFlashcardBack, setShowFlashcardBack] = useState(false);
  const [learnedQuestionIds, setLearnedQuestionIds] = useState<string[]>([]);
  const [simulationAnswers, setSimulationAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [started, setStarted] = useState(false);

  const journey = journeys.find((j) => j.className === selectedClassName) ?? journeys[0];
  const diagnostic = diagnostics.find((d) => d.className === selectedClassName);
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
      className: selectedClassName ?? "",
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
            <CardTitle>Sua Jornada de Aprendizagem</CardTitle>
            <CardDescription>{journey.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-3xl font-bold">{journeyQuestions.length}</p>
              <p className="text-sm text-muted-foreground">questoes para estudar</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">O que voce vai fazer:</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</div>
                  <span>Questoes Comentadas - entenda cada questao</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</div>
                  <span>Flashcards - memorize os conceitos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</div>
                  <span>Simulado - teste seus conhecimentos</span>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={startJourney}>
              <PlayCircle className="h-4 w-4" /> Comecar jornada
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
              i < macroIndex && "bg-emerald-50 border-emerald-200"
            )}
          >
            <p className="text-xs text-muted-foreground">{m.weekLabel}</p>
            <p className="text-sm font-medium">{m.title}</p>
            {i < macroIndex && <CheckCircle2 className="mx-auto mt-1 h-4 w-4 text-emerald-600" />}
          </div>
        ))}
      </div>

      {/* Macro 1: Questoes Comentadas */}
      {activeMacro?.id === "exploracao" && currentTourQuestion && (
        <Card>
          <CardHeader>
            <CardTitle>Questoes Comentadas</CardTitle>
            <CardDescription>
              Questao {tourIndex + 1} de {journeyQuestions.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={((tourIndex + 1) / journeyQuestions.length) * 100} />

            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">{currentTourQuestion.id}</Badge>
              <Badge variant="info">{currentTourQuestion.competencyId}</Badge>
            </div>

            <h2 className="text-lg font-semibold">{currentTourQuestion.title}</h2>
            <p className="text-muted-foreground">{currentTourQuestion.prompt}</p>

            <div className="rounded-lg border bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-800">Explicacao do Professor</p>
              <p className="mt-1 text-sm text-emerald-700">{currentTourQuestion.explanation}</p>
              <p className="mt-2 text-xs text-emerald-600">
                Resposta correta: <strong>{currentTourQuestion.correctOption}</strong>
              </p>
            </div>

            <Button
              className="w-full"
              onClick={() => {
                if (tourIndex + 1 >= journeyQuestions.length) {
                  setMacroIndex(1);
                } else {
                  setTourIndex((c) => c + 1);
                }
              }}
            >
              {tourIndex + 1 >= journeyQuestions.length ? "Ir para Flashcards" : "Proxima questao"}
              <ChevronRight className="h-4 w-4" />
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
              <div className="rounded-lg border p-6 text-center min-h-[200px] flex flex-col justify-center">
                <Badge variant="info" className="mx-auto mb-4">{currentFlashcard.id}</Badge>
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
              Responda as {journeyQuestions.length} questoes
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

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: "danger" | "warning" | "success";
}) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className={cn(
        "text-2xl font-bold",
        color === "danger" && "text-rose-600",
        color === "warning" && "text-amber-600",
        color === "success" && "text-emerald-600",
      )}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function barTone(value: number) {
  if (value < 55) return "bg-rose-500";
  if (value < 70) return "bg-amber-500";
  return "bg-emerald-500";
}
