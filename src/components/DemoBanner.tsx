import { useDemo } from "@/contexts/DemoContext";

const DemoBanner = () => {
  const { isDemo } = useDemo();
  if (!isDemo) return null;

  return (
    <div
      className="w-full flex items-center justify-center gap-4 px-4 text-[13px] border-b"
      style={{
        height: 36,
        backgroundColor: "#FFF8E7",
        borderBottomColor: "#F0D080",
        color: "#8B6914",
      }}
    >
      <span>Testversion – Ihre Daten werden nicht gespeichert</span>
      <a
        href="mailto:hallo@dwello.pro?subject=dwello%20Testversion%20Feedback"
        className="font-medium underline hover:no-underline"
        style={{ color: "#8B6914" }}
      >
        Feedback geben
      </a>
    </div>
  );
};

export default DemoBanner;
