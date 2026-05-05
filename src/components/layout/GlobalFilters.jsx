import { Filter } from "lucide-react";

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="flex min-w-[180px] flex-col gap-2 text-sm text-slate-600">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function GlobalFilters({
  filters,
  options,
  onTypeChange,
  onGovernmentChange,
  onAxisChange,
}) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            <Filter className="h-4 w-4" />
            Exploração interativa
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            Filtros globais do dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Os filtros abaixo se aplicam onde houver dados compatíveis com o recorte
            selecionado.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <SelectField
            label="Tipo de ato"
            value={filters.type}
            onChange={onTypeChange}
            options={options.type}
          />
          <SelectField
            label="Governo"
            value={filters.government}
            onChange={onGovernmentChange}
            options={options.government}
          />
          <SelectField
            label="Eixo temático"
            value={filters.axis}
            onChange={onAxisChange}
            options={options.axis}
          />
        </div>
      </div>
    </div>
  );
}
