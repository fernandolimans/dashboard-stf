# Dashboard STF

Painel React/Vite para apresentação dos dados de judicialização de decretos e medidas provisórias no STF.

## Requisitos

- Node.js LTS
- `npm`
- As 3 planilhas originais, apenas para regenerar a camada pública

## Estrutura de dados

- As planilhas originais ficam em `data/source/` e são ignoradas pelo Git.
- A camada pública usada pelo dashboard fica em `src/data/pesquisa.json` e deve ser versionada.
- O contrato de mapeamento fica em `docs/contrato_dados_dashboard.json`.

## Rodar localmente com as planilhas

1. Coloque estas planilhas em `data/source/`:
   - `resultado_dissertacao_STF_atos_presidenciais.xlsx`
   - `corpus_unificado_dissertacao.xlsx`
   - `REVISÃO SISTEMÁTICA DE LITERATURA.xlsx`
2. Instale as dependências:

```bash
npm install
```

3. Regenere a camada pública:

```bash
npm run extract:data
```

4. Valide os dados:

```bash
npm run validate:data
```

5. Rode o ambiente de desenvolvimento:

```bash
npm run dev
```

## Regenerar `src/data/pesquisa.json`

Sempre que as planilhas mudarem:

```bash
npm run extract:data
```

O arquivo gerado será:

```text
src/data/pesquisa.json
```

## Validar os dados

Para auditar a camada pública versionada:

```bash
npm run validate:data
```

Essa validação verifica:

- chaves principais do JSON;
- listas obrigatórias;
- ausência de `NaN` e `undefined` textuais;
- ausência de caminhos locais do Windows;
- ausência de percentuais textuais em campos públicos;
- presença da obra de Cabral, Reis e Marques (2022).

## Build local completo

Para rebuildar os dados a partir das planilhas e gerar a build:

```bash
npm run build
```

## Build local para GitHub Pages

Como o GitHub Pages não terá `data/source/*.xlsx`, use o build baseado apenas no JSON público já versionado:

```bash
npm run build:pages
```

Esse comando roda:

```text
npm run validate:data && vite build
```

## Publicar no GitHub Pages

O workflow foi criado em:

```text
.github/workflows/deploy.yml
```

Ele:

- dispara em `push` para `main`;
- instala dependências;
- roda `npm run build:pages`;
- publica `dist/` no GitHub Pages.

## Ajuste do `base` no Vite

O arquivo `vite.config.js` usa a variável:

```text
VITE_GITHUB_PAGES_BASE
```

Para GitHub Pages, essa base deve ser igual ao nome do repositório, com barras:

- se o repositório for `dashboard-stf`, use `"/dashboard-stf/"`
- se o repositório for `controle-stf-atos-presidenciais`, use `"/controle-stf-atos-presidenciais/"`

No workflow, basta definir essa variável no passo de build. Se você preferir fixar diretamente no `vite.config.js`, substitua o fallback por uma dessas opções.

## Pré-visualizar a build

```bash
npm run preview
```
