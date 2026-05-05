import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Search, FileText, Landmark, Users } from "lucide-react";
import { ChartCard } from "@/components/charts/ChartCard";
import { RichTooltip } from "@/components/charts/RichTooltip";
import { DataTable } from "@/components/tables/DataTable";
import { KpiCard } from "@/components/layout/KpiCard";
import { chartColors, formatDays, formatNumber, formatPercent } from "@/lib/dashboard-data";

function truncateAxis(value, max = 22) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function compareRows(order) {
  return (left, right) => {
    if (order === "processo") {
      return left.processo.localeCompare(right.processo, "pt-BR");
    }
    if (order === "governo") {
      return left.governo.localeCompare(right.governo, "pt-BR");
    }
    if (order === "eixo") {
      return left.eixo.localeCompare(right.eixo, "pt-BR");
    }
    return (right[order] ?? 0) - (left[order] ?? 0);
  };
}

export function CasesSection({ rows, axisOptions }) {
  const [search, setSearch] = useState("");
  const [axis, setAxis] = useState("all");
  const [order, setOrder] = useState("indiceParadigmaticidade");

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !term || row.searchText.includes(term);
      const matchesAxis = axis === "all" || row.eixo === axis;
      return matchesSearch && matchesAxis;
    });
  }, [axis, rows, search]);

  const orderedRows = useMemo(() => [...filteredRows].sort(compareRows(order)), [filteredRows, order]);

  const topAmici = orderedRows
    .slice()
    .sort((left, right) => right.amici - left.amici)
    .slice(0, 5);

  const axisRows = Array.from(
    orderedRows.reduce((map, item) => {
      map.set(item.eixo, (map.get(item.eixo) || 0) + 1);
      return map;
    }, new Map()),
    ([eixo, count]) => ({
      eixo,
      count,
      percent: orderedRows.length ? (count / orderedRows.length) * 100 : 0,
    })
  ).sort((left, right) => right.count - left.count);

  const bolsonaroCases = orderedRows.filter((item) => item.governo.includes("Bolsonaro")).length;
  const topAmiciCase = topAmici[0];

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          icon={FileText}
          label="Casos paradigmáticos visíveis"
          value={formatNumber(orderedRows.length)}
          detail="Quantidade após aplicar filtros globais e busca textual da aba."
        />
        <KpiCard
          icon={Landmark}
          label="Casos do período Bolsonaro"
          value={formatNumber(bolsonaroCases)}
          detail="Recorte útil para visualizar concentração política do contencioso."
          accent="bg-blue-50 text-blue-700"
        />
        <KpiCard
          icon={Users}
          label="Maior número de amici"
          value={formatNumber(topAmiciCase?.amici ?? 0)}
          detail={topAmiciCase ? `${topAmiciCase.processo} lidera o conjunto atual.` : "Sem casos no recorte."}
          accent="bg-emerald-50 text-emerald-700"
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1fr_240px_220px]">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por processo, ato, governo, decisão, tema ou eixo..."
              className="w-full min-w-0 rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <select
            value={axis}
            onChange={(event) => setAxis(event.target.value)}
            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {axisOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={order}
            onChange={(event) => setOrder(event.target.value)}
            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="indiceParadigmaticidade">Ordenar por índice paradigmático</option>
            <option value="amici">Ordenar por amici</option>
            <option value="diasAteDecisaoFinal">Ordenar por tempo até decisão final</option>
            <option value="governo">Ordenar por governo</option>
            <option value="eixo">Ordenar por eixo</option>
            <option value="processo">Ordenar por processo</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Top 5 por amici curiae" subtitle="Mostra os casos com maior mobilização externa no recorte filtrado.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topAmici} margin={{ top: 16, right: 24, left: 0, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="processo" />
              <YAxis allowDecimals={false} />
              <Tooltip
                content={
                  <RichTooltip
                    formatter={(payload) => {
                      const row = payload[0]?.payload;
                      if (!row) {
                        return [];
                      }
                      return [
                        { label: "Amici curiae", value: formatNumber(row.amici) },
                        { label: "Decisão final", value: row.decisao },
                        { label: "Tempo até decisão final", value: formatDays(row.diasAteDecisaoFinal) },
                      ];
                    }}
                  />
                }
              />
              <Bar dataKey="amici" fill={chartColors.secondary} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Casos por eixo temático" subtitle="A distribuição acompanha o filtro da aba e mantém tooltip com contagem e participação.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={axisRows} layout="vertical" margin={{ top: 16, right: 24, left: 40, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="eixo"
                width={140}
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => truncateAxis(value)}
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
                        { label: "Casos", value: formatNumber(row.count) },
                        { label: "Participação", value: formatPercent(row.percent) },
                      ];
                    }}
                  />
                }
              />
              <Bar dataKey="count" fill={chartColors.accent} radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <DataTable
        rows={orderedRows}
        columns={[
          {
            key: "processo",
            label: "Processo",
            render: (row) =>
              row.linkProcesso ? (
                <a
                  href={row.linkProcesso}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4"
                >
                  {row.processo}
                </a>
              ) : (
                row.processo
              ),
          },
          { key: "actTypeLabel", label: "Tipo de ato" },
          { key: "governo", label: "Governo" },
          { key: "decisao", label: "Decisão" },
          { key: "eixo", label: "Eixo temático" },
          { key: "amici", label: "Amici", render: (row) => formatNumber(row.amici) },
          {
            key: "diasAteDecisaoFinal",
            label: "Tempo até decisão final",
            render: (row) => formatDays(row.diasAteDecisaoFinal),
          },
        ]}
      />

      <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
        ADI, ADC e ADPF são classes processuais do controle concentrado de constitucionalidade no Supremo Tribunal Federal brasileiro. ADI = Ação Direta de Inconstitucionalidade; ADC = Ação Declaratória de Constitucionalidade; ADPF = Arguição de Descumprimento de Preceito Fundamental.
      </p>
    </motion.section>
  );
}
