import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlignJustify, MessageSquareMore, FileText, Receipt } from "lucide-react";

const slides = [
  {
    icon: AlignJustify,
    iconBg: "#E8F5E9",
    iconColor: "#2D6A4F",
    headline: "Deine Immobilien. Vollautomatisch verwaltet.",
    subtext: "Alle Wohnungen, Mieter und Dokumente — an einem Ort.",
  },
  {
    icon: MessageSquareMore,
    iconBg: "#F3E8FF",
    iconColor: "#7C3AED",
    headline: "Dein Mieter schreibt. Dwello antwortet.",
    subtext: "Der integrierte KI-Agent übernimmt die Kommunikation — du entscheidest nur noch, was wirklich wichtig ist.",
  },
  {
    icon: FileText,
    iconBg: "#FFF0EB",
    iconColor: "#EA4C2A",
    headline: "Nebenkostenabrechnung. Ohne Stress.",
    subtext: "Was früher Stunden gedauert hat, erledigst du jetzt in wenigen Minuten.",
  },
  {
    icon: Receipt,
    iconBg: "#FFF8E1",
    iconColor: "#F59E0B",
    headline: "Steuer-Export. Ein Klick. Fertig.",
    subtext: "Alle relevanten Belege gesammelt und aufbereitet — direkt für deinen Steuerberater.",
  },
];

const WelcomeSlider = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const finish = (highlight = false) => {
    localStorage.setItem("dwello_welcome_seen", "true");
    navigate("/dashboard" + (highlight ? "?setup=1" : ""));
  };

  const isLast = current === slides.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-muted/80">
      {/* Skip link */}
      <button
        onClick={() => finish(false)}
        className="absolute top-6 right-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Überspringen
      </button>

      {/* Slider viewport */}
      <div className="w-full max-w-[360px] mx-4 overflow-hidden">
        <div
          className="flex transition-transform duration-400 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((slide, i) => {
            const Icon = slide.icon;
            return (
              <div key={i} className="w-full flex-shrink-0 px-0.5">
                <div className="bg-card rounded-2xl shadow-md p-8 flex flex-col items-center text-center">
                  {/* Icon */}
                  <div
                    className="h-14 w-14 rounded-xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: slide.iconBg }}
                  >
                    <Icon className="h-7 w-7" style={{ color: slide.iconColor }} />
                  </div>

                  {/* Text */}
                  <h2 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                    {slide.headline}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-8 max-w-[280px]">
                    {slide.subtext}
                  </p>

                  {/* Dots */}
                  <div className="flex gap-2 mb-6">
                    {slides.map((_, di) => (
                      <div
                        key={di}
                        className={`h-2 w-2 rounded-full transition-colors ${
                          di === i ? "bg-foreground" : "bg-border"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Button */}
                  {i === slides.length - 1 ? (
                    <button
                      onClick={finish}
                      className="w-full py-3 rounded-xl font-semibold text-white transition-colors"
                      style={{ backgroundColor: "#2D6A4F" }}
                    >
                      Loslegen
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrent(i + 1)}
                      className="w-full py-3 rounded-xl font-medium border border-border bg-card text-foreground hover:bg-muted transition-colors"
                    >
                      Weiter
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WelcomeSlider;
