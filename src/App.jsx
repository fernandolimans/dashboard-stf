import { useMemo, useState } from "react";
import {
  BarChart3,
  Landmark,
  ShieldAlert,
  Gavel,
  FileText,
  LibraryBig,
  FlaskConical,
} from "lucide-react";
import pesquisa from "./data/pesquisa.json";
import { buildDashboardData } from "@/lib/dashboard-data";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TabNav } from "@/components/layout/TabNav";
import { GlobalFilters } from "@/components/layout/GlobalFilters";
import { OverviewSection } from "@/components/sections/OverviewSection";
import { GovernmentSection } from "@/components/sections/GovernmentSection";
import { ThemeSection } from "@/components/sections/ThemeSection";
import { OutcomesSection } from "@/components/sections/OutcomesSection";
import { CasesSection } from "@/components/sections/CasesSection";
import { TheorySection } from "@/components/sections/TheorySection";
import { MethodologySection } from "@/components/sections/MethodologySection";

const tabs = [
  { id: "geral", label: "Visão geral", icon: BarChart3 },
  { id: "governo", label: "Por governo", icon: Landmark },
  { id: "tema", label: "Por tema", icon: ShieldAlert },
  { id: "desfechos", label: "Desfechos", icon: Gavel },
  { id: "casos", label: "Casos centrais", icon: FileText },
  { id: "teoria", label: "Base teórica", icon: LibraryBig },
  { id: "metodologia", label: "Metodologia", icon: FlaskConical },
];

const dashboard = buildDashboardData(pesquisa);

function sortUnique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, "pt-BR"));
}

export default function App() {
  const [activeTab, setActiveTab] = useState("geral");
  const [typeFilter, setTypeFilter] = useState("all");
  const [governmentFilter, setGovernmentFilter] = useState("all");
  const [axisFilter, setAxisFilter] = useState("all");

  const globalOptions = useMemo(
    () => ({
      type: [
        { value: "all", label: "Todos" },
        { value: "decreto", label: "Decretos" },
        { value: "mp", label: "MPs" },
      ],
      government: [
        { value: "all", label: "Todos" },
        ...sortUnique(dashboard.governments.map((item) => item.government)).map((item) => ({
          value: item,
          label: item,
        })),
      ],
      axis: [
        { value: "all", label: "Todos" },
        ...sortUnique(dashboard.cases.map((item) => item.eixo)).map((item) => ({
          value: item,
          label: item,
        })),
      ],
    }),
    []
  );

  const filteredGovernmentRows = useMemo(
    () =>
      dashboard.governments.filter((item) => {
        const matchesType = typeFilter === "all" || item.type === typeFilter;
        const matchesGovernment = governmentFilter === "all" || item.government === governmentFilter;
        return matchesType && matchesGovernment;
      }),
    [governmentFilter, typeFilter]
  );

  const filteredThemeRows = useMemo(
    () =>
      dashboard.themes.filter((item) => {
        const matchesType = typeFilter === "all" || item.type === typeFilter;
        return matchesType;
      }),
    [typeFilter]
  );

  const filteredCaseRows = useMemo(
    () =>
      dashboard.cases.filter((item) => {
        const matchesType = typeFilter === "all" || item.actType === typeFilter;
        const matchesGovernment = governmentFilter === "all" || item.governo === governmentFilter;
        const matchesAxis = axisFilter === "all" || item.eixo === axisFilter;
        return matchesType && matchesGovernment && matchesAxis;
      }),
    [axisFilter, governmentFilter, typeFilter]
  );

  return (
    <div className="min-h-screen bg-transparent px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <DashboardHeader
          processCount={dashboard.methodology.universe.processCount}
          pairCount={dashboard.methodology.universe.processNormPairs}
          decrees={dashboard.methodology.universe.decrees}
          mps={dashboard.methodology.universe.mps}
        />

        <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <GlobalFilters
          filters={{ type: typeFilter, government: governmentFilter, axis: axisFilter }}
          options={globalOptions}
          onTypeChange={setTypeFilter}
          onGovernmentChange={setGovernmentFilter}
          onAxisChange={setAxisFilter}
        />

        {activeTab === "geral" && (
          <OverviewSection dashboard={dashboard} filteredCases={filteredCaseRows} />
        )}

        {activeTab === "governo" && (
          <GovernmentSection rows={filteredGovernmentRows} selectedType={typeFilter} />
        )}

        {activeTab === "tema" && (
          <ThemeSection rows={filteredThemeRows} selectedType={typeFilter} />
        )}

        {activeTab === "desfechos" && <OutcomesSection dashboard={dashboard} />}

        {activeTab === "casos" && (
          <CasesSection rows={filteredCaseRows} axisOptions={globalOptions.axis} />
        )}

        {activeTab === "teoria" && (
          <TheorySection theory={dashboard.theory} literature={dashboard.literature} />
        )}

        {activeTab === "metodologia" && (
          <MethodologySection
            methodology={dashboard.methodology}
            limits={dashboard.limits}
            excludedSheets={dashboard.excludedSheets}
          />
        )}

        <footer className="mt-8 rounded-2xl bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm">
          <p>
            Camada pública gerada a partir de{" "}
            {dashboard.meta.arquivosFonte.map((item) => item.arquivo).join(", ")}. As abas
            técnicas permanecem fora do JSON bruto e são usadas apenas para contexto
            metodológico e auditoria da extração.
          </p>
        </footer>
      </div>
    </div>
  );
}
