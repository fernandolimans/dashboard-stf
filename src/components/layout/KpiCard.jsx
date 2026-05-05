import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({ icon: Icon, label, value, detail, accent = "bg-slate-100 text-slate-700" }) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white/95 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
            {detail && <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>}
          </div>
          {Icon && (
            <div className={`rounded-2xl p-3 ${accent}`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
