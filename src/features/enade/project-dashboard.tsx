"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  LineChart,
  ListChecks,
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
  pedagogicalActions,
  questionMappings,
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
  concluida: "Concluida",
};

const statusVariant: Record<ActionStatus, "neutral" | "info" | "success"> = {
  planejada: "neutral",
  em_andamento: "info",
  concluida: "success",
};

const preparationStages = [
  {
    title: "Simulado inicial",
    description: "Aplicar prova anterior do ENADE para obter diagnostico real por estudante.",
    status: "Concluido",
  },
  {
    title: "Mapeamento tecnico",
    description: "Associar questao, objeto de conhecimento, competencia e unidade curricular.",
    status: "Em andamento",
  },
  {
    title: "Mapa de lacunas",
    description: "Identificar turmas, UCs e competencias com menor desempenho.",
    status: "Em andamento",
  },
  {
    title: "Acoes pedagogicas",
    description: "Planejar oficinas, listas orientadas e revisoes com docentes responsaveis.",
    status: "Planejado",
  },
];

export function ProjectDashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>("gestor");

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-semibold">Preparatorio ENADE 2026</h1>
              <p className="text-xs text-muted-foreground">UniSENAI Blumenau</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg border p-1">
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

      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        {viewMode === "gestor" ? <ManagerView /> : <StudentView />}
      </div>
    </main>
  );
}

function ManagerView() {
  return (
    <div className="space-y-6">
      {/* Metricas */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Users} label="Estudantes elegiveis" value={48} helper="3o e 4o semestres" />
        <MetricCard icon={BarChart3} label="Questoes mapeadas" value={questionMappings.length} helper="Base ENADE" />
        <MetricCard icon={Target} label="Competencias" value={enadeCompetencies.length} helper="C1 e C2" />
        <MetricCard icon={AlertTriangle} label="Acoes planejadas" value={pedagogicalActions.length} helper="Pedagogicas" />
      </section>

      {/* Plano e competencias */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Plano de preparacao</CardTitle>
            <CardDescription>Fluxo para orientar docentes e coordenacao</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {preparationStages.map((stage, index) => (
              <div className="rounded-lg border p-3" key={stage.title}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <Badge
                    variant={
                      stage.status === "Concluido"
                        ? "success"
                        : stage.status === "Em andamento"
                          ? "info"
                          : "neutral"
                    }
                  >
                    {stage.status}
                  </Badge>
                </div>
                <h3 className="text-sm font-medium">{stage.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{stage.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Competencias ENADE</CardTitle>
            <CardDescription>Componente especifico da Portaria</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {enadeCompetencies.map((competency) => (
              <div className="rounded-lg border p-3" key={competency.id}>
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="info">{competency.id}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {competency.abilities.length} habilidades
                  </span>
                </div>
                <h3 className="text-sm font-medium">{competency.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{competency.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Unidades curriculares */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Unidades curriculares</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {curricularUnits.map((unit) => (
            <Card key={unit.code}>
              <CardContent className="p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant="neutral">{unit.code}</Badge>
                  <Badge variant="info">{unit.competencyId}</Badge>
                </div>
                <h3 className="text-sm font-medium">{unit.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {unit.semester}o semestre - {unit.workload}h
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Questoes e acoes */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Questoes mapeadas</CardTitle>
            <CardDescription>Vinculo entre prova, competencia e UCs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {questionMappings.map((question) => (
              <div className="rounded-lg border p-3" key={question.id}>
                <div className="mb-2 flex flex-wrap items-center gap-1">
                  <Badge variant="neutral">{question.id}</Badge>
                  <Badge variant={riskVariant[question.difficulty]}>{question.difficulty}</Badge>
                  <Badge variant="info">{question.competencyId}</Badge>
                  {question.unitCodes.map((uc) => (
                    <Badge key={uc} variant="neutral">{uc}</Badge>
                  ))}
                </div>
                <p className="text-sm">{question.object}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Acoes pedagogicas</CardTitle>
            <CardDescription>Intervencoes para reduzir lacunas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pedagogicalActions.map((action) => (
              <div className="rounded-lg border p-3" key={action.id}>
                <div className="mb-2 flex flex-wrap items-center gap-1">
                  <Badge variant={priorityVariant[action.priority]}>
                    {action.priority}
                  </Badge>
                  <Badge variant={statusVariant[action.status]}>
                    {statusLabel[action.status]}
                  </Badge>
                </div>
                <h3 className="text-sm font-medium">{action.title}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {action.owner}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {action.dueDate}
                  </span>
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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Visao do Estudante</CardTitle>
          <CardDescription>
            O sistema principal de jornada esta disponivel no PreparatorySystem.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
              <p className="mt-2 font-medium">Simulado diagnostico</p>
              <p className="text-xs text-muted-foreground">Concluido</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <ListChecks className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-2 font-medium">Revisao por competencia</p>
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <LineChart className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 font-medium">Novo simulado</p>
              <p className="text-xs text-muted-foreground">Junho/2026</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
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
