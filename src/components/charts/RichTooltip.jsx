export function RichTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) {
    return null;
  }

  const items = formatter ? formatter(payload, label) : payload;

  return (
    <div className="max-w-xs rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-xl">
      {label && <p className="font-semibold text-slate-950">{label}</p>}
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div key={`${item.label}-${item.value}`} className="flex items-start justify-between gap-4">
            <span className="text-slate-500">{item.label}</span>
            <span className="text-right font-medium text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
