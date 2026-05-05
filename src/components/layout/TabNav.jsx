import { Button } from "@/components/ui/button";

export function TabNav({ tabs, activeTab, onChange }) {
  return (
    <div className="sticky top-4 z-20 mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-white/60 bg-white/85 p-2 shadow-sm backdrop-blur">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <Button
            key={tab.id}
            variant={isActive ? "default" : "ghost"}
            className={`shrink-0 rounded-xl ${isActive ? "bg-slate-900 text-white" : "text-slate-700"}`}
            onClick={() => onChange(tab.id)}
          >
            <Icon className="mr-2 h-4 w-4" />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
}
