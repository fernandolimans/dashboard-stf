import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ShieldAlert, Landmark, Clock3, FileText, Gavel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ChartCard } from "@/components/charts/ChartCard";
import { RichTooltip } from "@/components/charts/RichTooltip";
import { KpiCard } from "@/components/layout/KpiCard";
import { chartColors, formatDays, formatNumber, formatPercent } from "@/lib/dashboard-data";

function renderAxisLabel(count, percent) {
  return `${formatNumber(count)} · ${formatPercent(percent)}`;
}

export function OverviewSection({ dashboard }) {
  const decreesRate = dashboard.typeStats.find((item) => item.type === "decreto")?.rate ?? 0;
  const mpsRate = dashboard.typeStats.find((item) => item.type === "mp")?.rate ?? 0;
  const bolsonaroCases = dashboard.cases.filter((item) => item.governo.includes("Bolsonaro")).length;
  const colegiada = dashboard.timeline.find((item) => item.id === "dias_ate_primeira_colegiada");
  const totalCentralCases = dashboard.cases.length;
  const totalMeritDecisions = dashboard.meritRates.reduce((total, item) => total + (item.decisions ?? 0), 0);
  const totalMeritFavorable = dashboard.meritRates.reduce((total, item) => total + (item.favorable ?? 0), 0);
  const meritSuccessRate = totalMeritDecisions ? (totalMeritFavorable / totalMeritDecisions) * 100 : null;
  const casesByAxis = dashboard.casesByAxis.map((item) => ({
    ...item,
    percent: totalCentralCases ? (item.count / totalCentralCases) * 100 : 0,
    labelValue: renderAxisLabel(item.count, totalCentralCases ? (item.count / totalCentralCases) * 100 : 0),
  }));

  const highlights = [
    {
      icon: ShieldAlert,
      title: "MPs concentram o maior risco",
      text: `A taxa de judicialização das MPs (${formatPercent(mpsRate)}) supera a dos decretos (${formatPercent(decreesRate)}).`,
    },
    {
      icon: Landmark,
      title: "Casos centrais se acumulam no período Bolsonaro",
      text: `${formatNumber(bolsonaroCases)} dos ${formatNumber(dashboard.cases.length)} casos paradigmáticos recaem nesse recorte presidencial.`,
    },
    {
      icon: Clock3,
      title: "A primeira decisão colegiada é a principal fricção temporal",
      text: `A mediana é de ${formatDays(colegiada?.decretos)} para decretos e ${formatDays(colegiada?.mps)} para MPs.`,
    },
  ];

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm">
              <CardContent className="flex gap-4 p-5">
                <div className="rounded-2xl bg-slate-950 p-3 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Destaque
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={FileText}
          label="Decisões de mérito"
          value={formatNumber(totalMeritDecisions)}
          detail="Decisões de mérito agregadas no recorte público."
        />
        <KpiCard
          icon={Gavel}
          label="Taxa de procedência em mérito"
          value={formatPercent(meritSuccessRate)}
          detail={`${formatNumber(totalMeritFavorable)} decisões favoráveis dentro do conjunto de mérito.`}
          accent="bg-blue-50 text-blue-700"
        />
        <KpiCard
          icon={ShieldAlert}
          label="Casos paradigmáticos"
          value={formatNumber(dashboard.cases.length)}
          detail="Seleção qualitativa usada para aprofundar a análise institucional."
          accent="bg-emerald-50 text-emerald-700"
        />
        <KpiCard
          icon={Landmark}
          label="Eixos temáticos"
          value={formatNumber(dashboard.casesByAxis.length)}
          detail="Número de eixos analíticos cobertos pelos casos centrais."
          accent="bg-amber-50 text-amber-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Taxa global de judicialização"
          subtitle="Compara decretos e medidas provisórias com total editado, judicializado e intervalo estimado."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboard.typeStats} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip
                content={
                  <RichTooltip
                    formatter={(payload) => {
                      const row = payload[0]?.payload;
                      if (!row) {
                        return [];
                      }
                      return [
                        { label: "Taxa", value: formatPercent(row.rate) },
                        { label: "Normas editadas", value: formatNumber(row.total) },
                        { label: "Normas judicializadas", value: formatNumber(row.judicialized) },
                        { label: "Processos distintos", value: formatNumber(row.processes) },
                        {
                          label: "Intervalo estimado",
                          value: `${formatPercent(row.icLow)} a ${formatPercent(row.icHigh)}`,
                        },
                      ];
                    }}
                  />
                }
              />
              <Bar dataKey="rate" radius={[10, 10, 0, 0]}>
                {dashboard.typeStats.map((item, index) => (
                  <Cell key={item.type} fill={index === 0 ? chartColors.primary : chartColors.secondary} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Distribuição dos casos paradigmáticos por eixo temático"
          subtitle="O gráfico mostra como os 22 processos selecionados como casos centrais se distribuem entre os eixos analíticos definidos na pesquisa."
        >
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={casesByAxis}
                  layout="vertical"
                  margin={{ top: 16, right: 56, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="eixo" width={240} tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={
                      <RichTooltip
                        formatter={(payload) => {
                          const row = payload[0]?.payload;
                          if (!row) {
                            return [];
                          }
                          return [
                            { label: "Eixo temático", value: row.eixo },
                            { label: "Número de casos", value: formatNumber(row.count) },
                            { label: "Percentual do total", value: formatPercent(row.percent) },
                          ];
                        }}
                      />
                    }
                  />
                  <Bar dataKey="count" radius={[0, 10, 10, 0]} fill={chartColors.primary}>
                    <LabelList dataKey="labelValue" position="right" style={{ fill: chartColors.secondary, fontSize: 11 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Esses casos não representam todos os processos da base. Eles são uma seleção qualitativa de processos paradigmáticos, usada para aprofundar a análise institucional.
            </p>
          </div>
        </ChartCard>
      </div>
    </motion.section>
  );
}
