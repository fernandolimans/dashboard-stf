const typeLabels = {
  decreto: "Decretos",
  mp: "MPs",
};

const typeLabelsLong = {
  decreto: "Decretos presidenciais",
  mp: "Medidas provisórias",
};

const typeShort = {
  decreto: "Decreto",
  mp: "MP",
};

// Paleta sóbria para manter leitura acadêmica consistente entre as abas.
export const chartColors = {
  primary: "#0f172a",
  secondary: "#334155",
  tertiary: "#64748b",
  muted: "#94a3b8",
  accent: "#166534",
};

const marcoLabels = {
  dias_ate_primeira_monocratica: "1ª decisão monocrática",
  dias_ate_primeira_colegiada: "1ª decisão colegiada",
  dias_ate_decisao_final: "Decisão final",
};

const mojibakePattern = /Ã|Â|â|¢|€|œ/;

function tryRepairText(value) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed || !mojibakePattern.test(trimmed)) {
    return trimmed;
  }

  try {
    const bytes = Uint8Array.from([...trimmed].map((char) => char.charCodeAt(0)));
    const repaired = new TextDecoder("utf-8", { fatal: false }).decode(bytes).trim();
    return repaired || trimmed;
  } catch {
    return trimmed;
  }
}

export function repairText(value, fallback = "Não informado") {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    const repaired = tryRepairText(value);
    return repaired || fallback;
  }

  return value;
}

export function formatNumber(value, options = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "n/d";
  }

  return Number(value).toLocaleString("pt-BR", options);
}

export function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "n/d";
  }

  return `${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: Number(value) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}%`;
}

export function formatDays(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "n/d";
  }

  return `${formatNumber(value)} dias`;
}

function slugify(value) {
  return repairText(value, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toSearchableText(...chunks) {
  return chunks
    .flatMap((chunk) => {
      if (chunk === null || chunk === undefined) {
        return [];
      }
      if (Array.isArray(chunk)) {
        return chunk;
      }
      return [chunk];
    })
    .map((chunk) => repairText(String(chunk), ""))
    .join(" ")
    .toLowerCase();
}

function getLookup(items, keyName) {
  return new Map(
    (items || []).map((item) => [repairText(item[keyName], item[keyName]), item.valor ?? item.descricao ?? null])
  );
}

function parseSummarySections(summary) {
  const sectionMap = new Map();
  for (const section of summary?.secoes || []) {
    sectionMap.set(repairText(section.titulo, ""), section.itens || []);
  }
  return sectionMap;
}

function getSummaryItem(items, key) {
  return (items || []).find((item) => repairText(item.chave, "") === key);
}

function normalizeBibliographicTitle(value) {
  return repairText(value, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeBrokenBibliographicEntry(item) {
  const title = repairText(item?.titulo, "");
  const authors = repairText(item?.autores, "");
  const sourceType = repairText(item?.fontePeriodico, "");
  const normalized = normalizeBibliographicTitle(`${title} ${authors} ${sourceType}`);

  if (!title) {
    return true;
  }

  const suspiciousFragments = [
    "presidente da republica a presidir um conselho",
    "transparencia y el mejor gobierno",
    "abstract judicial appointments are political",
    "acesso em:",
    "recibido:",
    "1of3",
    "4:13 pm",
    "%22",
  ];

  return (
    title.length > 260 ||
    (!authors && title.length > 180) ||
    suspiciousFragments.some((fragment) => normalized.includes(fragment)) ||
    /\b\d+of\d+\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b/i.test(`${title} ${sourceType}`)
  );
}

function buildTempo(items) {
  const grouped = new Map();

  for (const item of items || []) {
    const marcoKey = item.marco;
    const row =
      grouped.get(marcoKey) ??
      {
        id: marcoKey,
        marco: repairText(marcoLabels[marcoKey] ?? marcoKey, marcoKey),
        decretos: null,
        mps: null,
        decretosN: null,
        mpsN: null,
        decretosQ25: null,
        decretosQ75: null,
        mpsQ25: null,
        mpsQ75: null,
      };

    if (item.tipoNorma === "decreto") {
      row.decretos = item.mediana;
      row.decretosN = item.n;
      row.decretosQ25 = item.q25;
      row.decretosQ75 = item.q75;
    }

    if (item.tipoNorma === "mp") {
      row.mps = item.mediana;
      row.mpsN = item.n;
      row.mpsQ25 = item.q25;
      row.mpsQ75 = item.q75;
    }

    grouped.set(marcoKey, row);
  }

  return [
    grouped.get("dias_ate_primeira_monocratica"),
    grouped.get("dias_ate_primeira_colegiada"),
    grouped.get("dias_ate_decisao_final"),
  ].filter(Boolean);
}

function buildDesfechos(items) {
  const rows = new Map();

  for (const item of items || []) {
    const key = repairText(item.desfechoCategoria, "Não informado");
    const row =
      rows.get(key) ??
      {
        desfecho: key,
        decretosQtd: 0,
        decretosPct: 0,
        mpsQtd: 0,
        mpsPct: 0,
      };

    if (item.tipoNorma === "decreto") {
      row.decretosQtd = item.nProcessos ?? 0;
      row.decretosPct = item.participacao ?? 0;
    }

    if (item.tipoNorma === "mp") {
      row.mpsQtd = item.nProcessos ?? 0;
      row.mpsPct = item.participacao ?? 0;
    }

    rows.set(key, row);
  }

  return [...rows.values()];
}

function buildCases(items) {
  return (items || []).map((item) => {
    const actType = item.tiposAto === "mp" ? "mp" : "decreto";
    const government = repairText(
      item.governoAutuacao || item.governosEmissores?.split(";")[0] || "Não informado"
    );
    const eixo = repairText(item.eixoTematico);
    const tema = repairText(item.assuntosAto);

    return {
      processo: repairText(item.processo),
      actType,
      actTypeLabel: typeShort[actType] ?? repairText(item.tiposAto),
      governo: government,
      decisao: repairText(item.decisaoFinalTipo || item.desfechoCategoria),
      amici: item.nAmicusCuriae ?? 0,
      eixo,
      tema,
      classe: repairText(item.classeProcesso),
      linkProcesso: item.linkProcesso,
      atosImpugnados: repairText(item.atosImpugnados),
      diasAteDecisaoFinal: item.diasAteDecisaoFinal ?? null,
      diasAtePrimeiraColegiada: item.diasAtePrimeiraColegiada ?? null,
      diasAtePrimeiraMonocratica: item.diasAtePrimeiraMonocratica ?? null,
      indiceParadigmaticidade: item.indiceParadigmaticidade ?? null,
      searchText: toSearchableText(
        item.processo,
        government,
        item.decisaoFinalTipo,
        item.desfechoCategoria,
        eixo,
        tema,
        item.atosImpugnados,
        item.classeProcesso
      ),
    };
  });
}

function buildCaseAxis(cases) {
  const total = cases.length || 1;
  const counts = new Map();

  for (const item of cases) {
    counts.set(item.eixo, (counts.get(item.eixo) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([eixo, count]) => ({
      eixo,
      count,
      percent: (count / total) * 100,
      slug: slugify(eixo),
    }))
    .sort((left, right) => right.count - left.count);
}

function buildTheory(data) {
  const summarySections = parseSummarySections(data.corpusTeorico?.resumoEstatistico);
  const natureItems = summarySections.get("Distribuição por natureza da fonte") || [];
  const layerItems = summarySections.get("Distribuição por camada conceitual") || [];

  const totalCorpus = getSummaryItem(summarySections.get("geral"), "Total de itens")?.quantidade ?? 0;
  const totalReview = getSummaryItem(natureItems, "sistematica")?.quantidade ?? 0;
  const totalCurated = getSummaryItem(natureItems, "curada_teorica")?.quantidade ?? 0;
  const unclassified = getSummaryItem(layerItems, "NAO_CLASSIFICADO")?.quantidade ?? 0;

  const layers = layerItems
    .filter((item) => item.chave && item.chave !== "NAO_CLASSIFICADO")
    .map((item) => ({
      layerId: item.chave,
      layer: repairText(item.chave),
      label:
        {
          nuclear: "Nuclear",
          intermediaria: "Intermediária",
          periferica: "Periférica",
          multipla: "Múltipla",
        }[item.chave] ?? repairText(item.chave),
      quantity: item.quantidade ?? 0,
      percent: item.percentual ? Number(item.percentual) / 10 : null,
    }));

  const coreWorks = (data.corpusTeorico?.camadaNuclear || [])
    .filter((item) => !looksLikeBrokenBibliographicEntry(item))
    .map((item) => ({
    title: repairText(item.titulo),
    authors: repairText(item.autores),
    year: item.ano ?? null,
    source: repairText(item.origem),
    sourceType: repairText(item.fontePeriodico),
    confidence: repairText(item.confianca),
    concepts: repairText(item.conceitosMobilizados),
    abstract: repairText(item.resumo, "Sem resumo público."),
    doi: repairText(item.linkDoi, null),
    searchText: toSearchableText(
      item.titulo,
      item.autores,
      item.conceitosMobilizados,
      item.fontePeriodico,
      item.origem
    ),
    }));

  const concepts = (data.corpusTeorico?.mapaConceitos || []).map((item) => ({
    id: repairText(item.conceitoId),
    layer: repairText(item.camada),
    label: repairText(item.rotuloLegivel),
    occurrences: item.ocorrenciasNoCorpus ?? 0,
    searchPatterns: repairText(item.padroesDeBusca),
  }));

  return {
    cards: {
      totalCorpus,
      totalReview,
      totalCurated,
      totalLayers: layers.length,
      unclassified,
    },
    layers,
    coreWorks,
    concepts,
  };
}

function buildMethodology(data) {
  const diagnosis = getLookup(data.metodologia?.diagnosticoStf, "item");
  const extraction = getLookup(data.metodologia?.extracaoStf, "campo");

  const processCount =
    diagnosis.get("Processos com evidencia de judicializacao") ??
    diagnosis.get("Processos STF no periodo") ??
    0;

  return {
    universe: {
      decrees: diagnosis.get("Decretos no periodo") ?? 0,
      mps: diagnosis.get("MPs no periodo") ?? 0,
      totalNormative: diagnosis.get("Universo normativo unificado") ?? 0,
      processCount,
      processNormPairs: diagnosis.get("Pares processo-norma (com cruzamento)") ?? 0,
      judicializedNorms: diagnosis.get("Normas distintas judicializadas") ?? 0,
      unmatchedReferences: diagnosis.get("Referencias nao casadas com a base normativa") ?? 0,
    },
    extraction: {
      period: repairText(extraction.get("Periodo da analise")),
      unit: repairText(extraction.get("Unidade analitica primaria")),
      judicializationCriteria: repairText(extraction.get("Criterio de judicializacao")),
      strictMatch: repairText(extraction.get("Cruzamento estrito")),
      controlledMatch: repairText(extraction.get("Cruzamento controlado")),
      decreeLawTreatment: repairText(extraction.get("Tratamento de Decreto-Lei e Decreto Legislativo")),
      posteriorWindow: repairText(extraction.get("Janela de efeito posterior")),
    },
  };
}

export function buildDashboardData(data) {
  const typeStats = (data.provocacaoSeletiva?.tipoAto || []).map((item) => ({
    type: item.tipoNorma,
    label: typeLabels[item.tipoNorma] ?? repairText(item.tipoNorma),
    labelLong: typeLabelsLong[item.tipoNorma] ?? repairText(item.tipoNorma),
    total: item.totalNormasBase ?? 0,
    judicialized: item.normasJudicializadas ?? 0,
    processes: item.processosDistintos ?? 0,
    rate: item.taxaJudicializacao ?? 0,
    icLow: item.taxaIcLow ?? null,
    icHigh: item.taxaIcHigh ?? null,
  }));

  const rateByType = Object.fromEntries(typeStats.map((item) => [item.type, item.rate]));

  const governments = (data.provocacaoSeletiva?.porGoverno || []).map((item) => ({
    id: `${item.tipoNorma}-${slugify(item.governo)}`,
    type: item.tipoNorma,
    typeLabel: typeLabels[item.tipoNorma] ?? repairText(item.tipoNorma),
    typeShort: typeShort[item.tipoNorma] ?? repairText(item.tipoNorma),
    government: repairText(item.governo),
    total: item.totalNormasBase ?? 0,
    judicialized: item.normasJudicializadas ?? 0,
    processes: item.processosDistintos ?? 0,
    rate: item.taxaJudicializacao ?? 0,
    averageRate: rateByType[item.tipoNorma] ?? 0,
    deltaFromTypeAverage: (item.taxaJudicializacao ?? 0) - (rateByType[item.tipoNorma] ?? 0),
  }));

  const themes = (data.provocacaoSeletiva?.porAssunto || []).map((item) => ({
    id: `${item.tipoNorma}-${slugify(item.assunto)}`,
    type: item.tipoNorma,
    typeLabel: typeLabels[item.tipoNorma] ?? repairText(item.tipoNorma),
    typeShort: typeShort[item.tipoNorma] ?? repairText(item.tipoNorma),
    theme: repairText(item.assunto),
    total: item.totalNormasBase ?? 0,
    judicialized: item.normasJudicializadas ?? 0,
    rate: item.taxaJudicializacao ?? 0,
  }));

  const meritRates = (data.meritoTemporalidade?.procedencia || []).map((item) => ({
    type: item.tipoNorma,
    label: typeLabels[item.tipoNorma] ?? repairText(item.tipoNorma),
    decisions: item.nDecisoesMerito ?? 0,
    favorable: item.nProcedentes ?? 0,
    rate: item.taxa ?? 0,
    icLow: item.taxaIcLow ?? null,
    icHigh: item.taxaIcHigh ?? null,
  }));

  const cases = buildCases(data.casosParadigmaticos?.lista || []);
  const methodology = buildMethodology(data);
  const theory = buildTheory(data);

  return {
    meta: data.meta,
    typeStats,
    governments,
    themes,
    outcomes: buildDesfechos(data.intensidadeMerito?.desfechos),
    timeline: buildTempo(data.meritoTemporalidade?.temposDescritivos),
    meritRates,
    cases,
    casesByAxis: buildCaseAxis(cases),
    concepts: theory.concepts,
    theory,
    methodology,
    literature: {
      levels: (data.revisaoLiteratura?.niveisAnalise || []).map((item) => ({
        level: repairText(item.nivelBusca),
        description: repairText(item.descricao),
        query: repairText(item.stringBooleana),
      })),
      strings: (data.revisaoLiteratura?.stringsBooleanas || []).map((item, index) => ({
        id: index,
        base: repairText(item.baseDados ?? item.base ?? `String ${index + 1}`),
        query: repairText(item.stringBooleana ?? item.string ?? ""),
      })),
      sourceSummary: (data.revisaoLiteratura?.resumoPorBase || []).map((item) => ({
        base: repairText(item.baseDados),
        count: item.quantidadeRegistrosUnicos ?? 0,
      })),
    },
    limits: (data.limites?.observacoes || []).map((item) => repairText(item)),
    excludedSheets: (data.limites?.abasTecnicasExcluidas || []).map((item) => repairText(item)),
  };
}

export const dashboardLabels = {
  typeLabels,
  typeLabelsLong,
  typeShort,
};
