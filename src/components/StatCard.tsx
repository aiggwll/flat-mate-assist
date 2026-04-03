import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: boolean;
  subtitle?: string;
}

const StatCard = ({ title, value, icon: Icon, accent, subtitle }: StatCardProps) => {
  return (
    <div className="bg-card rounded-2xl border p-5 shadow-sm animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-2xl font-heading font-bold mt-1 ${accent ? "text-accent" : "text-foreground"}`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent ? "bg-accent/10 text-accent" : "bg-primary/5 text-primary"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
