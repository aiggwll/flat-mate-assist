import { useState } from "react";
import { ClipboardCheck, TrendingUp, Calendar, CheckCircle2, Clock, AlertCircle, Building2 } from "lucide-react";
import { properties } from "@/lib/dummy-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Task {
  id: string;
  propertyAddress: string;
  unitNumber: string;
  tenantName: string;
  currentRent: number;
  maxIncrease: number;
  lastIncreaseDate: string;
  earliestIncreaseDate: string;
  status: "möglich" | "bald möglich" | "nicht möglich";
  note: string;
  done: boolean;
}

const generateRentTasks = (): Task[] => {
  const tasks: Task[] = [];
  const now = new Date();

  properties.forEach(p => {
    p.units.forEach(u => {
      if (!u.tenant) return;

      const moveIn = new Date(u.tenant.moveInDate);
      const monthsSinceMoveIn = (now.getFullYear() - moveIn.getFullYear()) * 12 + (now.getMonth() - moveIn.getMonth());

      // German law: rent increase possible after 15 months, max 20% in 3 years (Kappungsgrenze)
      const lastIncrease = new Date(moveIn);
      lastIncrease.setMonth(lastIncrease.getMonth() + Math.max(0, monthsSinceMoveIn - 6));
      const earliest = new Date(lastIncrease);
      earliest.setMonth(earliest.getMonth() + 15);

      const maxPercent = 20;
      const maxAmount = Math.round(u.rent * (maxPercent / 100));

      let status: Task["status"];
      let note: string;

      if (earliest <= now) {
        status = "möglich";
        note = `Mieterhöhung seit ${earliest.toLocaleDateString("de-DE")} möglich. Max. ${maxPercent}% (${maxAmount} €) in 3 Jahren gem. §558 BGB.`;
      } else {
        const monthsUntil = (earliest.getFullYear() - now.getFullYear()) * 12 + (earliest.getMonth() - now.getMonth());
        if (monthsUntil <= 3) {
          status = "bald möglich";
          note = `Mieterhöhung ab ${earliest.toLocaleDateString("de-DE")} möglich (in ${monthsUntil} Monaten). Kappungsgrenze: ${maxPercent}%.`;
        } else {
          status = "nicht möglich";
          note = `Nächste Mieterhöhung frühestens ab ${earliest.toLocaleDateString("de-DE")}. Sperrfrist läuft noch ${monthsUntil} Monate.`;
        }
      }

      tasks.push({
        id: `task-${u.id}`,
        propertyAddress: p.address,
        unitNumber: u.number,
        tenantName: u.tenant.name,
        currentRent: u.rent,
        maxIncrease: maxAmount,
        lastIncreaseDate: lastIncrease.toISOString().split("T")[0],
        earliestIncreaseDate: earliest.toISOString().split("T")[0],
        status,
        note,
        done: false,
      });
    });
  });

  return tasks.sort((a, b) => {
    const order = { "möglich": 0, "bald möglich": 1, "nicht möglich": 2 };
    return order[a.status] - order[b.status];
  });
};

const statusConfig = {
  "möglich": { color: "bg-accent/10 text-accent border-0", icon: CheckCircle2 },
  "bald möglich": { color: "bg-warning/10 text-warning border-0", icon: Clock },
  "nicht möglich": { color: "bg-muted text-muted-foreground border-0", icon: AlertCircle },
};

const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>(generateRentTasks);

  const markDone = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    toast.success("Aufgabe aktualisiert");
  };

  const activeTasks = tasks.filter(t => !t.done);
  const doneTasks = tasks.filter(t => t.done);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Aufgaben</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mieterhöhungen und Fristen im Überblick
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {tasks.filter(t => t.status === "möglich").length}
            </p>
            <p className="text-xs text-muted-foreground">Erhöhung möglich</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {tasks.filter(t => t.status === "bald möglich").length}
            </p>
            <p className="text-xs text-muted-foreground">Bald möglich</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {tasks.reduce((sum, t) => sum + t.maxIncrease, 0).toLocaleString("de-DE")} €
            </p>
            <p className="text-xs text-muted-foreground">Max. Erhöhungspotenzial</p>
          </div>
        </div>
      </div>

      {/* Active Tasks */}
      <div className="space-y-3">
        <h2 className="font-heading font-semibold text-foreground">
          Offene Aufgaben ({activeTasks.length})
        </h2>
        {activeTasks.map(task => {
          const cfg = statusConfig[task.status];
          const StatusIcon = cfg.icon;
          return (
            <div key={task.id} className="bg-card rounded-xl border p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-semibold text-foreground">
                        {task.propertyAddress} – Whg. {task.unitNumber}
                      </h3>
                      <Badge variant="secondary" className={cfg.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {task.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Mieter: {task.tenantName} · Aktuelle Miete: {task.currentRent.toLocaleString("de-DE")} €/M
                    </p>
                    <p className="text-sm text-foreground/80 mt-2">{task.note}</p>
                    {task.status === "möglich" && (
                      <p className="text-sm font-medium text-accent mt-1">
                        Mögliche Erhöhung: bis zu {task.maxIncrease.toLocaleString("de-DE")} €/M
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markDone(task.id)}
                  className="shrink-0"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Erledigt
                </Button>
              </div>
            </div>
          );
        })}
        {activeTasks.length === 0 && (
          <p className="text-muted-foreground text-sm py-8 text-center">Keine offenen Aufgaben.</p>
        )}
      </div>

      {/* Done Tasks */}
      {doneTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading font-semibold text-muted-foreground">
            Erledigte Aufgaben ({doneTasks.length})
          </h2>
          {doneTasks.map(task => (
            <div key={task.id} className="bg-card rounded-xl border p-5 opacity-60">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground line-through">
                      {task.propertyAddress} – Whg. {task.unitNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">{task.tenantName}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => markDone(task.id)}>
                  Wiederherstellen
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TasksPage;
