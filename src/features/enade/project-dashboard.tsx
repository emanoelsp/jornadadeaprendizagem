"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  LineChart,
  ListChecks,
  MapPinned,
  Target,
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
import { Progress } from "@/components/ui/progress";
import { formatPercent } from "@/lib/utils";
import {
  curricularUnits,
  enadeCompetencies,
  getAverageQuestionAccuracy,
  getCompetencyTitle,
  getHighRiskUnits,
  getUnitName,
  managerMetrics,
  pedagogicalActions,
  preparationStages,
  questionMappings,
  studentPreparationPlan,
} from "./data";
import type { ActionStatus, Priority, RiskLevel } from "./types";

type ViewMode = "gestor" | "aluno";

const riskVariant: Record<RiskLevel, "success" | "warning" | "danger"> = {
  baixo: "success",
  medio: "warning",
  alto: "danger",
};

const priorityVariant: Record<Priority, "neutral" | "warning" | "danger"> = {
  baixa: "neutral",
  media: "warning",
  alta: "danger",
};

const statusLabel: Record<ActionStatus, string> = {
  planejada: "Planejada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

const statusVariant: Record<ActionStatus, "neutral" | "info" | "success"> = {
  planejada: "neutral",
  em_andamento: "info",
  concluida: "success",
};

export function ProjectDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("gestor");

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">
                UniSENAI Blumenau
              </p>
              <h1 className="truncate text-xl font-semibold tracking-normal sm:text-2xl">
                Preparatório ENADE 2026 ADS
              </h1>
            </div>
          </div>

          <div
            aria-label="Selecionar visão"
            className="grid grid-cols-2 gap-2 rounded-lg border bg-background p-1"
          >
            <Button
              aria-pressed={viewMode === "gestor"}
              onClick={() => setViewMode("gestor")}
              size="sm"
              variant={viewMode === "gestor" ? "default" : "ghost"}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Gestor
            </Button>
            <Button
              aria-pressed={viewMode === "aluno"}
              onClick={() => setViewMode("aluno")}
              size="sm"
              variant={viewMode === "aluno" ? "default" : "ghost"}
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Aluno
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {viewMode === "gestor" ? <ManagerView /> : <StudentView />}
      </div>
    </main>
  );
}

function ManagerView() {
  const highRiskUnits = useMemo(() => getHighRiskUnits(), []);
  const averageAccuracy = getAverageQuestionAccuracy();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Estudantes elegíveis"
          tone="text-teal-700"
          value={managerMetrics.eligibleStudents}
          helper={managerMetrics.targetCohorts}
        />
        <MetricCard
          icon={ClipboardList}
          label="Questões mapeadas"
          tone="text-sky-700"
          value={managerMetrics.mappedQuestions}
          helper="Base ENADE anterior"
        />
        <MetricCard
          icon={BarChart3}
          label="Acerto médio"
          tone="text-amber-700"
          value={formatPercent(averageAccuracy)}
          helper="Simulado diagnóstico"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Lacunas críticas"
          tone="text-rose-700"
          value={highRiskUnits.length}
          helper="UCs em alto risco"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Plano de preparação</CardTitle>
            <CardDescription>
              Fluxo solicitado no alinhamento inicial para orientar docentes e coordenação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {preparationStages.map((stage, index) => (
                <div
                  className="rounded-lg border bg-background p-4"
                  key={stage.title}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                    <Badge
                      variant={
                        stage.status === "Concluído"
                          ? "success"
                          : stage.status === "Em andamento"
                            ? "info"
                            : "neutral"
                      }
                    >
                      {stage.status}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold">{stage.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {stage.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competências ENADE</CardTitle>
            <CardDescription>
              Referência inicial do componente específico da Portaria 169/2026.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {enadeCompetencies.map((competency) => (
              <div className="rounded-lg border bg-background p-4" key={competency.id}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Badge variant="info">{competency.id}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {competency.abilities.length} habilidades
                  </span>
                </div>
                <h3 className="text-sm font-semibold">{competency.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {competency.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionTitle
          icon={MapPinned}
          title="Mapa de lacunas por unidade curricular"
          description="Prioridade calculada a partir de acerto médio e volume de questões associadas."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {curricularUnits.map((unit) => (
            <Card className="min-h-[210px]" key={unit.code}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="neutral">{unit.code}</Badge>
                  <Badge variant={riskVariant[unit.risk]}>Risco {unit.risk}</Badge>
                </div>
                <CardTitle className="text-sm leading-5">{unit.name}</CardTitle>
                <CardDescription>
                  {unit.semester}º semestre · {unit.module}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress
                  indicatorClassName={
                    unit.risk === "alto"
                      ? "bg-rose-500"
                      : unit.risk === "medio"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }
                  label="Acerto"
                  value={unit.averageAccuracy}
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Questões</span>
                  <span className="font-semibold">{unit.mappedQuestions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Competência</span>
                  <Badge variant="info">{unit.competencyId}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Questões mapeadas</CardTitle>
            <CardDescription>
              Amostra do vínculo entre prova anterior, competência e UCs do PPC.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {questionMappings.map((question) => (
              <div
                className="grid gap-3 rounded-lg border bg-background p-4 md:grid-cols-[0.35fr_1.25fr_0.5fr]"
                key={question.id}
              >
                <div>
                  <p className="font-mono text-sm font-semibold">{question.id}</p>
                  <p className="text-xs text-muted-foreground">{question.type}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{question.object}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="info">{question.competencyId}</Badge>
                    {question.unitCodes.map((unitCode) => (
                      <Badge key={unitCode} variant="neutral">
                        {unitCode}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress
                    indicatorClassName={
                      question.difficulty === "alto"
                        ? "bg-rose-500"
                        : question.difficulty === "medio"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }
                    label="Acerto"
                    value={question.averageAccuracy}
                  />
                  <Badge variant={question.status === "mapeada" ? "success" : "warning"}>
                    {question.status === "mapeada" ? "Mapeada" : "Revisão docente"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações pedagógicas</CardTitle>
            <CardDescription>
              Intervenções planejadas para reduzir lacunas ao longo do semestre.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pedagogicalActions.map((action) => (
              <div className="rounded-lg border bg-background p-4" key={action.id}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant={priorityVariant[action.priority]}>
                    Prioridade {action.priority}
                  </Badge>
                  <Badge variant={statusVariant[action.status]}>
                    {statusLabel[action.status]}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold leading-5">{action.title}</h3>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                  <InfoLine icon={Users} text={action.owner} />
                  <InfoLine icon={CalendarDays} text={action.dueDate} />
                  <InfoLine
                    icon={Target}
                    text={`${action.competencyId} · ${action.unitCodes.join(", ")}`}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StudentView() {
  const recommendedQuestions = questionMappings.filter((question) =>
    studentPreparationPlan.recommendedQuestionIds.includes(question.id),
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle>{studentPreparationPlan.studentName}</CardTitle>
                <CardDescription>{studentPreparationPlan.cohort}</CardDescription>
              </div>
              <Badge variant="success">
                {studentPreparationPlan.courseProgress}% do curso
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-[150px_1fr]">
            <div className="flex justify-center">
              <div
                aria-label={`Prontidão ${studentPreparationPlan.readiness}%`}
                className="flex h-36 w-36 items-center justify-center rounded-full"
                role="img"
                style={{
                  background: `conic-gradient(hsl(var(--primary)) ${studentPreparationPlan.readiness}%, hsl(var(--muted)) 0)`,
                }}
              >
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-card text-center">
                  <span className="text-3xl font-semibold">
                    {studentPreparationPlan.readiness}%
                  </span>
                  <span className="text-xs text-muted-foreground">prontidão</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Progress
                label="Acerto médio"
                value={studentPreparationPlan.averageAccuracy}
              />
              <Progress
                indicatorClassName="bg-sky-600"
                label="Meta individual"
                value={studentPreparationPlan.targetAccuracy}
              />
              <div className="rounded-lg border bg-background p-4">
                <p className="text-sm font-semibold">Próximo marco</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Revisão orientada antes do segundo simulado diagnóstico de junho.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Foco da semana</CardTitle>
            <CardDescription>
              Atividades conectadas às lacunas do simulado e às competências ENADE.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {studentPreparationPlan.studyTasks.map((task) => (
              <div
                className="grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-[1fr_auto]"
                key={task.id}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={priorityVariant[task.priority]}>
                      Prioridade {task.priority}
                    </Badge>
                    <Badge variant="info">{task.competencyId}</Badge>
                    <Badge variant="neutral">{task.unitCode}</Badge>
                  </div>
                  <h3 className="text-sm font-semibold leading-5">{task.title}</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  {task.duration}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Pontos fortes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {studentPreparationPlan.strengths.map((strength) => (
              <InfoLine icon={CheckCircle2} key={strength} text={strength} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lacunas prioritárias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {studentPreparationPlan.priorityGaps.map((gap) => (
              <InfoLine icon={AlertTriangle} key={gap} text={gap} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rota ENADE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Milestone
              icon={ClipboardList}
              label="Simulado diagnóstico"
              status="Concluído"
            />
            <Milestone
              icon={ListChecks}
              label="Revisão por competência"
              status="Em andamento"
            />
            <Milestone
              icon={LineChart}
              label="Novo simulado"
              status="Junho/2026"
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Questões recomendadas</CardTitle>
            <CardDescription>
              Revisão priorizada a partir do desempenho individual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendedQuestions.map((question) => (
              <div
                className="rounded-lg border bg-background p-4"
                key={question.id}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Badge variant="neutral">{question.id}</Badge>
                  <Badge variant={riskVariant[question.difficulty]}>
                    {question.difficulty}
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold">{question.object}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {getCompetencyTitle(question.competencyId)}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {question.unitCodes.map((unitCode) => (
                    <Badge key={unitCode} variant="info">
                      {unitCode}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unidades relacionadas</CardTitle>
            <CardDescription>
              Conteúdos do PPC conectados às revisões recomendadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {["EDA", "TRL", "CNU", "DSD", "DSW", "DWE"].map((unitCode) => (
              <div className="rounded-lg border bg-background p-4" key={unitCode}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge variant="neutral">{unitCode}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium leading-5">{getUnitName(unitCode)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: number | string;
  helper: string;
  tone: string;
};

function MetricCard({ icon: Icon, label, value, helper, tone }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className={`h-6 w-6 ${tone}`} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold tracking-normal">{value}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type SectionTitleProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

function SectionTitle({ icon: Icon, title, description }: SectionTitleProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

type InfoLineProps = {
  icon: LucideIcon;
  text: string;
};

function InfoLine({ icon: Icon, text }: InfoLineProps) {
  return (
    <div className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
      <Icon className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

type MilestoneProps = {
  icon: LucideIcon;
  label: string;
  status: string;
};

function Milestone({ icon: Icon, label, status }: MilestoneProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate text-sm font-medium">{label}</span>
      </div>
      <Badge variant={status === "Concluído" ? "success" : "info"}>{status}</Badge>
    </div>
  );
}
