import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DwelloLogo from "@/components/DwelloLogo";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const errorDescription = url.searchParams.get("error_description") || hashParams.get("error_description");
        const code = url.searchParams.get("code");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (errorDescription) {
          setErrorMsg(errorDescription);
          setStatus("error");
          return;
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("Auth code exchange error:", exchangeError);
            setErrorMsg(exchangeError.message);
            setStatus("error");
            return;
          }
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            console.error("Auth token session error:", sessionError);
            setErrorMsg(sessionError.message);
            setStatus("error");
            return;
          }
        }

        localStorage.setItem("rememberMe", "true");
        sessionStorage.setItem("activeSession", "true");
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          setErrorMsg(error.message);
          setStatus("error");
          return;
        }

        if (session?.user) {
          setStatus("success");
          // Determine target route from profile
          let target = "/dashboard";
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("user_id", session.user.id)
              .single();
            if (profile?.role === "tenant") target = "/tenant-dashboard";
          } catch {}

          setTimeout(() => navigate(target, { replace: true }), 2000);
        } else {
          const hash = window.location.hash;
          if (hash.includes("type=signup") || hash.includes("type=email") || url.searchParams.get("type") === "signup") {
            setStatus("success");
            setTimeout(() => navigate("/login", { replace: true }), 2500);
          } else {
            setStatus("error");
            setErrorMsg("Die Sitzung konnte nicht hergestellt werden.");
          }
        }
      } catch (err) {
        console.error("Auth callback exception:", err);
        setStatus("error");
        setErrorMsg("Ein unerwarteter Fehler ist aufgetreten.");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <DwelloLogo variant="light" size="lg" showIcon={false} />

        {status === "loading" && (
          <div className="space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">E-Mail wird bestätigt…</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
            <h2 className="text-xl font-heading font-bold text-foreground">
              E-Mail erfolgreich bestätigt
            </h2>
            <p className="text-muted-foreground text-sm">
              Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Sie werden weitergeleitet…
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="text-xl font-heading font-bold text-foreground">
              Bestätigung fehlgeschlagen
            </h2>
            <p className="text-muted-foreground text-sm">
              {errorMsg || "Die E-Mail-Bestätigung konnte nicht abgeschlossen werden."}
            </p>
            <Button onClick={() => navigate("/login", { replace: true })} className="w-full">
              Zum Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
