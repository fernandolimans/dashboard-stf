import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Filter } from "lucide-react";
import { ChartCard } from "@/components/charts/ChartCard";
import { RichTooltip } from "@/components/charts/RichTooltip";
import { DataTable } from "@/components/tables/DataTable";
import { chartColors, formatNumber, formatPercent } from "@/lib/dashboard-data";

function truncateGovernment(value, max = 18) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function GovernmentChart({ data, title }) {
  return (
    <ChartCard
      title={title}
      subtitle="Ordenado em ordem decrescente por taxa de judicialização."
      height="h-[28rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 16, right: 24, left: 40, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis type="number" tickFormatter={(value) => `${value}%`} />
          <YAxis
            type="category"
            dataKey="government"
            width={140}
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => truncateGovernment(value)}
          />
          <Tooltip
            content={
              <RichTooltip
                formatter={(payload) => {
                  const row = payload[0]?.payload;
                  if (!row) {
                    return [];
                  }
                  return [
                    { label: "Governo", value: row.government },
                    { label: "Taxa", value: formatPercent(row.rate) },
                    { label: "Total editado", value: formatNumber(row.total) },
                    { label: "Judicializados", value: formatNumber(row.judicialized) },
                  ];
                }}
              />
            }
          />
          <Bar dataKey="rate" radius={[0, 10, 10, 0]} fill={chartColors.secondary} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function GovernmentBlock({ title, rows }) {
  return (
    <section className="space-y-4">
      <GovernmentChart data={rows} title={title} />
      <DataTable
        rows={rows}
        columns={[
          { key: "government", label: "Governo" },
          { key: "total", label: "Total editado", render: (row) => formatNumber(row.total) },
          { key: "judicialized", label: "Judicializados", render: (row) => formatNumber(row.judicialized) },
          { key: "rate", label: "Taxa", render: (row) => formatPercent(row.rate) },
        ]}
      />
    </section>
  );
}

export function GovernmentSection({ rows, selectedType }) {
  const [view, setView] = useState("all");
  const effectiveView = selectedType === "all" ? view : selectedType;

  const sortedRows = useMemo(
    () => [...rows].sort((left, right) => (right.rate ?? 0) - (left.rate ?? 0)),
    [rows]
  );

  const decrees = sortedRows.filter((item) => item.type === "decreto");
  const mps = sortedRows.filter((item) => item.type === "mp");

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Judicialização por governo emissor</h2>
          <p className="text-sm text-slate-500">
            A taxa indica a proporção de atos judicializados dentro do total de atos editados por cada governo, separadamente para decretos e medidas provisórias.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Exibir</span>
            <select
              value={effectiveView}
              onChange={(event) => setView(event.target.value)}
              disabled={selectedType !== "all"}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-60"
            >
              <option value="all">Todos</option>
              <option value="decreto">Decretos</option>
              <option value="mp">MPs</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
        A leitura correta é intragrupo: compare decretos com decretos e MPs com MPs. Como os universos normativos são muito diferentes, a taxa é mais informativa que o número absoluto.
      </div>

      {effectiveView === "all" ? (
        <div className="space-y-8">
          <GovernmentBlock title="Decretos por governo" rows={decrees} />
          <GovernmentBlock title="Medidas provisórias por governo" rows={mps} />
        </div>
      ) : effectiveView === "decreto" ? (
        <GovernmentBlock title="Decretos por governo" rows={decrees} />
      ) : (
        <GovernmentBlock title="Medidas provisórias por governo" rows={mps} />
      )}
    </motion.section>
  );
}
