import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { BookOpen, LibraryBig, Layers3, Search } from "lucide-react";
import { ChartCard } from "@/components/charts/ChartCard";
import { RichTooltip } from "@/components/charts/RichTooltip";
import { DataTable } from "@/components/tables/DataTable";
import { KpiCard } from "@/components/layout/KpiCard";
import { formatNumber, formatPercent } from "@/lib/dashboard-data";

function compareWorks(order) {
  return (left, right) => {
    if (order === "title") {
      return left.title.localeCompare(right.title, "pt-BR");
    }
    if (order === "authors") {
      return left.authors.localeCompare(right.authors, "pt-BR");
    }
    if (order === "year") {
      return (right.year ?? 0) - (left.year ?? 0);
    }
    return left.confidence.localeCompare(right.confidence, "pt-BR");
  };
}

export function TheorySection({ theory, literature }) {
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("year");

  const filteredWorks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return theory.coreWorks.filter((item) => !term || item.searchText.includes(term));
  }, [search, theory.coreWorks]);

  const orderedWorks = useMemo(
    () => [...filteredWorks].sort(compareWorks(order)),
    [filteredWorks, order]
  );

  const conceptsTop = useMemo(
    () => [...theory.concepts].sort((left, right) => right.occurrences - left.occurrences),
    [theory.concepts]
  );

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={LibraryBig}
          label="Itens no corpus"
          value={formatNumber(theory.cards.totalCorpus)}
          detail="Soma da revisão sistemática priorizada com a biblioteca curada."
        />
        <KpiCard
          icon={BookOpen}
          label="Revisão sistemática"
          value={formatNumber(theory.cards.totalReview)}
          detail="Registros selecionados para leitura mais próxima."
          accent="bg-blue-50 text-blue-700"
        />
        <KpiCard
          icon={BookOpen}
          label="Obras curadas"
          value={formatNumber(theory.cards.totalCurated)}
          detail="Seleção teórica manual incorporada à camada pública."
          accent="bg-emerald-50 text-emerald-700"
        />
        <KpiCard
          icon={Layers3}
          label="Camadas conceituais"
          value={formatNumber(theory.cards.totalLayers)}
          detail={
            theory.cards.unclassified
              ? `${formatNumber(theory.cards.unclassified)} itens ainda pedem checagem fina.`
              : "Sem itens pendentes de classificação pública."
          }
          accent="bg-amber-50 text-amber-700"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Distribuição do corpus por camada"
          subtitle="Visualiza a espessura relativa da camada nuclear, intermediária, periférica e múltipla."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={theory.layers} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="label" />
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
                        { label: "Itens", value: formatNumber(row.quantity) },
                        { label: "Participação", value: formatPercent(row.percent) },
                      ];
                    }}
                  />
                }
              />
              <Bar dataKey="quantity" fill="#0f172a" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Bases da revisão sistemática"
          subtitle="Resumo público por base de dados, útil para contextualizar a amplitude da busca."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={literature.sourceSummary} layout="vertical" margin={{ top: 16, right: 24, left: 12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="base" width={120} />
              <Tooltip
                content={
                  <RichTooltip
                    formatter={(payload) => {
                      const row = payload[0]?.payload;
                      if (!row) {
                        return [];
                      }
                      return [{ label: "Registros únicos", value: formatNumber(row.count) }];
                    }}
                  />
                }
              />
              <Bar dataKey="count" fill="#1d4ed8" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[1fr_240px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título, autoria, conceito mobilizado ou origem..."
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <select
            value={order}
            onChange={(event) => setOrder(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="year">Ordenar por ano</option>
            <option value="title">Ordenar por título</option>
            <option value="authors">Ordenar por autoria</option>
            <option value="confidence">Ordenar por confiança</option>
          </select>
        </div>
      </div>

      <DataTable
        rows={orderedWorks}
        columns={[
          { key: "title", label: "Obra central" },
          { key: "authors", label: "Autoria" },
          { key: "year", label: "Ano", render: (row) => row.year ?? "n/d" },
          { key: "sourceType", label: "Tipo de fonte" },
          { key: "source", label: "Origem" },
          { key: "confidence", label: "Confiança" },
          { key: "concepts", label: "Conceitos mobilizados" },
        ]}
      />

      <DataTable
        rows={conceptsTop}
        columns={[
          { key: "label", label: "Conceito" },
          { key: "layer", label: "Camada" },
          { key: "occurrences", label: "Ocorrências", render: (row) => formatNumber(row.occurrences) },
          { key: "searchPatterns", label: "Padrões de busca" },
        ]}
      />
    </motion.section>
  );
}
