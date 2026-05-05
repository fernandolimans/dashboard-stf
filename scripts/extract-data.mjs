import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "data", "source");
const docsDir = path.join(rootDir, "docs");
const outputDir = path.join(rootDir, "src", "data");
const outputFile = path.join(outputDir, "pesquisa.json");
const contractFile = path.join(docsDir, "contrato_dados_dashboard.json");

const defaultContract = {
  version: 1,
  sourceFiles: {
    stf: "resultado_dissertacao_STF_atos_presidenciais.xlsx",
    corpus: "corpus_unificado_dissertacao.xlsx",
    revisao: "REVISÃO SISTEMÁTICA DE LITERATURA.xlsx",
  },
  includedSheets: {
    stf: [
      "00_README",
      "00_diagnostico",
      "01_tabela_sintese_dissertacao",
      "A1_tipo_ato",
      "A2_governo",
      "A3_assunto",
      "A4_objeto",
      "A5_tipo_impacto",
      "A6_efeito",
      "A7_legitimado_ativo",
      "A8_classe_processual",
      "A9_serie_anual_norma",
      "A10_serie_anual_autuacao",
      "B1_taxa_geral_IC",
      "B2_desfecho_categoria",
      "B3_taxa_procedencia",
      "B4_temporalidade_descritiva",
      "B5_densidade_resumo",
      "B9_logrank",
      "B10_cox_resumo",
      "B11_kaplan_meier",
      "C1_paradigmaticos",
      "C2_resumo_eixos",
      "C7_efeito_posterior",
      "C8_cluster_atribuicoes",
      "C9_cluster_centros",
      "C10_cluster_diagnostico",
      "S1_termos_distintivos_TFIDF",
    ],
    corpus: ["0_LEIA_PRIMEIRO", "2_camada_nuclear", "7_resumo_estatistico", "8_mapa_conceitos"],
    revisao: ["niveis_analise", "strings_booleanas", "resumo_por_base"],
  },
  excludedSheets: {
    stf: [
      "A11_testes_inferenciais",
      "B6_densidade_processos",
      "B7_logit_procedencia",
      "B8_ols_log_dias",
      "C3_sugestao_por_eixo",
      "C4_auditoria_filtros",
      "C5_auditoria_individual",
      "C6_auditoria_eixo_tipo_ato",
      "X1_pares_processo_norma",
      "X2_normas_universo",
      "X3_processos_painel",
      "X4_refs_nao_encontradas",
    ],
    corpus: [
      "1_corpus_unificado",
      "3_camada_intermediaria",
      "4_camada_periferica",
      "5_camada_multipla",
      "6_verificacao_manual",
    ],
    revisao: ["arquivos_lidos", "duplicatas_identificadas", "base_final_resumida", "triagem_prioritaria"],
  },
  mappings: {
    A1_tipo_ato: { target: "provocacaoSeletiva.tipoAto", percentKeys: ["taxaJudicializacao", "taxaIcLow", "taxaIcHigh"] },
    A2_governo: { target: "provocacaoSeletiva.porGoverno", percentKeys: ["taxaJudicializacao", "taxaIcLow", "taxaIcHigh"] },
    A3_assunto: { target: "provocacaoSeletiva.porAssunto", percentKeys: ["taxaJudicializacao"] },
    A4_objeto: { target: "provocacaoSeletiva.porObjeto", percentKeys: ["taxaJudicializacao"] },
    A5_tipo_impacto: { target: "provocacaoSeletiva.porTipoImpacto", percentKeys: ["taxaJudicializacao"] },
    A6_efeito: { target: "provocacaoSeletiva.porEfeito", percentKeys: ["taxaJudicializacao"] },
    A7_legitimado_ativo: { target: "provocacaoSeletiva.legitimadosAtivos", percentKeys: ["participacao"] },
    A8_classe_processual: { target: "provocacaoSeletiva.classesProcessuais", percentKeys: ["participacao"] },
    A9_serie_anual_norma: { target: "provocacaoSeletiva.serieAnualNorma", percentKeys: ["taxaJudicializacao"] },
    A10_serie_anual_autuacao: { target: "provocacaoSeletiva.serieAnualAutuacao", percentKeys: [] },
    B1_taxa_geral_IC: { target: "intensidadeMerito.taxaGeralIC", percentKeys: ["taxa", "icLow", "icHigh"] },
    B2_desfecho_categoria: { target: "intensidadeMerito.desfechos", percentKeys: ["participacao"] },
    B3_taxa_procedencia: { target: "meritoTemporalidade.procedencia", percentKeys: ["taxa", "taxaIcLow", "taxaIcHigh"] },
    B4_temporalidade_descritiva: { target: "meritoTemporalidade.temposDescritivos", percentKeys: [] },
    B5_densidade_resumo: { target: "intensidadeMerito.densidadeResumo", percentKeys: ["pComAmici"] },
    B9_logrank: { target: "meritoTemporalidade.logrank", percentKeys: [] },
    B10_cox_resumo: { target: "meritoTemporalidade.coxResumo", percentKeys: [] },
    B11_kaplan_meier: { target: "meritoTemporalidade.kaplanMeier", percentKeys: [] },
    C1_paradigmaticos: { target: "casosParadigmaticos.lista", mode: "casosParadigmaticosPublicos" },
    C2_resumo_eixos: { target: "casosParadigmaticos.eixosResumo", percentKeys: [] },
    C7_efeito_posterior: { target: "efeitoPosterior.janelaCincoAnos", percentKeys: ["razaoPosTotal"], mode: "efeitoPosteriorJanela" },
    C8_cluster_atribuicoes: { target: "clusters.atribuicoes", percentKeys: [] },
    C9_cluster_centros: { target: "clusters.centros", percentKeys: [] },
    C10_cluster_diagnostico: { target: "clusters.diagnostico", percentKeys: [] },
    S1_termos_distintivos_TFIDF: { target: "tfidf.termosDistintivos", percentKeys: [] },
    "7_resumo_estatistico": { target: "corpusTeorico.resumoEstatistico", mode: "resumoEstatistico" },
    "8_mapa_conceitos": { target: "corpusTeorico.mapaConceitos", percentKeys: [] },
    niveis_analise: { target: "revisaoLiteratura.niveisAnalise", percentKeys: [] },
    strings_booleanas: { target: "revisaoLiteratura.stringsBooleanas", percentKeys: [] },
    resumo_por_base: { target: "revisaoLiteratura.resumoPorBase", percentKeys: [] },
  },
};

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }
}

function loadContract() {
  if (!fs.existsSync(contractFile)) {
    return { contract: defaultContract, contractAvailable: false };
  }

  const raw = fs.readFileSync(contractFile, "utf8");
  const externalContract = JSON.parse(raw);
  const merged = {
    ...defaultContract,
    ...externalContract,
    sourceFiles: { ...defaultContract.sourceFiles, ...(externalContract.sourceFiles ?? {}) },
    includedSheets: { ...defaultContract.includedSheets, ...(externalContract.includedSheets ?? {}) },
    excludedSheets: { ...defaultContract.excludedSheets, ...(externalContract.excludedSheets ?? {}) },
    mappings: { ...defaultContract.mappings, ...(externalContract.mappings ?? {}) },
  };

  return { contract: merged, contractAvailable: true };
}

function normalizeHeader(header) {
  const normalized = String(header ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  const [first, ...rest] = normalized.split(/\s+/);
  return [
    first.toLowerCase(),
    ...rest.map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()),
  ].join("");
}

function roundNumber(value, digits = 4) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  return Number(value.toFixed(digits));
}

function formatDate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }
  return value.toISOString().slice(0, 10);
}

function normalizeValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (value instanceof Date) {
    return formatDate(value);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || /^nan$/i.test(trimmed)) {
      return null;
    }
    return trimmed;
  }

  return value;
}

function parsePercentString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.endsWith("%")) {
    return null;
  }

  const numeric = trimmed.replace(/%/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? roundNumber(parsed, 4) : null;
}

function toPercentPoints(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const parsed = parsePercentString(value);
    return parsed === null ? normalizeValue(value) : parsed;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }
    if (Math.abs(value) <= 1) {
      return roundNumber(value * 100, 4);
    }
    return roundNumber(value, 4);
  }

  return value;
}

function sheetToObjects(workbook, sheetName, options = {}) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return [];
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
    raw: true,
  });

  const percentKeys = new Set(options.percentKeys ?? []);

  return rows
    .map((row) => {
      const normalized = {};

      for (const [rawKey, rawValue] of Object.entries(row)) {
        const key = normalizeHeader(rawKey);
        if (!key) {
          continue;
        }

        const value = normalizeValue(rawValue);
        normalized[key] = percentKeys.has(key) ? toPercentPoints(value) : value;
      }

      return normalized;
    })
    .filter((row) => Object.values(row).some((value) => value !== null));
}

function sheetToMatrix(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true,
  }).map((row) => row.map((value) => normalizeValue(value)));
}

function parseKeyValueRows(rows, keyLabel = "campo", valueLabel = "descricao") {
  return rows
    .slice(1)
    .filter((row) => !(row[0] === null && row[1] === null))
    .map(([key, value]) => ({
      [normalizeHeader(keyLabel)]: normalizeValue(key),
      [normalizeHeader(valueLabel)]: normalizeValue(value),
    }));
}

function parseGroupedMatrix(rows) {
  if (!rows.length) {
    return { titulo: null, secoes: [] };
  }

  const titulo = normalizeValue(rows[0][0]);
  const secoes = [];
  let currentSection = null;

  for (const row of rows.slice(1)) {
    const meaningfulCells = row.filter((cell) => cell !== null);
    if (!meaningfulCells.length) {
      currentSection = null;
      continue;
    }

    const [first, second, third] = row;
    const isHeading = first !== null && row.slice(1).every((cell) => cell === null);

    if (isHeading) {
      currentSection = { titulo: first, itens: [] };
      secoes.push(currentSection);
      continue;
    }

    if (!currentSection) {
      currentSection = { titulo: "geral", itens: [] };
      secoes.push(currentSection);
    }

    currentSection.itens.push({
      chave: first,
      valor: second,
      valorExtra: third,
      linhaCompleta: row,
    });
  }

  return { titulo, secoes };
}

function parseResumoEstatistico(rows) {
  const grouped = parseGroupedMatrix(rows);
  return {
    titulo: grouped.titulo,
    secoes: grouped.secoes.map((section) => ({
      titulo: section.titulo,
      itens: section.itens.map((item) => ({
        chave: item.chave,
        quantidade: normalizeValue(item.valor),
        percentual: toPercentPoints(item.valorExtra),
      })),
    })),
  };
}

function parseIntervalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const matches = [...value.matchAll(/(\d+(?:[.,]\d+)?)%/g)];
  if (matches.length < 2) {
    return null;
  }

  const [low, high] = matches.slice(0, 2).map((match) =>
    Number(match[1].replace(".", "").replace(",", "."))
  );

  if (!Number.isFinite(low) || !Number.isFinite(high)) {
    return null;
  }

  return { low: roundNumber(low, 4), high: roundNumber(high, 4) };
}

function parseSummaryValue(value) {
  const normalized = normalizeValue(value);

  if (typeof normalized !== "string") {
    return normalized;
  }

  const percentage = parsePercentString(normalized);
  if (percentage !== null) {
    return percentage;
  }

  const daysMatch = normalized.match(/^(\d+(?:[.,]\d+)?)\s+dias$/i);
  if (daysMatch) {
    return Number(daysMatch[1].replace(".", "").replace(",", "."));
  }

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  return normalized;
}

function parseTabelaSintese(rows) {
  return rows.map((row) => {
    const parsedInterval = parseIntervalString(row.ic);
    return {
      ...row,
      valor: parseSummaryValue(row.valor),
      ic: parsedInterval,
    };
  });
}

function pickFields(row, fieldMap) {
  const output = {};
  for (const [sourceKey, targetKey] of Object.entries(fieldMap)) {
    output[targetKey] = row[sourceKey] ?? null;
  }
  return output;
}

function setByPath(target, dotPath, value) {
  const segments = dotPath.split(".");
  let current = target;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const key = segments[index];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }

  current[segments.at(-1)] = value;
}

function getByPath(target, dotPath) {
  return dotPath.split(".").reduce((current, key) => (current == null ? undefined : current[key]), target);
}

function countRows(rows) {
  return Array.isArray(rows) ? rows.length : 0;
}

function normalizeBibliographicTitle(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeBrokenBibliographicEntry(item) {
  const title = String(item?.titulo ?? "").trim();
  const authors = String(item?.autores ?? "").trim();
  const sourceType = String(item?.fontePeriodico ?? "").trim();
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

function sanitizeCamadaNuclear(rows) {
  return (rows || []).filter((item) => !looksLikeBrokenBibliographicEntry(item));
}

function appendCabralWork(camadaNuclear) {
  const titleNeedle = "a erosao democratica brasileira";
  const alreadyIncluded = camadaNuclear.some((item) =>
    String(item.titulo ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes(titleNeedle)
  );

  if (alreadyIncluded) {
    return camadaNuclear;
  }

  return [
    ...camadaNuclear,
    {
      naturezaDaFonte: "curada_teorica",
      origem: "Acervo complementar",
      camadaConceitual: "nuclear",
      tipoDeMatch: "estrita",
      confianca: "alta",
      titulo: "A erosão democrática brasileira (2019-2021)",
      autores:
        "Cabral, Rafael Lamera Giesta; Reis, Ulisses Levy Silvério dos; Marques, Raphael Peixoto de Paula",
      ano: 2022,
      fontePeriodico:
        "In: Erosão Democrática e Constituição. Rio de Janeiro: Lumen Juris, 2022. p. 249-271.",
      criterioDeBusca: "(seleção curada complementar)",
      conceitosMobilizados:
        "Erosão democrática / democratic backsliding; Governo Bolsonaro / pós-2018",
      justificativaDaClassificacao:
        "Obra adicionada manualmente na camada nuclear por sua centralidade direta ao eixo de erosão democrática brasileira mobilizado na dissertação.",
      aderenciaRevisaoSistematica: null,
      linkDoi: null,
      resumo: null,
    },
  ];
}

function transformMappedSheet(workbook, sheetName, mappingConfig) {
  const rows = sheetToObjects(workbook, sheetName, {
    percentKeys: mappingConfig.percentKeys ?? [],
  });

  if (mappingConfig.mode === "casosParadigmaticosPublicos") {
    return rows.map((row) =>
      pickFields(row, {
        processo: "processo",
        tiposAto: "tiposAto",
        atosImpugnados: "atosImpugnados",
        governosEmissores: "governosEmissores",
        governoAutuacao: "governoAutuacao",
        assuntosAto: "assuntosAto",
        objetosAto: "objetosAto",
        dataAutuacao: "dataAutuacao",
        dataDecisaoFinalEfetiva: "dataDecisaoFinalEfetiva",
        diasAteDecisaoFinal: "diasAteDecisaoFinal",
        diasAtePrimeiraColegiada: "diasAtePrimeiraColegiada",
        diasAtePrimeiraMonocratica: "diasAtePrimeiraMonocratica",
        classeProcesso: "classeProcesso",
        relatorAtual: "relatorAtual",
        situacaoProcessual: "situacaoProcessual",
        desfechoCategoria: "desfechoCategoria",
        decisaoFinalTipo: "decisaoFinalTipo",
        nAmicusCuriae: "nAmicusCuriae",
        linkProcesso: "linkProcesso",
        eixoTematico: "eixoTematico",
        indiceParadigmaticidade: "indiceParadigmaticidade",
      })
    );
  }

  if (mappingConfig.mode === "efeitoPosteriorJanela") {
    return rows.map((row) => ({
      ...row,
      razaoPosTotal: row.baseAtosJanela === 0 ? null : row.razaoPosTotal,
    }));
  }

  if (mappingConfig.mode === "resumoEstatistico") {
    return parseResumoEstatistico(sheetToMatrix(workbook, sheetName));
  }

  if (mappingConfig.target === "meritoTemporalidade.logrank") {
    return rows[0] ?? null;
  }

  return rows;
}

function buildResearchJson() {
  const { contract, contractAvailable } = loadContract();

  const workbookPaths = {
    stf: path.join(sourceDir, contract.sourceFiles.stf),
    corpus: path.join(sourceDir, contract.sourceFiles.corpus),
    revisao: path.join(sourceDir, contract.sourceFiles.revisao),
  };

  Object.values(workbookPaths).forEach(ensureFile);

  const workbooks = {
    stf: XLSX.readFile(workbookPaths.stf, { cellDates: true }),
    corpus: XLSX.readFile(workbookPaths.corpus, { cellDates: true }),
    revisao: XLSX.readFile(workbookPaths.revisao, { cellDates: true }),
  };

  const pesquisa = {
    metodologia: {},
    visaoGeral: {},
    provocacaoSeletiva: {},
    intensidadeMerito: {},
    meritoTemporalidade: {},
    efeitoPosterior: {},
    casosParadigmaticos: {},
    clusters: {},
    tfidf: {},
    corpusTeorico: {},
    revisaoLiteratura: {},
    limites: {},
  };

  pesquisa.metodologia.extracaoStf = parseKeyValueRows(sheetToMatrix(workbooks.stf, "00_README"));
  pesquisa.metodologia.diagnosticoStf = parseKeyValueRows(
    sheetToMatrix(workbooks.stf, "00_diagnostico"),
    "item",
    "valor"
  );
  pesquisa.metodologia.corpusTeorico = parseGroupedMatrix(
    sheetToMatrix(workbooks.corpus, "0_LEIA_PRIMEIRO")
  );

  const arquivosLidos = sheetToObjects(workbooks.revisao, "arquivos_lidos");
  const duplicatasIdentificadas = sheetToObjects(workbooks.revisao, "duplicatas_identificadas");
  const baseFinalResumida = sheetToObjects(workbooks.revisao, "base_final_resumida");
  const triagemPrioritaria = sheetToObjects(workbooks.revisao, "triagem_prioritaria");
  const refsNaoEncontradas = sheetToObjects(workbooks.stf, "X4_refs_nao_encontradas");

  pesquisa.metodologia.revisaoArquivos = {
    totalArquivosMapeados: arquivosLidos.length,
    arquivosExistentes: arquivosLidos.filter((item) => item.existe === true).length,
    basesCobertas: [...new Set(arquivosLidos.map((item) => item.baseDadosInferida).filter(Boolean))],
  };

  pesquisa.visaoGeral.tabelaSintese = parseTabelaSintese(
    sheetToObjects(workbooks.stf, "01_tabela_sintese_dissertacao")
  );
  pesquisa.visaoGeral.diagnostico = pesquisa.metodologia.diagnosticoStf;

  for (const [sheetName, mappingConfig] of Object.entries(contract.mappings)) {
    let workbook = workbooks.stf;
    if (contract.includedSheets.corpus.includes(sheetName)) {
      workbook = workbooks.corpus;
    } else if (contract.includedSheets.revisao.includes(sheetName)) {
      workbook = workbooks.revisao;
    }

    const transformed = transformMappedSheet(workbook, sheetName, mappingConfig);
    setByPath(pesquisa, mappingConfig.target, transformed);
  }

  pesquisa.corpusTeorico.camadaNuclear = appendCabralWork(
    sanitizeCamadaNuclear(sheetToObjects(workbooks.corpus, "2_camada_nuclear"))
  );

  pesquisa.limites = {
    observacoes: [
      "As abas X1_pares_processo_norma, X2_normas_universo, X3_processos_painel, X4_refs_nao_encontradas e arquivos_lidos não são publicadas em bruto na camada pública.",
      `A auditoria técnica do STF reteve ${refsNaoEncontradas.length} referências não pareadas automaticamente com o universo normativo.`,
      `A revisão sistemática ainda registra ${duplicatasIdentificadas.length} chaves com duplicidade identificada e ${baseFinalResumida.length} registros na base final resumida antes da seleção prioritária.`,
      `A triagem prioritária contém ${triagemPrioritaria.length} registros para inspeção mais próxima, mas não é publicada integralmente nesta camada pública.`,
    ],
    abasTecnicasExcluidas: [
      ...contract.excludedSheets.stf,
      ...contract.excludedSheets.corpus,
      ...contract.excludedSheets.revisao,
    ],
  };

  const sectionCounts = {};
  const pathsToCount = [
    "provocacaoSeletiva.tipoAto",
    "provocacaoSeletiva.porGoverno",
    "provocacaoSeletiva.porAssunto",
    "provocacaoSeletiva.porObjeto",
    "provocacaoSeletiva.porTipoImpacto",
    "provocacaoSeletiva.porEfeito",
    "provocacaoSeletiva.legitimadosAtivos",
    "provocacaoSeletiva.classesProcessuais",
    "provocacaoSeletiva.serieAnualNorma",
    "provocacaoSeletiva.serieAnualAutuacao",
    "intensidadeMerito.taxaGeralIC",
    "intensidadeMerito.desfechos",
    "intensidadeMerito.densidadeResumo",
    "meritoTemporalidade.procedencia",
    "meritoTemporalidade.temposDescritivos",
    "meritoTemporalidade.coxResumo",
    "meritoTemporalidade.kaplanMeier",
    "efeitoPosterior.janelaCincoAnos",
    "casosParadigmaticos.lista",
    "casosParadigmaticos.eixosResumo",
    "clusters.atribuicoes",
    "clusters.centros",
    "clusters.diagnostico",
    "tfidf.termosDistintivos",
    "corpusTeorico.camadaNuclear",
    "corpusTeorico.mapaConceitos",
    "revisaoLiteratura.niveisAnalise",
    "revisaoLiteratura.stringsBooleanas",
    "revisaoLiteratura.resumoPorBase",
  ];

  for (const dotPath of pathsToCount) {
    sectionCounts[dotPath] = countRows(getByPath(pesquisa, dotPath));
  }

  sectionCounts.meta = 1;
  sectionCounts.metodologia =
    pesquisa.metodologia.extracaoStf.length +
    pesquisa.metodologia.diagnosticoStf.length +
    pesquisa.metodologia.revisaoArquivos.basesCobertas.length;
  sectionCounts.visaoGeral = pesquisa.visaoGeral.tabelaSintese.length;
  sectionCounts.limites = pesquisa.limites.observacoes.length;

  pesquisa.meta = {
    geradoEm: new Date().toISOString(),
    contrato: contractAvailable ? "docs/contrato_dados_dashboard.json" : "mapeamento_minimo_embutido",
    arquivosFonte: Object.entries(workbookPaths).map(([id, filePath]) => ({
      id,
      arquivo: path.basename(filePath),
      caminhoRelativo: path.relative(rootDir, filePath).replace(/\\/g, "/"),
    })),
    abasIncluidas: contract.includedSheets,
    abasTecnicasExcluidas: contract.excludedSheets,
    contagemPorSecao: sectionCounts,
  };

  return {
    pesquisa,
    summary: {
      contractAvailable,
      workbookPaths,
      sectionCounts,
      includedSheets: contract.includedSheets,
      excludedSheets: contract.excludedSheets,
      outputFile,
    },
  };
}

function printSummary(summary) {
  console.log("[extract:data] Planilhas lidas:");
  Object.values(summary.workbookPaths).forEach((filePath) => {
    console.log(`- ${path.basename(filePath)}`);
  });

  console.log("[extract:data] Abas publicadas no JSON:");
  for (const [group, sheets] of Object.entries(summary.includedSheets)) {
    console.log(`- ${group}: ${sheets.join(", ")}`);
  }

  console.log("[extract:data] Linhas por seção:");
  for (const [section, count] of Object.entries(summary.sectionCounts)) {
    console.log(`- ${section}: ${count}`);
  }

  console.log("[extract:data] Abas técnicas fora do JSON bruto:");
  for (const [group, sheets] of Object.entries(summary.excludedSheets)) {
    console.log(`- ${group}: ${sheets.join(", ")}`);
  }

  console.log(`[extract:data] JSON gerado em: ${summary.outputFile}`);
  console.log(
    `[extract:data] Contrato utilizado: ${
      summary.contractAvailable ? "docs/contrato_dados_dashboard.json" : "mapeamento mínimo embutido"
    }`
  );
}

try {
  const { pesquisa, summary } = buildResearchJson();
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(pesquisa, null, 2)}\n`, "utf8");
  printSummary(summary);
} catch (error) {
  console.error(`[extract:data] Falha: ${error.message}`);
  process.exitCode = 1;
}
