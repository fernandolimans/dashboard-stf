import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Gavel } from "lucide-react";
import { ChartCard } from "@/components/charts/ChartCard";
import { RichTooltip } from "@/components/charts/RichTooltip";
import { DataTable } from "@/components/tables/DataTable";
import { KpiCard } from "@/components/layout/KpiCard";
import { formatDays, formatNumber, formatPercent } from "@/lib/dashboard-data";

export function OutcomesSection({ dashboard }) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Desfechos: decretos x MPs"
          subtitle="Percentual de cada desfecho dentro do conjunto analisado, com comparação direta entre os dois tipos normativos."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboard.outcomes} margin={{ top: 16, right: 24, left: 0, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="desfecho" angle={-32} textAnchor="end" interval={0} height={90} />
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
                        { label: "Decretos (%)", value: formatPercent(row.decretosPct) },
                        { label: "Decretos (qtd)", value: formatNumber(row.decretosQtd) },
                        { label: "MPs (%)", value: formatPercent(row.mpsPct) },
                        { label: "MPs (qtd)", value: formatNumber(row.mpsQtd) },
                      ];
                    }}
                  />
                }
              />
              <Legend />
              <Bar dataKey="decretosPct" name="Decretos" fill="#0f172a" radius={[8, 8, 0, 0]} />
              <Bar dataKey="mpsPct" name="MPs" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Tempo mediano de tramitação"
          subtitle="Agora usando o formato real do JSON público e exibindo as séries de decretos e MPs nos três marcos temporais."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dashboard.timeline} margin={{ top: 16, right: 24, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="marco" angle={-18} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip
                content={
                  <RichTooltip
                    formatter={(payload) => {
                      const row = payload[0]?.payload;
                      if (!row) {
                        return [];
                      }
                      return [
                        { label: "Decretos", value: formatDays(row.decretos) },
                        {
                          label: "Faixa decretos",
                          value: `${formatDays(row.decretosQ25)} a ${formatDays(row.decretosQ75)}`,
                        },
                        { label: "MPs", value: formatDays(row.mps) },
                        { label: "Faixa MPs", value: `${formatDays(row.mpsQ25)} a ${formatDays(row.mpsQ75)}` },
                      ];
                    }}
                  />
                }
              />
              <Legend />
              <Line type="monotone" dataKey="decretos" name="Decretos" stroke="#0f172a" strokeWidth={3} />
              <Line type="monotone" dataKey="mps" name="MPs" stroke="#2563eb" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {dashboard.meritRates.map((item) => (
          <KpiCard
            key={item.type}
            icon={Gavel}
            label={`Procedência no mérito · ${item.label}`}
            value={formatPercent(item.rate)}
            detail={`${formatNumber(item.favorable)} procedências em ${formatNumber(item.decisions)} decisões de mérito.`}
            accent={item.type === "decreto" ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700"}
          />
        ))}
      </div>

      <DataTable
        rows={dashboard.outcomes}
        columns={[
          { key: "desfecho", label: "Desfecho" },
          { key: "decretosQtd", label: "Decretos (qtd)", render: (row) => formatNumber(row.decretosQtd) },
          { key: "decretosPct", label: "Decretos (%)", render: (row) => formatPercent(row.decretosPct) },
          { key: "mpsQtd", label: "MPs (qtd)", render: (row) => formatNumber(row.mpsQtd) },
          { key: "mpsPct", label: "MPs (%)", render: (row) => formatPercent(row.mpsPct) },
        ]}
      />
    </motion.section>
  );
}
