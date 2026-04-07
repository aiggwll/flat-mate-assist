import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  headline: string;
  subtext: string;
  buttonLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ icon: Icon, headline, subtext, buttonLabel, onAction }: EmptyStateProps) => (
  <div className="bg-[#F0FDF4] border border-dashed border-[#C6E8D4] rounded-2xl p-14 text-center space-y-4">
    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
      <Icon className="h-7 w-7 text-primary" />
    </div>
    <p className="text-base font-semibold text-foreground">{headline}</p>
    <p className="text-[13px] text-muted-foreground max-w-sm mx-auto">{subtext}</p>
    {buttonLabel && onAction && (
      <Button onClick={onAction} className="mt-2 max-w-[240px] w-full">
        {buttonLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
