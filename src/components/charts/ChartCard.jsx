import { Card, CardContent } from "@/components/ui/card";

export function ChartCard({ title, subtitle, height = "h-[22rem]", children, actions = null }) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
        <div className={`w-full ${height}`}>{children}</div>
      </CardContent>
    </Card>
  );
}
