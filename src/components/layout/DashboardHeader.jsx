import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import { formatNumber } from "@/lib/dashboard-data";

export function DashboardHeader({ processCount, pairCount, decrees, mps }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-lg md:p-8"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
            <Scale className="h-4 w-4" /> Pesquisa empírica · STF · 1988-2025
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Controle supremo dos atos presidenciais
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">
            Painel interativo alimentado por extração reprodutível das planilhas da
            dissertação, cobrindo judicialização de decretos e medidas provisórias,
            intensidade do controle, temporalidade, casos paradigmáticos e a base teórica
            que sustenta a pesquisa.
          </p>
        </div>

        <div className="rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
          <p className="font-semibold text-white">Universo analisado</p>
          <p className="mt-1">
            {formatNumber(decrees)} decretos · {formatNumber(mps)} MPs ·{" "}
            {formatNumber(processCount)} processos
          </p>
          <p className="mt-1">
            Unidade analítica: {formatNumber(pairCount)} pares processo–norma
          </p>
        </div>
      </div>
    </motion.header>
  );
}
