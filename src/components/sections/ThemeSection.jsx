import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Filter } from "lucide-react";
import { ChartCard } from "@/components/charts/ChartCard";
import { RichTooltip } from "@/components/charts/RichTooltip";
import { DataTable } from "@/components/tables/DataTable";
import { formatNumber, formatPercent } from "@/lib/dashboard-data";

function compareBy(field) {
  return (left, right) => {
    if (field === "theme") {
      return left.theme.localeCompare(right.theme, "pt-BR");
    }
    return (right[field] ?? 0) - (left[field] ?? 0);
  };
}

function ThemeChart({ data, title }) {
  return (
    <ChartCard
      title={title}
      subtitle="É possível ordenar por taxa, volume total editado ou total judicializado."
      height="h-[30rem]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 16, right: 24, left: 40, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
          <XAxis type="number" tickFormatter={(value) => `${value}%`} />
          <YAxis type="category" dataKey="theme" width={220} tick={{ fontSize: 11 }} />
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
                    { label: "Total editado", value: formatNumber(row.total) },
                    { label: "Total judicializado", value: formatNumber(row.judicialized) },
                  ];
                }}
              />
            }
          />
          <Bar dataKey="rate" radius={[0, 10, 10, 0]} fill="#0f766e" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ThemeSection({ rows, selectedType }) {
  const [view, setView] = useState("all");
  const [order, setOrder] = useState("rate");

  const effectiveView = selectedType === "all" ? view : selectedType;
  const sortedRows = useMemo(() => [...rows].sort(compareBy(order)), [order, rows]);
  const decrees = sortedRows.filter((item) => item.type === "decreto");
  const mps = sortedRows.filter((item) => item.type === "mp");

  const tableRows = useMemo(() => {
    if (effectiveView === "decreto") {
      return decrees;
    }
    if (effectiveView === "mp") {
      return mps;
    }
    return sortedRows;
  }, [decrees, effectiveView, mps, sortedRows]);

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Temas mais judicializados</h2>
          <p className="text-sm text-slate-500">
            Decretos e MPs podem ser comparados lado a lado ou isoladamente, com ordenação por métrica.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Visualização</span>
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

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Ordenação</span>
            <select
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="rate">Taxa</option>
              <option value="total">Total editado</option>
              <option value="judicialized">Total judicializado</option>
              <option value="theme">Ordem alfabética</option>
            </select>
          </label>
        </div>
      </div>

      {effectiveView === "all" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ThemeChart data={decrees} title="Temas em decretos" />
          <ThemeChart data={mps} title="Temas em MPs" />
        </div>
      ) : (
        <ThemeChart
          data={effectiveView === "decreto" ? decrees : mps}
          title={effectiveView === "decreto" ? "Temas em decretos" : "Temas em MPs"}
        />
      )}

      <DataTable
        rows={tableRows}
        columns={[
          { key: "typeShort", label: "Tipo" },
          { key: "theme", label: "Tema" },
          { key: "total", label: "Total editado", render: (row) => formatNumber(row.total) },
          {
            key: "judicialized",
            label: "Total judicializado",
            render: (row) => formatNumber(row.judicialized),
          },
          { key: "rate", label: "Taxa", render: (row) => formatPercent(row.rate) },
        ]}
      />
    </motion.section>
  );
}
