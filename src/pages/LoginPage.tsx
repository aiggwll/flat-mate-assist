import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-primary flex">
      <div className="flex-1 hidden lg:flex items-center justify-center p-12">
        <div className="max-w-md">
          <h1 className="text-4xl font-heading font-bold text-primary-foreground mb-4 tracking-tight">
            Will<span className="text-accent">Prop</span>
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Die All-in-One Plattform für private Vermieter. Verwalten Sie Ihre Immobilien, kommunizieren Sie mit Mietern und behalten Sie den Überblick.
          </p>
          <div className="mt-8 space-y-4">
            {["Immobilien einfach verwalten", "Direkte Kommunikation mit Mietern", "Schadenmeldungen digital organisieren"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-primary-foreground/60">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background rounded-l-3xl lg:max-w-lg">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-heading font-bold text-foreground">
              Will<span className="text-accent">Prop</span>
            </h1>
          </div>

          <h2 className="text-2xl font-heading font-bold text-foreground">
            {isLogin ? "Willkommen zurück" : "Konto erstellen"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1 mb-6">
            {isLogin ? "Melden Sie sich an, um fortzufahren." : "Erstellen Sie Ihr WillProp Konto."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Max Mustermann" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" placeholder="name@beispiel.de" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="role">Rolle</Label>
                <select id="role" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="owner">Eigentümer</option>
                  <option value="tenant">Mieter</option>
                </select>
              </div>
            )}
            {isLogin && (
              <button type="button" className="text-sm text-accent hover:underline">
                Passwort vergessen?
              </button>
            )}
            <Button type="submit" className="w-full">
              {isLogin ? "Anmelden" : "Registrieren"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Noch kein Konto?" : "Bereits registriert?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-accent font-medium hover:underline">
              {isLogin ? "Jetzt registrieren" : "Anmelden"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
