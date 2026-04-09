import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { TrendingUp, Calendar, CheckCircle2, Clock, AlertCircle, Building2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type TaskType = "rent" | "damage";

interface Task {
  id: string;
  type: TaskType;
  propertyId: string;
  propertyAddress: string;
  unitNumber: string;
  tenantName: string;
  currentRent?: number;
  maxIncrease?: number;
  lastIncreaseDate?: string;
  earliestIncreaseDate?: string;
  rentStatus?: "möglich" | "bald möglich" | "nicht möglich";
  damageTitle?: string;
  damageCategory?: string;
  damageStatus?: string;
  damageDate?: string;
  note: string;
  done: boolean;
}

const rentStatusConfig = {
  "möglich": { color: "bg-accent/10 text-accent border-0", icon: CheckCircle2 },
  "bald möglich": { color: "bg-warning/10 text-warning border-0", icon: Clock },
  "nicht möglich": { color: "bg-muted text-muted-foreground border-0", icon: AlertCircle },
};

const damageStatusColor: Record<string, string> = {
  offen: "bg-destructive/10 text-destructive border-0",
  "in Bearbeitung": "bg-warning/10 text-warning border-0",
};

const TasksPage = () => {
  const [tasks] = useState<Task[]>([]);

  const activeTasks = tasks.filter(t => !t.done);
  const doneTasks = tasks.filter(t => t.done);
  const activeRentTasks = activeTasks.filter(t => t.type === "rent");
  const activeDamageTasks = activeTasks.filter(t => t.type === "damage");

  const markDone = (id: string) => {
    toast.success("Aufgabe aktualisiert");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Aufgaben</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Mieterhöhungen, Schäden und Fristen im Überblick
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{activeDamageTasks.length}</p>
            <p className="text-xs text-muted-foreground">Offene Schäden</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {activeRentTasks.filter(t => t.rentStatus === "möglich").length}
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
              {activeRentTasks.filter(t => t.rentStatus === "bald möglich").length}
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
              {formatCurrency(activeRentTasks.reduce((sum, t) => sum + (t.maxIncrease ?? 0), 0))}
            </p>
            <p className="text-xs text-muted-foreground">Max. Erhöhungspotenzial</p>
          </div>
        </div>
      </div>

      {/* Damage Tasks */}
      <div className="space-y-3">
        <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Offene Schäden ({activeDamageTasks.length})
        </h2>
        {activeDamageTasks.length === 0 ? (
          <div className="bg-card rounded-xl border p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Keine offenen Schäden</p>
          </div>
        ) : (
          activeDamageTasks.map(task => (
            <div key={task.id} className="bg-card rounded-xl border p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-semibold text-foreground">{task.damageTitle}</h3>
                      <Badge className={damageStatusColor[task.damageStatus!] ?? ""}>{task.damageStatus}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      <Link to={`/properties/${task.propertyId}`} className="hover:text-foreground transition-colors underline-offset-2 hover:underline">
                        {task.propertyAddress}
                      </Link>
                      {" "}– Whg. {task.unitNumber} · {task.tenantName}
                    </p>
                    <p className="text-sm text-foreground/80 mt-2">{task.note}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => markDone(task.id)} className="shrink-0">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Erledigt
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rent Tasks */}
      <div className="space-y-3">
        <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          Mieterhöhungen ({activeRentTasks.length})
        </h2>
        {activeRentTasks.length === 0 ? (
          <div className="bg-card rounded-xl border p-10 text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Keine Mieterhöhungen geplant</p>
          </div>
        ) : (
          activeRentTasks.map(task => {
            const cfg = rentStatusConfig[task.rentStatus!];
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
                          <Link to={`/properties/${task.propertyId}`} className="hover:underline underline-offset-2">
                            {task.propertyAddress}
                          </Link>
                          {" "}– Whg. {task.unitNumber}
                        </h3>
                        <Badge variant="secondary" className={cfg.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {task.rentStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Mieter: {task.tenantName} · Aktuelle Miete: {formatCurrency(task.currentRent ?? 0)}/M
                      </p>
                      <p className="text-sm text-foreground/80 mt-2">{task.note}</p>
                      {task.rentStatus === "möglich" && (
                        <p className="text-sm font-medium text-accent mt-1">
                          Mögliche Erhöhung: bis zu {formatCurrency(task.maxIncrease ?? 0)}/M
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => markDone(task.id)} className="shrink-0">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Erledigt
                  </Button>
                </div>
              </div>
            );
          })
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
                      {task.type === "damage" ? task.damageTitle : `${task.propertyAddress} – Whg. ${task.unitNumber}`}
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
