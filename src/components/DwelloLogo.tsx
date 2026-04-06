import { Building2 } from "lucide-react";

interface DwelloLogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  showIcon?: boolean;
}

const sizeConfig = {
  sm: { text: "text-lg", icon: "h-6 w-6", iconInner: "h-3 w-3", gap: "gap-2" },
  md: { text: "text-[22px]", icon: "h-8 w-8", iconInner: "h-4 w-4", gap: "gap-2.5" },
  lg: { text: "text-2xl", icon: "h-8 w-8", iconInner: "h-4 w-4", gap: "gap-2.5" },
  xl: { text: "text-4xl", icon: "h-10 w-10", iconInner: "h-5 w-5", gap: "gap-3" },
};

const DwelloLogo = ({ variant = "light", size = "md", showIcon = true }: DwelloLogoProps) => {
  const s = sizeConfig[size];
  const dwellColor = variant === "dark" ? "#FFFFFF" : "#1a1a1a";
  const oColor = variant === "dark" ? "#FFFFFF" : "#1D9E75";

  return (
    <div className={`flex items-center ${s.gap}`}>
      {showIcon && (
        <div className={`${s.icon} rounded-lg bg-primary flex items-center justify-center`}>
          <Building2 className={`${s.iconInner} text-primary-foreground`} />
        </div>
      )}
      <span
        className={`font-heading ${s.text} tracking-tight`}
        style={{ fontWeight: 600, letterSpacing: "-0.5px" }}
      >
        <span style={{ color: dwellColor }}>Dwell</span>
        <span style={{ color: oColor }}>o</span>
      </span>
    </div>
  );
};

export default DwelloLogo;
