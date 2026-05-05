import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataFile = path.join(rootDir, "src", "data", "pesquisa.json");
const contractFile = path.join(rootDir, "docs", "contrato_dados_dashboard.json");

function getByPath(target, dotPath) {
  return dotPath.split(".").reduce((current, key) => (current == null ? undefined : current[key]), target);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isEmptyObject(value) {
  return isPlainObject(value) && Object.keys(value).length === 0;
}

function isDescriptiveTextPath(currentPath) {
  return /\.(descricao|observacao|justificativaDaClassificacao|fontePeriodico|criterioDeBusca|conceitosMobilizados|resumo|texto|titulo)$/.test(
    currentPath
  );
}

function walk(value, visitor, currentPath = "$") {
  visitor(value, currentPath);

  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, `${currentPath}[${index}]`));
    return;
  }

  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      walk(child, visitor, `${currentPath}.${key}`);
    }
  }
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  if (!fs.existsSync(dataFile)) {
    throw new Error(`JSON não encontrado: ${dataFile}`);
  }

  const pesquisa = loadJson(dataFile);
  const contract = fs.existsSync(contractFile) ? loadJson(contractFile) : null;

  const topLevelKeys =
    contract?.requiredTopLevelKeys ?? [
      "meta",
      "metodologia",
      "visaoGeral",
      "provocacaoSeletiva",
      "intensidadeMerito",
      "meritoTemporalidade",
      "efeitoPosterior",
      "casosParadigmaticos",
      "clusters",
      "tfidf",
      "corpusTeorico",
      "revisaoLiteratura",
      "limites",
    ];

  const requiredLists = contract?.requiredLists ?? [];

  const issues = [];
  const findings = {
    localPaths: [],
    textualPercentages: [],
    invalidTokens: [],
    emptyObjects: [],
    missingTopLevel: [],
    emptySections: [],
    emptyLists: [],
    cabralFound: false,
  };

  for (const key of topLevelKeys) {
    if (!(key in pesquisa)) {
      findings.missingTopLevel.push(key);
      issues.push(`Chave principal ausente: ${key}`);
      continue;
    }

    const value = pesquisa[key];
    const isEmpty =
      value == null ||
      (Array.isArray(value) && value.length === 0) ||
      (isPlainObject(value) && Object.keys(value).length === 0);

    if (isEmpty) {
      findings.emptySections.push(key);
      issues.push(`Seção principal vazia: ${key}`);
    }
  }

  for (const dotPath of requiredLists) {
    const value = getByPath(pesquisa, dotPath);
    if (!Array.isArray(value) || value.length === 0) {
      findings.emptyLists.push(dotPath);
      issues.push(`Lista obrigatória vazia ou ausente: ${dotPath}`);
    }
  }

  walk(pesquisa, (value, currentPath) => {
    if (typeof value === "string") {
      if (/%/.test(value) && !isDescriptiveTextPath(currentPath)) {
        findings.textualPercentages.push(currentPath);
      }

      if (/^(nan|undefined)$/i.test(value.trim())) {
        findings.invalidTokens.push(currentPath);
      }

      if (/[A-Za-z]:\\/.test(value) || value.includes("C:\\") || value.includes("D:\\")) {
        findings.localPaths.push(currentPath);
      }
    }

    if (isEmptyObject(value)) {
      findings.emptyObjects.push(currentPath);
    }
  });

  if (findings.textualPercentages.length) {
    issues.push(
      `Percentuais em formato textual encontrados: ${findings.textualPercentages.slice(0, 10).join(", ")}`
    );
  }

  if (findings.localPaths.length) {
    issues.push(`Caminhos locais do Windows encontrados: ${findings.localPaths.slice(0, 10).join(", ")}`);
  }

  if (findings.invalidTokens.length) {
    issues.push(`Tokens inválidos encontrados: ${findings.invalidTokens.slice(0, 10).join(", ")}`);
  }

  if (findings.emptyObjects.length) {
    issues.push(`Objetos vazios indevidos encontrados: ${findings.emptyObjects.slice(0, 10).join(", ")}`);
  }

  const camadaNuclear = getByPath(pesquisa, "corpusTeorico.camadaNuclear");
  findings.cabralFound =
    Array.isArray(camadaNuclear) &&
    camadaNuclear.some((item) => {
      const titulo = String(item?.titulo ?? "").toLowerCase();
      const autores = String(item?.autores ?? "").toLowerCase();
      return (
        titulo.includes("erosão democrática brasileira") &&
        autores.includes("cabral") &&
        autores.includes("reis") &&
        autores.includes("marques") &&
        Number(item?.ano) === 2022
      );
    });

  if (!findings.cabralFound) {
    issues.push("Obra Cabral, Reis e Marques (2022) não localizada em corpusTeorico.camadaNuclear.");
  }

  const jsonSize = fs.statSync(dataFile).size;
  const hasNaN = findings.invalidTokens.length > 0;
  const passed = issues.length === 0;

  console.log(`[validate:data] JSON: ${dataFile}`);
  console.log(`[validate:data] Tamanho: ${jsonSize} bytes`);
  console.log(`[validate:data] Top-level ausentes: ${findings.missingTopLevel.length}`);
  console.log(`[validate:data] Seções vazias: ${findings.emptySections.length}`);
  console.log(`[validate:data] Listas vazias: ${findings.emptyLists.length}`);
  console.log(`[validate:data] Caminhos locais do Windows: ${findings.localPaths.length}`);
  console.log(`[validate:data] NaN/undefined textuais: ${findings.invalidTokens.length}`);
  console.log(`[validate:data] Percentuais textuais: ${findings.textualPercentages.length}`);
  console.log(`[validate:data] Objetos vazios indevidos: ${findings.emptyObjects.length}`);
  console.log(`[validate:data] Obra Cabral/Reis/Marques localizada: ${findings.cabralFound ? "sim" : "não"}`);

  if (!passed) {
    console.log("[validate:data] Problemas encontrados:");
    issues.forEach((issue) => console.log(`- ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log("[validate:data] Validação concluída sem problemas.");
}

try {
  main();
} catch (error) {
  console.error(`[validate:data] Falha: ${error.message}`);
  process.exitCode = 1;
}
