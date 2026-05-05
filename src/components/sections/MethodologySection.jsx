import { motion } from "framer-motion";
import { Database, Link2, Scale, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/layout/KpiCard";
import { formatNumber } from "@/lib/dashboard-data";

function MethodCard({ title, description }) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}

const glossaryItems = [
  {
    term: "Procedente",
    definition: "O tribunal acolhe o pedido principal e reconhece a inconstitucionalidade ou a validade nos termos requeridos.",
  },
  {
    term: "Procedente em parte",
    definition: "O tribunal acolhe apenas parte do pedido, com efeitos mais limitados do que os pleiteados integralmente.",
  },
  {
    term: "Improcedente",
    definition: "O pedido é rejeitado no mérito e o tribunal não concede a tutela constitucional pretendida.",
  },
  {
    term: "Prejudicada",
    definition: "O julgamento perde objeto porque o ato impugnado mudou, cessou ou deixou de produzir efeito relevante.",
  },
  {
    term: "Negado seguimento",
    definition: "O processo não avança porque o relator identifica óbice processual suficiente para barrar sua tramitação.",
  },
  {
    term: "Não conhecida",
    definition: "O tribunal entende que a ação não preenche requisitos formais mínimos para exame do mérito.",
  },
  {
    term: "Extinta",
    definition: "O processo é encerrado sem exame substancial completo, normalmente por vício processual ou perda superveniente de objeto.",
  },
];

export function MethodologySection({ methodology, limits, excludedSheets }) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Database}
          label="Universo analisado"
          value={formatNumber(methodology.universe.totalNormative)}
          detail={`${formatNumber(methodology.universe.decrees)} decretos e ${formatNumber(methodology.universe.mps)} MPs no período.`}
        />
        <KpiCard
          icon={Link2}
          label="Pares processo–norma"
          value={formatNumber(methodology.universe.processNormPairs)}
          detail="Unidade primária de observação usada para cruzar processo e ato impugnado."
          accent="bg-blue-50 text-blue-700"
        />
        <KpiCard
          icon={Scale}
          label="Processos com evidência"
          value={formatNumber(methodology.universe.processCount)}
          detail="Processos com referências casadas ao universo normativo analisado."
          accent="bg-emerald-50 text-emerald-700"
        />
        <KpiCard
          icon={ShieldAlert}
          label="Normas judicializadas"
          value={formatNumber(methodology.universe.judicializedNorms)}
          detail={`${formatNumber(methodology.universe.unmatchedReferences)} referências ficaram sem pareamento automático.`}
          accent="bg-amber-50 text-amber-700"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <MethodCard title="Universo analisado" description={methodology.extraction.period} />
        <MethodCard title="Unidade processo–norma" description={methodology.extraction.unit} />
        <MethodCard title="Critério de judicialização" description={methodology.extraction.judicializationCriteria} />
        <MethodCard title="Cruzamento estrito" description={methodology.extraction.strictMatch} />
        <MethodCard title="Cruzamento controlado" description={methodology.extraction.controlledMatch} />
        <MethodCard title="Tratamento de referências especiais" description={methodology.extraction.decreeLawTreatment} />
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-lg font-semibold text-slate-950">Glossário processual mínimo</h3>
          <p className="mt-2 text-sm text-slate-500">
            Leitura breve dos principais desfechos para leitor estrangeiro.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {glossaryItems.map((item) => (
              <div key={item.term} className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{item.term}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.definition}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-lg font-semibold text-slate-950">Limites da pesquisa</h3>
          <div className="mt-3 space-y-3">
            {limits.map((item) => (
              <p key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                {item}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-lg font-semibold text-slate-950">Abas técnicas fora da camada pública</h3>
          <p className="mt-2 text-sm text-slate-500">
            Permanecem úteis para auditoria, mas não são publicadas como JSON bruto no dashboard.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {excludedSheets.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}
