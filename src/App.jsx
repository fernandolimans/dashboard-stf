import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  Scale,
  Search,
  Filter,
  FileText,
  Landmark,
  Clock3,
  Gavel,
  Users,
  BarChart3,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import pesquisa from "./data/pesquisa.json";

const tabs = [
  { id: "geral", label: "Visão geral", icon: BarChart3 },
  { id: "governo", label: "Por governo", icon: Landmark },
  { id: "tema", label: "Por tema", icon: ShieldAlert },
  { id: "desfechos", label: "Desfechos", icon: Gavel },
  { id: "casos", label: "Casos centrais", icon: FileText },
];

const chartPalette = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1", "#f59e0b"];
const tipoLabels = {
  decreto: "Decretos",
  mp: "Medidas provisórias",
};
const tipoCurto = {
  decreto: "Decreto",
  mp: "MP",
};
const marcoLabels = {
  diasAtePrimeiraMonocratica: "1ª decisão monocrática",
  diasAtePrimeiraColegiada: "1ª decisão colegiada",
  diasAteDecisaoFinal: "Decisão final",
};

function formatPct(value) {
  if (value === null || value === undefined) {
    return "n/d";
  }

  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}%`;
}

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "n/d";
  }
  return value.toLocaleString("pt-BR");
}

function formatInterval(low, high) {
  if (low === null || high === null) {
    return "n/d";
  }
  return `${formatPct(low)} a ${formatPct(high)}`;
}

function sanitizeLabel(value) {
  if (!value) {
    return "Não informado";
  }

  return value
    .replaceAll("Luiz Inacio", "Luiz Inácio")
    .replaceAll("Seguranca", "Segurança")
    .replaceAll("Administracao", "Administração")
    .replaceAll("Informacao", "Informação")
    .replaceAll("Governanca", "Governança")
    .replaceAll("Participacao", "Participação");
}

function buildComparacao(taxa, media) {
  if (!taxa) {
    return "sem judicialização";
  }

  const razao = media ? taxa / media : 1;
  if (razao >= 2) {
    return "muito acima da média";
  }
  if (razao >= 1.2) {
    return "acima da média";
  }
  if (razao <= 0.6) {
    return "abaixo da média";
  }
  return "na média";
}

function buildDashboardData(data) {
  const taxaPorTipo = Object.fromEntries(
    data.provocacaoSeletiva.tipoAto.map((item) => [item.tipoNorma, item.taxaJudicializacao])
  );

  const judicializacaoGlobal = data.provocacaoSeletiva.tipoAto.map((item) => ({
    tipo: tipoLabels[item.tipoNorma] ?? item.tipoNorma,
    total: item.totalNormasBase,
    judicializadas: item.normasJudicializadas,
    processos: item.processosDistintos,
    taxa: item.taxaJudicializacao,
    icLow: item.taxaIcLow,
    icHigh: item.taxaIcHigh,
  }));

  const porGoverno = data.provocacaoSeletiva.porGoverno.map((item) => ({
    governo: sanitizeLabel(item.governo),
    tipo: tipoCurto[item.tipoNorma] ?? item.tipoNorma,
    total: item.totalNormasBase,
    judicializadas: item.normasJudicializadas,
    processos: item.processosDistintos,
    taxa: item.taxaJudicializacao,
    comparacao: buildComparacao(item.taxaJudicializacao, taxaPorTipo[item.tipoNorma]),
  }));

  const porTema = data.provocacaoSeletiva.porAssunto.map((item) => ({
    tipo: tipoCurto[item.tipoNorma] ?? item.tipoNorma,
    tema: item.assunto,
    total: item.totalNormasBase,
    judicializadas: item.normasJudicializadas,
    taxa: item.taxaJudicializacao,
  }));

  const desfechosMap = new Map();
  for (const item of data.intensidadeMerito.desfechos) {
    const row = desfechosMap.get(item.desfechoCategoria) ?? {
      desfecho: item.desfechoCategoria,
      decretosQtd: 0,
      decretosPct: 0,
      mpsQtd: 0,
      mpsPct: 0,
    };

    if (item.tipoNorma === "decreto") {
      row.decretosQtd = item.nProcessos;
      row.decretosPct = item.participacao;
    } else if (item.tipoNorma === "mp") {
      row.mpsQtd = item.nProcessos;
      row.mpsPct = item.participacao;
    }

    desfechosMap.set(item.desfechoCategoria, row);
  }
  const desfechos = [...desfechosMap.values()];

  const tempos = data.meritoTemporalidade.temposDescritivos.map((item) => ({
    tipoNorma: item.tipoNorma,
    marcoOriginal: item.marco,
    marco: marcoLabels[item.marco] ?? item.marco,
    decretos: item.tipoNorma === "decreto" ? item.mediana : null,
    mps: item.tipoNorma === "mp" ? item.mediana : null,
    unidade: "dias",
  }));

  const tempoMap = new Map();
  for (const item of tempos) {
    const row = tempoMap.get(item.marcoOriginal) ?? {
      marcoOriginal: item.marcoOriginal,
      marco: item.marco,
      decretos: null,
      mps: null,
      unidade: "dias",
    };

    if (item.tipoNorma === "decreto") {
      row.decretos = item.decretos;
    }
    if (item.tipoNorma === "mp") {
      row.mps = item.mps;
    }

    tempoMap.set(item.marcoOriginal, row);
  }

  const tempo = [
    tempoMap.get("diasAtePrimeiraMonocratica"),
    tempoMap.get("diasAtePrimeiraColegiada"),
    tempoMap.get("diasAteDecisaoFinal"),
  ].filter(Boolean);

  const merito = data.meritoTemporalidade.procedencia.map((item) => ({
    tipo: tipoLabels[item.tipoNorma] ?? item.tipoNorma,
    decisoes: item.nDecisoesMerito,
    procedencias: item.nProcedentes,
    taxa: item.taxa,
    faixa: formatInterval(item.taxaIcLow, item.taxaIcHigh),
  }));

  const casosCentrais = data.casosParadigmaticos.lista.map((item) => ({
    processo: item.processo,
    norma: item.tiposAto?.includes("mp") && !item.tiposAto?.includes("decreto") ? "MP" : "Decreto",
    governo: sanitizeLabel(
      item.governoAutuacao ?? item.governosEmissores?.split(";")[0]?.trim() ?? "Não informado"
    ),
    decisao: item.decisaoFinalTipo ?? item.desfechoCategoria ?? "Não informado",
    amici: item.nAmicusCuriae ?? 0,
    eixo: sanitizeLabel(item.eixoTematico),
    linkProcesso: item.linkProcesso,
  }));

  const casosPorEixo = Array.from(
    casosCentrais.reduce((map, caso) => {
      map.set(caso.eixo, (map.get(caso.eixo) || 0) + 1);
      return map;
    }, new Map()),
    ([eixo, qtd]) => ({ eixo, qtd })
  );

  const diagnostico = Object.fromEntries(
    data.visaoGeral.diagnostico.map((item) => [item.item, item.valor])
  );
  const indicadores = Object.fromEntries(
    data.visaoGeral.tabelaSintese.map((item) => [item.indicador, item])
  );

  return {
    judicializacaoGlobal,
    porGoverno,
    porTema,
    desfechos,
    tempo,
    merito,
    casosCentrais,
    casosPorEixo,
    diagnostico,
    indicadores,
  };
}

const dashboard = buildDashboardData(pesquisa);

function KpiCard({ icon: Icon, label, value, detail }) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-2 text-sm leading-snug text-slate-600">{detail}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <div className="h-[20rem] w-full sm:h-[22rem]">{children}</div>
      </CardContent>
    </Card>
  );
}

function DataTable({ rows, columns }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-900 text-white">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`${row.processo || row.governo || row.tema || row.desfecho}-${index}`}
                className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
              >
                {columns.map((col) => (
                  <td key={col.key} className="border-t border-slate-100 px-4 py-3 text-slate-700">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("geral");
  const [tipo, setTipo] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [eixo, setEixo] = useState("Todos");

  const governoFiltrado = useMemo(
    () => dashboard.porGoverno.filter((item) => tipo === "Todos" || item.tipo === tipo),
    [tipo]
  );

  const temaFiltrado = useMemo(
    () => dashboard.porTema.filter((item) => tipo === "Todos" || item.tipo === tipo),
    [tipo]
  );

  const eixos = useMemo(
    () => ["Todos", ...Array.from(new Set(dashboard.casosCentrais.map((c) => c.eixo)))],
    []
  );

  const casosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return dashboard.casosCentrais.filter((caso) => {
      const passaBusca =
        !termo || Object.values(caso).join(" ").toLowerCase().includes(termo);
      const passaEixo = eixo === "Todos" || caso.eixo === eixo;
      return passaBusca && passaEixo;
    });
  }, [busca, eixo]);

  const casosBolsonaro = dashboard.casosCentrais.filter((c) =>
    c.governo.toLowerCase().includes("bolsonaro")
  ).length;
  const topAmici = [...dashboard.casosCentrais]
    .sort((a, b) => b.amici - a.amici)
    .slice(0, 5);

  const taxaDecretos =
    dashboard.judicializacaoGlobal.find((item) => item.tipo === "Decretos")?.taxa ?? 0;
  const taxaMps =
    dashboard.judicializacaoGlobal.find((item) => item.tipo === "Medidas provisórias")?.taxa ?? 0;
  const tempoDecretoColegiado =
    dashboard.tempo.find((item) => item.marcoOriginal === "diasAtePrimeiraColegiada")?.decretos ?? 0;
  const tempoMpColegiado =
    dashboard.tempo.find((item) => item.marcoOriginal === "diasAtePrimeiraColegiada")?.mps ?? 0;

  const destaqueApresentacao = [
    {
      icon: ShieldAlert,
      titulo: "MPs concentram o maior risco",
      texto: `A taxa de judicialização das MPs (${formatPct(taxaMps)}) supera amplamente a dos decretos (${formatPct(taxaDecretos)}).`,
    },
    {
      icon: Landmark,
      titulo: "Bolsonaro domina os casos centrais",
      texto: `${casosBolsonaro} dos ${dashboard.casosCentrais.length} processos paradigmáticos se concentram nesse período presidencial.`,
    },
    {
      icon: Clock3,
      titulo: "Colegiado demora bem mais em decretos",
      texto: `A primeira decisão colegiada leva ${formatNumber(tempoDecretoColegiado)} dias em decretos contra ${formatNumber(tempoMpColegiado)} dias em MPs.`,
    },
  ];

  return (
    <div className="min-h-screen bg-transparent px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
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
                intensidade do controle, temporalidade e casos paradigmáticos.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
              <p className="font-semibold text-white">Universo analisado</p>
              <p className="mt-1">
                {formatNumber(dashboard.diagnostico["Decretos no periodo"])} decretos ·{" "}
                {formatNumber(dashboard.diagnostico["MPs no periodo"])} MPs ·{" "}
                {formatNumber(
                  dashboard.indicadores["Processos distintos contra atos presidenciais"]?.valor
                )}{" "}
                processos
              </p>
              <p className="mt-1">
                Cruzamento:{" "}
                {formatNumber(
                  dashboard.indicadores[
                    "Pares processo-norma (unidade analitica primaria)"
                  ]?.valor
                )}{" "}
                pares processo-norma
              </p>
            </div>
          </div>
        </motion.header>

        <div className="sticky top-4 z-20 mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-white/60 bg-white/85 p-2 shadow-sm backdrop-blur">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant={isActive ? "default" : "ghost"}
                className={`shrink-0 rounded-xl ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-700"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {destaqueApresentacao.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.titulo}
                className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-sm"
              >
                <CardContent className="flex gap-4 p-5">
                  <div className="rounded-2xl bg-slate-950 p-3 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Destaque
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                      {item.titulo}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.texto}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {activeTab === "geral" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                icon={FileText}
                label="Normas judicializadas"
                value={formatNumber(
                  dashboard.judicializacaoGlobal.reduce(
                    (total, item) => total + (item.judicializadas ?? 0),
                    0
                  )
                )}
                detail="Total de decretos e MPs judicializados no recorte da dissertação."
              />
              <KpiCard
                icon={Gavel}
                label="Processos distintos"
                value={formatNumber(
                  dashboard.indicadores["Processos distintos contra atos presidenciais"]?.valor
                )}
                detail="Processos de controle concentrado contra atos presidenciais."
              />
              <KpiCard
                icon={ShieldAlert}
                label="Taxa das MPs"
                value={formatPct(taxaMps)}
                detail={`Contra ${formatPct(taxaDecretos)} nos decretos, com IC próprio no extrator.`}
              />
              <KpiCard
                icon={Landmark}
                label="Casos centrais Bolsonaro"
                value={`${casosBolsonaro}/${dashboard.casosCentrais.length}`}
                detail="Casos paradigmáticos associados a esse governo no painel."
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Taxa global de judicialização" subtitle="Comparação entre decretos e medidas provisórias.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.judicializacaoGlobal} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="tipo" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, "Taxa"]} />
                    <Bar dataKey="taxa" fill="#0f172a" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Casos centrais por eixo temático" subtitle="Distribuição dos processos paradigmáticos selecionados.">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dashboard.casosPorEixo} dataKey="qtd" nameKey="eixo" outerRadius={105}>
                      {dashboard.casosPorEixo.map((entry, index) => (
                        <Cell key={entry.eixo} fill={chartPalette[index % chartPalette.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </motion.section>
        )}

        {activeTab === "governo" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
            <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Taxa de judicialização por governo</h2>
                <p className="text-sm text-slate-500">Use o filtro para alternar entre decretos e MPs.</p>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <select value={tipo} onChange={(event) => setTipo(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option>Todos</option>
                  <option>Decreto</option>
                  <option>MP</option>
                </select>
              </div>
            </div>

            <ChartCard title="Governos com maior judicialização" subtitle="A taxa é percentual dentro de cada governo e tipo de ato.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={governoFiltrado} margin={{ top: 10, right: 20, left: 0, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="governo" angle={-35} textAnchor="end" interval={0} height={90} />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value, name) => (name === "taxa" ? [`${value}%`, "Taxa"] : value)} />
                  <Bar dataKey="taxa" fill="#1d4ed8" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <DataTable
              rows={governoFiltrado}
              columns={[
                { key: "governo", label: "Governo" },
                { key: "tipo", label: "Tipo" },
                { key: "total", label: "Total editado", render: (row) => formatNumber(row.total) },
                { key: "judicializadas", label: "Judicializadas" },
                { key: "taxa", label: "Taxa", render: (row) => formatPct(row.taxa) },
                { key: "comparacao", label: "Comparação" },
              ]}
            />
          </motion.section>
        )}

        {activeTab === "tema" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
            <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Taxa de judicialização por tema</h2>
                <p className="text-sm text-slate-500">Mostra quais matérias são mais frequentemente questionadas.</p>
              </div>
              <select value={tipo} onChange={(event) => setTipo(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <option>Todos</option>
                <option>Decreto</option>
                <option>MP</option>
              </select>
            </div>

            <ChartCard title="Temas mais judicializados" subtitle="A tabela abaixo mantém os números completos.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={temaFiltrado} layout="vertical" margin={{ top: 10, right: 30, left: 220, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="tema" width={220} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`${value}%`, "Taxa"]} />
                  <Bar dataKey="taxa" fill="#0f766e" radius={[0, 10, 10, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <DataTable
              rows={temaFiltrado}
              columns={[
                { key: "tipo", label: "Tipo" },
                { key: "tema", label: "Tema" },
                { key: "total", label: "Total editado", render: (row) => formatNumber(row.total) },
                { key: "judicializadas", label: "Judicializadas" },
                { key: "taxa", label: "Taxa", render: (row) => formatPct(row.taxa) },
              ]}
            />
          </motion.section>
        )}

        {activeTab === "desfechos" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Desfechos: decretos x MPs" subtitle="Percentual de cada desfecho no conjunto analisado.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.desfechos} margin={{ top: 10, right: 20, left: 0, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="desfecho" angle={-35} textAnchor="end" interval={0} height={90} />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, "Percentual"]} />
                    <Legend />
                    <Bar dataKey="decretosPct" name="Decretos" fill="#0f172a" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="mpsPct" name="MPs" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Tempo mediano de tramitação" subtitle="Valores em dias. MPs são processadas mais rapidamente em marcos centrais.">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboard.tempo} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="marco" angle={-18} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} dias`, "Mediana"]} />
                    <Legend />
                    <Line type="monotone" dataKey="decretos" name="Decretos" stroke="#0f172a" strokeWidth={3} />
                    <Line type="monotone" dataKey="mps" name="MPs" stroke="#2563eb" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {dashboard.merito.map((item) => (
                <KpiCard
                  key={item.tipo}
                  icon={Gavel}
                  label={`Mérito · ${item.tipo}`}
                  value={formatPct(item.taxa)}
                  detail={`${item.procedencias} procedências em ${item.decisoes} decisões de mérito. Faixa estatística: ${item.faixa}.`}
                />
              ))}
            </div>

            <DataTable
              rows={dashboard.desfechos}
              columns={[
                { key: "desfecho", label: "Desfecho" },
                { key: "decretosQtd", label: "Decretos (qtd)" },
                { key: "decretosPct", label: "Decretos (%)", render: (row) => formatPct(row.decretosPct) },
                { key: "mpsQtd", label: "MPs (qtd)" },
                { key: "mpsPct", label: "MPs (%)", render: (row) => formatPct(row.mpsPct) },
              ]}
            />
          </motion.section>
        )}

        {activeTab === "casos" && (
          <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <KpiCard
                icon={FileText}
                label="Casos paradigmáticos"
                value={formatNumber(dashboard.casosCentrais.length)}
                detail="Processos que concentram efeito institucional relevante."
              />
              <KpiCard
                icon={Landmark}
                label="Bolsonaro"
                value={formatNumber(casosBolsonaro)}
                detail="Casos centrais associados a esse governo no painel."
              />
              <KpiCard
                icon={Users}
                label="Maior número de amici"
                value={formatNumber(topAmici[0]?.amici ?? 0)}
                detail={`${topAmici[0]?.processo ?? "n/d"} é o caso com maior participação de amici curiae.`}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Top 5 por amici curiae" subtitle="Casos com maior participação externa.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topAmici} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="processo" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amici" fill="#7c3aed" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Casos por eixo" subtitle="Agrupamento dos casos paradigmáticos.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.casosPorEixo} layout="vertical" margin={{ top: 10, right: 20, left: 220, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="eixo" width={220} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="qtd" fill="#be123c" radius={[0, 10, 10, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-[1fr_280px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Buscar por processo, governo, decisão ou eixo..."
                    className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-500"
                  />
                </div>
                <select value={eixo} onChange={(event) => setEixo(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  {eixos.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <DataTable
              rows={casosFiltrados}
              columns={[
                {
                  key: "processo",
                  label: "Processo",
                  render: (row) =>
                    row.linkProcesso ? (
                      <a href={row.linkProcesso} target="_blank" rel="noreferrer" className="text-slate-900 underline decoration-slate-300 underline-offset-4">
                        {row.processo}
                      </a>
                    ) : (
                      row.processo
                    ),
                },
                { key: "norma", label: "Norma alvo" },
                { key: "governo", label: "Governo" },
                { key: "decisao", label: "Decisão" },
                { key: "amici", label: "Amici" },
                { key: "eixo", label: "Eixo temático" },
              ]}
            />
          </motion.section>
        )}

        <footer className="mt-8 rounded-2xl bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm">
          <p>
            Camada pública gerada a partir de{" "}
            {pesquisa.meta.arquivosFonte.map((item) => item.arquivo).join(", ")}. As abas
            técnicas permanecem fora do JSON bruto e são usadas apenas para contexto
            metodológico e auditoria da extração.
          </p>
        </footer>
      </div>
    </div>
  );
}
